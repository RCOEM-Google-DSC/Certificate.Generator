import { ConfigManager } from './config';
import { CertificateGenerator } from './certificate-generator';
import { DataLoader } from './data-loader';
import { Logger, LogLevel } from './logger';

async function main() {
  const logger = new Logger(LogLevel.INFO);

  try {
    // Load configuration from environment
    const config = ConfigManager.loadConfig();

    logger.info(`🔧 Configuration loaded:`);
    logger.info(`   Mode: ${config.mode}`);
    logger.info(`   Font Size: ${config.fontSize}`);
    logger.info(
      `   Font Color: RGB(${config.fontColor.r}, ${config.fontColor.g}, ${config.fontColor.b})`
    );
    logger.info(`   Concurrency: ${config.concurrency}`);
    logger.info(`   Output Directory: ${config.outputDir}`);

    if (config.mode === 'test' && config.testName) {
      logger.info(`   Test Name: ${config.testName}`);
    }

    // Generator options
    const generatorOptions = {
      templatePath: config.templatePath,
      fontPath: config.fontPath,
      outputDir: config.outputDir,
      defaultFontSize: config.fontSize,
      defaultFontColor: config.fontColor,
      concurrency: config.concurrency,
      mode: config.mode,
      testName: config.testName,
    };

    // Load data based on mode
    const dataLoader = new DataLoader();
    const certificateConfigs = dataLoader.loadCertificateConfigs(config);

    // Initialize generator
    const generator = new CertificateGenerator(generatorOptions);

    // Generate certificates
    const startTime = Date.now();
    const results = await generator.generateCertificates(certificateConfigs);
    const endTime = Date.now();

    // Report results
    logger.info(`\n🎉 === Generation Complete ===`);
    logger.info(`⏱️  Duration: ${(endTime - startTime) / 1000}s`);
    logger.info(`✅ Successful: ${results.successful.length}`);
    logger.info(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      logger.error('\n❌ Failed certificates:');
      results.failed.forEach(({ config, error }) => {
        logger.error(
          `   - ${config.name}${config.email ? ` (${config.email})` : ''}: ${
            error.message
          }`
        );
      });
    }

    if (results.successful.length > 0) {
      logger.success(
        `\n📁 Generated certificates saved in: ${config.outputDir}`
      );
      logger.info('📋 Generated files:');
      results.successful.forEach((path) => {
        logger.info(`   - ${path}`);
      });
    }

    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    logger.error('💥 Application failed to start:', error);
    process.exit(1);
  }
}

// Run the application
if (import.meta.main) {
  main().catch((error) => {
    console.error('🔥 Unhandled error:', error);
    process.exit(1);
  });
}
