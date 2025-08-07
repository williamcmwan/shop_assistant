import { ExtractionConfig, getExtractionConfig, validateConfig } from './config';
import { OCRService, OCRExtractionResult } from './ocr-service';
import { GeminiService, GeminiExtractionResult } from './gemini-service';

export interface ExtractionResult {
  success: boolean;
  productName: string;
  price: number;
  confidence: number;
  backend: string;
  error?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  rawResponse?: any;
  discount?: {
    type: "bulk_price" | "buy_x_get_y";
    quantity: number;
    value: number;
    display: string;
  };
}

export class ExtractionService {
  private config: ExtractionConfig;
  private ocrService?: OCRService;
  private geminiService?: GeminiService;
  private initialized = false;

  constructor() {
    this.config = getExtractionConfig();
    console.log('🔧 Extraction service created with backend:', this.config.backend);
  }

  private initializeServices() {
    if (this.initialized) return;

    const errors = validateConfig(this.config);
    
    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    this.ocrService = new OCRService(this.config);
    this.geminiService = new GeminiService(this.config);
    this.initialized = true;
    
    console.log('✅ Extraction services initialized');
  }

  async extractProductInfo(imageData: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting extraction with backend: ${this.config.backend}`);
      
      // Initialize services (this will validate config and throw if invalid)
      this.initializeServices();
      
      switch (this.config.backend) {
        case 'ocr':
          return await this.extractWithOCR(imageData);
          
        case 'gemini':
          return await this.extractWithGemini(imageData);
          
        case 'gemini_fallback':
          return await this.extractWithGeminiFallback(imageData);
          
        default:
          throw new Error(`Unknown backend: ${this.config.backend}`);
      }
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      return {
        success: false,
        productName: '',
        price: 0,
        confidence: 0,
        backend: this.config.backend,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      const duration = Date.now() - startTime;
      console.log(`⏱️ Extraction completed in ${duration}ms`);
    }
  }

  private async extractWithOCR(imageData: string): Promise<ExtractionResult> {
    console.log('📷 Using OCR-Space API only');
    
    if (!this.ocrService) {
      throw new Error('OCR service not initialized');
    }
    
    const result = await this.ocrService.extractProductInfo(imageData);
    
    return {
      success: result.success,
      productName: result.productName,
      price: result.price,
      confidence: result.confidence,
      backend: 'ocr',
      error: result.error,
      rawResponse: result.rawResponse,
      discount: result.discount
    };
  }

  private async extractWithGemini(imageData: string): Promise<ExtractionResult> {
    console.log('🤖 Using Gemini API only');
    
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }
    
    const result = await this.geminiService.extractProductInfo(imageData);
    
    return {
      success: result.success,
      productName: result.productName,
      price: result.price,
      confidence: result.confidence,
      backend: 'gemini',
      error: result.error,
      rawResponse: result.rawResponse,
      discount: result.discount
    };
  }

  private async extractWithGeminiFallback(imageData: string): Promise<ExtractionResult> {
    console.log('🤖 Using Gemini API with OCR fallback');
    
    if (!this.geminiService || !this.ocrService) {
      throw new Error('Services not initialized');
    }
    
    // Try Gemini first
    const geminiResult = await this.geminiService.extractProductInfo(imageData);
    
    if (geminiResult.success && geminiResult.confidence > 0.3) {
      console.log('✅ Gemini extraction successful, no fallback needed');
      return {
        success: true,
        productName: geminiResult.productName,
        price: geminiResult.price,
        confidence: geminiResult.confidence,
        backend: 'gemini',
        rawResponse: geminiResult.rawResponse,
        discount: geminiResult.discount
      };
    }
    
    // Fallback to OCR
    console.log('⚠️ Gemini failed or low confidence, falling back to OCR');
    const ocrResult = await this.ocrService.extractProductInfo(imageData);
    
    return {
      success: ocrResult.success,
      productName: ocrResult.productName,
      price: ocrResult.price,
      confidence: ocrResult.confidence,
      backend: 'ocr',
      fallbackUsed: true,
      fallbackReason: geminiResult.error || `Low confidence: ${geminiResult.confidence}`,
      error: ocrResult.error,
      discount: ocrResult.discount || geminiResult.discount, // Use OCR discount if available, otherwise Gemini
      rawResponse: {
        gemini: geminiResult.rawResponse,
        ocr: ocrResult.rawResponse
      }
    };
  }

  getBackendInfo(): { backend: string; model?: string; configured: boolean } {
    const errors = validateConfig(this.config);
    return {
      backend: this.config.backend,
      model: this.config.backend.includes('gemini') ? this.config.geminiModel : undefined,
      configured: errors.length === 0
    };
  }
} 