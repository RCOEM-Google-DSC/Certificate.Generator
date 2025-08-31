import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Color } from "pdf-lib";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type {
  CertificateConfig,
  GeneratorOptions,
  RGB,
  Position,
} from "./types";
import {
  CertificateGeneratorError,
  FileNotFoundError,
  InvalidConfigError,
} from "./errors";
import { FileUtil } from "./utils";
import { Logger } from "./logger";

export class CertificateGenerator {
  private logger: Logger;
  private templateBuffer!: Buffer;
  private fontBuffer!: Buffer;

  constructor(private options: GeneratorOptions) {
    this.logger = new Logger();
    this.validateOptions();
    this.loadAssets();
  }

  private validateOptions(): void {
    const { templatePath, fontPath, outputDir, concurrency, mode, testName } =
      this.options;

    if (!templatePath || !fontPath || !outputDir) {
      throw new InvalidConfigError(
        "templatePath, fontPath, and outputDir are required"
      );
    }

    if (concurrency <= 0) {
      throw new InvalidConfigError("concurrency must be greater than 0");
    }

    if (mode === "test" && (!testName || testName.trim().length === 0)) {
      throw new InvalidConfigError('testName is required when mode is "test"');
    }

    FileUtil.validateFilesExist([templatePath, fontPath]);
    FileUtil.ensureDir(outputDir);
  }

  private loadAssets(): void {
    try {
      this.templateBuffer = readFileSync(this.options.templatePath);
      this.fontBuffer = readFileSync(this.options.fontPath);
      this.logger.success("Assets loaded successfully");
    } catch (error) {
      throw new FileNotFoundError(
        "Failed to load required assets",
        error as Error
      );
    }
  }

  private wrapRGB(color: RGB): Color {
    return rgb(color.r / 255, color.g / 255, color.b / 255);
  }

  private calculateTextPosition(
    text: string,
    fontSize: number,
    pageWidth: number,
    pageHeight: number,
    customPosition?: Position
  ): Position {
    if (customPosition) {
      return customPosition;
    }

    // Center the text (approximation)
    const textWidth = text.length * fontSize * 0.6; // Rough estimation
    return {
      x: Math.max(0, (pageWidth - textWidth) / 2),
      y: pageHeight / 2 - fontSize / 2,
    };
  }

  private generateOutputPath(config: CertificateConfig): string {
    if (config.outputPath) {
      return config.outputPath;
    }

    const sanitizedName = FileUtil.sanitizeFilename(config.name);
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Include email in filename for production mode (sanitized)
    let filename = sanitizedName;
    if (config.email && this.options.mode === "production") {
      const sanitizedEmail = FileUtil.sanitizeFilename(config.email);
      filename = `${sanitizedName}_${sanitizedEmail}`;
    }

    return join(this.options.outputDir, `${filename}_${timestamp}.pdf`);
  }

  private validateCertificateConfig(config: CertificateConfig): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new InvalidConfigError("Certificate name cannot be empty");
    }

    if (config.fontSize && (config.fontSize <= 0 || config.fontSize > 200)) {
      throw new InvalidConfigError("Font size must be between 1 and 200");
    }

    if (
      this.options.mode === "production" &&
      (!config.email || config.email.trim().length === 0)
    ) {
      throw new InvalidConfigError("Email is required in production mode");
    }
  }

  /**
   * Generates a single certificate PDF.
   */
  public async generateCertificate(config: CertificateConfig): Promise<string> {
    this.validateCertificateConfig(config);

    try {
      // Load and prepare PDF
      const pdfDoc = await PDFDocument.load(this.templateBuffer);
      pdfDoc.registerFontkit(fontkit);

      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new CertificateGeneratorError("Template PDF has no pages");
      }

      const firstPage = pages[0];
      if (!firstPage) {
        throw new CertificateGeneratorError(
          "Template PDF has no valid first page"
        );
      }
      const fontSize = config.fontSize || this.options.defaultFontSize;
      const fontColor = config.fontColor || this.options.defaultFontColor;

      // Calculate text position
      const position = this.calculateTextPosition(
        config.name,
        fontSize,
        firstPage.getWidth(),
        firstPage.getHeight(),
        config.position
      );

      // Embed font and draw text
      const customFont = await pdfDoc.embedFont(this.fontBuffer, {
        subset: true,
      });

      firstPage.drawText(config.name, {
        x: position.x,
        y: position.y,
        size: fontSize,
        font: customFont,
        color: this.wrapRGB(fontColor),
      });

      // Generate output path and ensure directory exists
      const outputPath = this.generateOutputPath(config);
      FileUtil.ensureDirForFile(outputPath);

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      writeFileSync(outputPath, pdfBytes);

      this.logger.success(
        `Certificate generated: ${config.name}${
          config.email ? ` (${config.email})` : ""
        }`
      );
      return outputPath;
    } catch (error) {
      const errorMessage = `Failed to generate certificate for: ${config.name}`;
      this.logger.error(errorMessage, error);

      if (error instanceof CertificateGeneratorError) {
        throw error;
      }

      throw new CertificateGeneratorError(errorMessage, error as Error);
    }
  }

  /**
   * Generates multiple certificates with controlled concurrency.
   */
  public async generateCertificates(configs: CertificateConfig[]): Promise<{
    successful: string[];
    failed: Array<{ config: CertificateConfig; error: Error }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ config: CertificateConfig; error: Error }> = [];

    this.logger.info(
      `🚀 Starting ${this.options.mode} mode batch generation of ${configs.length} certificates`
    );

    // Process in chunks based on concurrency limit
    for (let i = 0; i < configs.length; i += this.options.concurrency) {
      const chunk = configs.slice(i, i + this.options.concurrency);

      const promises = chunk.map(async (config) => {
        try {
          const outputPath = await this.generateCertificate(config);
          return { success: true, outputPath, config };
        } catch (error) {
          return { success: false, error: error as Error, config };
        }
      });

      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result.success && result.outputPath !== undefined) {
          successful.push(result.outputPath);
        } else {
          failed.push({
            config: result.config,
            error: result.error ?? new Error("Unknown error"),
          });
        }
      });

      // Log progress
      const processed = Math.min(i + this.options.concurrency, configs.length);
      this.logger.info(
        `📊 Progress: ${processed}/${configs.length} certificates processed`
      );
    }

    return { successful, failed };
  }
}
