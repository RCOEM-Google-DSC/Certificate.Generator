import type { CertificateConfig, PersonData, AppConfig } from './types';
import { FileUtil } from './utils';
import { Logger } from './logger';

export class DataLoader {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Loads certificate configurations based on mode.
   */
  public loadCertificateConfigs(config: AppConfig): CertificateConfig[] {
    if (config.mode === 'test') {
      return this.loadTestModeConfigs(config);
    } else {
      return this.loadProductionModeConfigs(config);
    }
  }

  private loadTestModeConfigs(config: AppConfig): CertificateConfig[] {
    if (!config.testName) {
      throw new Error(
        'TEST_NAME environment variable is required in test mode'
      );
    }

    this.logger.info(
      `🧪 Test mode: Generating certificate for "${config.testName}"`
    );

    return [
      {
        name: config.testName,
        fontSize: config.fontSize,
        fontColor: config.fontColor,
      },
    ];
  }

  private loadProductionModeConfigs(config: AppConfig): CertificateConfig[] {
    this.logger.info(
      `📊 Production mode: Loading data from ${config.emailsJsonPath}`
    );

    const personData = FileUtil.loadPersonData(config.emailsJsonPath);

    this.logger.info(`✅ Loaded ${personData.length} records from JSON file`);

    // Log some statistics
    const uniqueNames = new Set(personData.map((p) => p.name)).size;
    this.logger.info(
      `📈 Statistics: ${uniqueNames} unique names, ${personData.length} total entries`
    );

    return personData.map((person) => ({
      name: person.name,
      email: person.email,
      fontSize: config.fontSize,
      fontColor: config.fontColor,
    }));
  }
}
