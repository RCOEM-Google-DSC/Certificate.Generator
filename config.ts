import { join } from 'path';
import type { AppConfig, RGB } from './types';

export class ConfigManager {
  private static parseColor(colorStr: string): RGB {
    // Support formats: "93,97,103" or "#5d6167" or "rgb(93,97,103)"
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }

    if (colorStr.startsWith('rgb(')) {
      const values = colorStr.match(/\d+/g);
      if (values && values.length >= 3) {
        return {
          r: parseInt(values[0] ?? '0'),
          g: parseInt(values[1] ?? '0'),
          b: parseInt(values[2] ?? '0'),
        };
      }
    }

    // Default format: "93,97,103"
    const [r, g, b] = colorStr.split(',').map((s) => parseInt(s.trim()));
    return { r: r || 0, g: g || 0, b: b || 0 };
  }

  public static loadConfig(): AppConfig {
    const mode = (process.env.NODE_ENV || process.env.MODE || 'production') as
      | 'test'
      | 'production';

    return {
      mode,
      fontSize: parseInt(process.env.FONT_SIZE || '54'),
      fontColor: this.parseColor(process.env.FONT_COLOR || '93,97,103'),
      concurrency: parseInt(process.env.CONCURRENCY || '3'),
      testName: process.env.TEST_NAME,
      templatePath:
        process.env.TEMPLATE_PATH ||
        join(process.cwd(), 'assets', 'certificate-template.pdf'),
      fontPath:
        process.env.FONT_PATH || join(process.cwd(), 'assets', 'font.ttf'),
      emailsJsonPath:
        process.env.EMAILS_JSON_PATH || join(process.cwd(), 'emails.json'),
      outputDir:
        process.env.OUTPUT_DIR || join(process.cwd(), 'output', 'certificates'),
    };
  }
}
