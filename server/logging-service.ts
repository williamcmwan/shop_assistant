import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface APICallLog {
  timestamp: string;
  api: 'OCR' | 'Gemini';
  elapsedTime: number;
  productName: string;
  price: number;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  error?: string;
}

export class LoggingService {
  private logsDir: string;
  private failedExtractionsDir: string;
  private csvFilePath: string;

  constructor() {
    // Create logs directory in the server directory (non-web-accessible)
    this.logsDir = path.resolve(__dirname, 'logs');
    this.failedExtractionsDir = path.resolve(this.logsDir, 'failed_extractions');
    this.csvFilePath = path.resolve(this.logsDir, 'api_calls.csv');
    
    this.ensureDirectoriesExist();
    this.initializeCSV();
  }

  private ensureDirectoriesExist(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log(`📁 Created logs directory: ${this.logsDir}`);
      }
      
      if (!fs.existsSync(this.failedExtractionsDir)) {
        fs.mkdirSync(this.failedExtractionsDir, { recursive: true });
        console.log(`📁 Created failed extractions directory: ${this.failedExtractionsDir}`);
      }
    } catch (error) {
      console.error('❌ Error creating logging directories:', error);
    }
  }

  private initializeCSV(): void {
    try {
      if (!fs.existsSync(this.csvFilePath)) {
        const headers = [
          'timestamp',
          'api',
          'elapsed_time_seconds',
          'product_name',
          'price',
          'input_tokens',
          'output_tokens',
          'success',
          'error'
        ].join(',');
        
        fs.writeFileSync(this.csvFilePath, headers + '\n');
        console.log(`📄 Created API calls CSV file: ${this.csvFilePath}`);
      }
    } catch (error) {
      console.error('❌ Error initializing CSV file:', error);
    }
  }

  public logAPICall(logData: APICallLog): void {
    try {
      const csvLine = [
        logData.timestamp,
        logData.api,
        logData.elapsedTime.toFixed(3),
        `"${logData.productName.replace(/"/g, '""')}"`, // Escape quotes in CSV
        logData.price.toFixed(2),
        logData.inputTokens,
        logData.outputTokens,
        logData.success ? 'true' : 'false',
        logData.error ? `"${logData.error.replace(/"/g, '""')}"` : ''
      ].join(',');

      fs.appendFileSync(this.csvFilePath, csvLine + '\n');
      console.log(`📊 Logged API call: ${logData.api} - ${logData.success ? 'SUCCESS' : 'FAILED'} - ${logData.elapsedTime.toFixed(3)}s`);
    } catch (error) {
      console.error('❌ Error logging API call:', error);
    }
  }

  public saveFailedExtractionImage(imageData: string, api: 'OCR' | 'Gemini', error: string): void {
    try {
      // Generate timestamp for filename
      const now = new Date();
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '_' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
      
      const filename = `failed_${timestamp}_${api.toLowerCase()}.jpg`;
      const filePath = path.resolve(this.failedExtractionsDir, filename);

      // Remove data URL prefix if present
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      // Write the image file
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      
      console.log(`💾 Saved failed extraction image: ${filename}`);
      
      // Also save error details in a text file
      const errorFilePath = filePath.replace('.jpg', '.txt');
      const errorDetails = `API: ${api}\nTimestamp: ${now.toISOString()}\nError: ${error}\n`;
      fs.writeFileSync(errorFilePath, errorDetails);
      
    } catch (error) {
      console.error('❌ Error saving failed extraction image:', error);
    }
  }

  public getLogsDirectory(): string {
    return this.logsDir;
  }

  public getFailedExtractionsDirectory(): string {
    return this.failedExtractionsDir;
  }

  public getCSVFilePath(): string {
    return this.csvFilePath;
  }
} 