import { ExtractionConfig } from './config';
import { LoggingService, APICallLog } from './logging-service';

export interface GeminiExtractionResult {
  success: boolean;
  productName: string;
  price: number;
  confidence: number;
  error?: string;
  rawResponse?: any;
}

export class GeminiService {
  private config: ExtractionConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
  private loggingService: LoggingService;

  constructor(config: ExtractionConfig) {
    this.config = config;
    this.loggingService = new LoggingService();
  }

  async extractProductInfo(imageData: string): Promise<GeminiExtractionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Using Gemini API for extraction...');
      
      if (!this.config.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Prepare the image data (remove data URL prefix if present)
      const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: `Analyze this price tag image and extract the product name and price. 
              
              Requirements:
              - Extract the main product name (clean, without store names, barcodes, or promotional text)
              - Extract the current price in euros (€)
              - If there are multiple prices, prefer the "NOW" or "ONLY" price
              - Handle cents format (e.g., "40c" = €0.40)
              - Return only the essential product information
              
              Format your response as JSON:
              {
                "productName": "Clean product name",
                "price": 1.25,
                "confidence": 0.9
              }
              
              If you cannot extract the information clearly, set confidence to 0.3 or lower.`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 200,
        }
      };

      const url = `${this.baseUrl}/${this.config.geminiModel}:generateContent?key=${this.config.geminiApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Gemini API response:', JSON.stringify(result, null, 2));

      // Extract the response text
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error('No response text from Gemini API');
      }

      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validate the parsed data
      if (typeof parsedData.productName !== 'string' || typeof parsedData.price !== 'number') {
        throw new Error('Invalid data structure in Gemini response');
      }

      const elapsedTime = (Date.now() - startTime) / 1000;
      
      // Extract token counts from Gemini response
      const inputTokens = result.usageMetadata?.promptTokenCount || 0;
      const outputTokens = result.usageMetadata?.candidatesTokenCount || 0;
      
      // Log successful extraction
      const logData: APICallLog = {
        timestamp,
        api: 'Gemini',
        elapsedTime,
        productName: parsedData.productName.trim(),
        price: parseFloat(parsedData.price.toFixed(2)),
        inputTokens,
        outputTokens,
        success: true
      };
      this.loggingService.logAPICall(logData);
      
      // Save image if extraction failed (no product name or price)
      if (!parsedData.productName || parsedData.price === 0) {
        this.loggingService.saveFailedExtractionImage(
          imageData, 
          'Gemini', 
          'No product name or price extracted'
        );
      }

      console.log('✅ Gemini extraction successful:', {
        productName: parsedData.productName,
        price: parsedData.price,
        confidence: parsedData.confidence || 0.8
      });

      return {
        success: true,
        productName: parsedData.productName.trim(),
        price: parseFloat(parsedData.price.toFixed(2)),
        confidence: Math.min(1.0, Math.max(0.0, parsedData.confidence || 0.8)),
        rawResponse: result
      };

    } catch (error) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed extraction
      const logData: APICallLog = {
        timestamp,
        api: 'Gemini',
        elapsedTime,
        productName: '',
        price: 0,
        inputTokens: 0,
        outputTokens: 0,
        success: false,
        error: errorMessage
      };
      this.loggingService.logAPICall(logData);
      
      // Save failed extraction image
      this.loggingService.saveFailedExtractionImage(imageData, 'Gemini', errorMessage);
      
      console.error('❌ Gemini extraction failed:', error);
      return {
        success: false,
        productName: '',
        price: 0,
        confidence: 0,
        error: errorMessage,
        rawResponse: null
      };
    }
  }
} 