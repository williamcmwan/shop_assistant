import { ExtractionConfig, getExtractionConfig, validateConfig } from './config';
import { GeminiService } from './gemini-service';

export interface ExtractionResult {
  success: boolean;
  productName: string;
  price: number;
  confidence: number;
  error?: string;
  rawResponse?: any;
  discount?: {
    type: "bulk_price" | "buy_x_get_y";
    quantity: number;
    value: number;
    display: string;
  };
  isPerKg?: boolean;
  productImage?: string;
  cropArea?: {
    centerX: number;
    centerY: number;
    size: number;
  };
}

export class ExtractionService {
  private config: ExtractionConfig;
  private geminiService?: GeminiService;
  private initialized = false;

  constructor() {
    this.config = getExtractionConfig();
    console.log('🔧 Extraction service created using Gemini');
  }

  private initializeServices() {
    if (this.initialized) return;

    const errors = validateConfig(this.config);
    
    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    this.geminiService = new GeminiService(this.config);
    this.initialized = true;
    
    console.log('✅ Gemini service initialized');
  }

  async extractProductInfo(imageData: string, extractPhoto: boolean = true): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting extraction with Gemini');
      
      // Initialize services (this will validate config and throw if invalid)
      this.initializeServices();
      
      return await this.extractWithGemini(imageData, extractPhoto);
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      return {
        success: false,
        productName: '',
        price: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      const duration = Date.now() - startTime;
      console.log(`⏱️ Extraction completed in ${duration}ms`);
    }
  }

  private async extractWithGemini(imageData: string, extractPhoto: boolean = true): Promise<ExtractionResult> {
    console.log('🤖 Using Gemini API');
    
    if (!this.geminiService) {
      throw new Error('Gemini service not initialized');
    }
    
    const result = await this.geminiService.extractProductInfo(imageData, extractPhoto);
    
    return {
      success: result.success,
      productName: result.productName,
      price: result.price,
      confidence: result.confidence,
      error: result.error,
      rawResponse: result.rawResponse,
      discount: result.discount,
      isPerKg: result.isPerKg,
      productImage: result.productImage,
      cropArea: result.cropArea
    };
  }

  getBackendInfo(): { backend: string; model?: string; configured: boolean } {
    const errors = validateConfig(this.config);
    return {
      backend: 'gemini',
      model: this.config.geminiModel,
      configured: errors.length === 0
    };
  }

  async askAI(prompt: string, recentItems: Array<{name: string; price: number; quantity: number}>, currencySymbol?: string): Promise<{ success: boolean; response: string; error?: string }> {
    try {
      // Initialize services (this will validate config and throw if invalid)
      this.initializeServices();
      
      if (!this.geminiService) {
        throw new Error('Gemini service not initialized');
      }
      
      return await this.geminiService.askAI(prompt, recentItems, currencySymbol);
      
    } catch (error) {
      console.error('❌ AI query failed:', error);
      return {
        success: false,
        response: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 