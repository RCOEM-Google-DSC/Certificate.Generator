import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";
import type { PersonData } from "./types";
import { FileNotFoundError, DataValidationError } from "./errors";

export class FileUtil {
  /**
   * Ensures that a directory exists, creating it recursively if needed.
   */
  public static ensureDir(path: string): void {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }

  /**
   * Ensures the directory for a file path exists.
   */
  public static ensureDirForFile(filePath: string): void {
    const dir = dirname(filePath);
    this.ensureDir(dir);
  }

  /**
   * Validates that required files exist.
   */
  public static validateFilesExist(filePaths: string[]): void {
    const missingFiles = filePaths.filter((path) => !existsSync(path));
    if (missingFiles.length > 0) {
      throw new FileNotFoundError(
        `Missing required files: ${missingFiles.join(", ")}`
      );
    }
  }

  /**
   * Sanitizes a filename by removing invalid characters.
   */
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  /**
   * Loads and validates JSON data from file.
   */
  public static loadPersonData(filePath: string): PersonData[] {
    try {
      if (!existsSync(filePath)) {
        throw new FileNotFoundError(filePath);
      }

      const fileContent = readFileSync(filePath, "utf8");
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
        throw new DataValidationError("JSON file must contain an array");
      }

      const validatedData: PersonData[] = [];

      data.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          throw new DataValidationError(
            `Item at index ${index} is not a valid object`
          );
        }

        if (
          !item.name ||
          typeof item.name !== "string" ||
          item.name.trim().length === 0
        ) {
          throw new DataValidationError(
            `Item at index ${index} has invalid or missing name`
          );
        }

        if (
          !item.email ||
          typeof item.email !== "string" ||
          !this.isValidEmail(item.email)
        ) {
          throw new DataValidationError(
            `Item at index ${index} has invalid or missing email: ${item.email}`
          );
        }

        validatedData.push({
          name: item.name.trim(),
          email: item.email.trim().toLowerCase(),
        });
      });

      // Check for duplicate emails
      const emailSet = new Set();
      const duplicates: string[] = [];

      validatedData.forEach((person) => {
        if (emailSet.has(person.email)) {
          duplicates.push(person.email);
        } else {
          emailSet.add(person.email);
        }
      });

      if (duplicates.length > 0) {
        throw new DataValidationError(
          `Duplicate emails found: ${duplicates.join(", ")}`
        );
      }

      return validatedData;
    } catch (error) {
      if (error instanceof Error && error.name.includes("JSON")) {
        throw new DataValidationError(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Simple email validation.
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
