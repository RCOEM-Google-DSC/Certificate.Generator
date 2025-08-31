export class CertificateGeneratorError extends Error {
  constructor(
    message: string,
    public override cause?: Error
  ) {
    super(message);
    this.name = 'CertificateGeneratorError';
  }
}

export class FileNotFoundError extends CertificateGeneratorError {
  constructor(filePath: string, cause?: Error) {
    super(`File not found: ${filePath}`, cause);
    this.name = 'FileNotFoundError';
  }
}

export class InvalidConfigError extends CertificateGeneratorError {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = 'InvalidConfigError';
  }
}

export class DataValidationError extends CertificateGeneratorError {
  constructor(message: string) {
    super(`Data validation error: ${message}`);
    this.name = 'DataValidationError';
  }
}
