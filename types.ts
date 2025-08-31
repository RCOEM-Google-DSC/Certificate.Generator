export interface CertificateConfig {
  name: string;
  email?: string;
  outputPath?: string;
  fontSize?: number;
  fontColor?: RGB;
  position?: Position;
}

export interface PersonData {
  name: string;
  email: string;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface GeneratorOptions {
  templatePath: string;
  fontPath: string;
  outputDir: string;
  defaultFontSize: number;
  defaultFontColor: RGB;
  concurrency: number;
  mode: "test" | "production";
  testName?: string;
}

export interface AppConfig {
  mode: "test" | "production";
  fontSize: number;
  fontColor: RGB;
  concurrency: number;
  testName?: string;
  templatePath: string;
  fontPath: string;
  emailsJsonPath: string;
  outputDir: string;
}
