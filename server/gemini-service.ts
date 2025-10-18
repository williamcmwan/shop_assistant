import { ExtractionConfig } from './config';
import { LoggingService, APICallLog } from './logging-service';

export interface GeminiExtractionResult {
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

      // Image is already optimized on client side, use as-is
      // Prepare the image data (remove data URL prefix if present)
      const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      const requestBody = {
        contents: [{
          parts: [
            {
              text: `Analyze this price tag image and extract the product name, price, any multi-purchase discounts, and pricing type. 
              
              Requirements:
              - Extract the main product name (clean, without store names like "DUNNES STORES", barcodes, or promotional text)
              - Extract the current price in euros (€)
              - If there are multiple prices, prefer the "NOW" or "ONLY" price
              - Handle cents format (e.g., "40c" = €0.40)
              - IMPORTANT: Detect if this is per-KG pricing by looking for text like:
                * "PER KG" (most common)
                * "/KG" 
                * "per kilo"
                * "per kilogram"
                * If you see any of these, set "isPerKg": true
              - Look for multi-purchase discount offers like:
                * "3 for €10", "2 for €5.99" (bulk pricing)
                * "3 for 2", "2 for 1" (buy X get Y offers)
              - Do NOT treat unit price indicators as discounts:
                * "(79.5c each)" - this is just showing per-unit cost
                * "(€1.20 per unit)" - this is not a discount
                * "2 for €3.18 (€1.59 each)" - only the "2 for €3.18" part is a discount
              - Return only the essential product information
              
              EXAMPLE for per-KG items:
              If you see "TOMATOES CLASS 1 HOLLAND PER KG €2.99", return:
              {
                "productName": "TOMATOES CLASS 1 HOLLAND",
                "price": 2.99,
                "confidence": 0.9,
                "isPerKg": true
              }
              
              Format your response as JSON:
              {
                "productName": "Clean product name",
                "price": 1.25,
                "confidence": 0.9,
                "isPerKg": false,
                "discount": {
                  "type": "bulk_price",
                  "quantity": 3,
                  "value": 10.0,
                  "display": "(3 for €10.00)"
                }
              }
              
              Discount types and format examples:
              - "bulk_price" for "3 for €10" → {"type": "bulk_price", "quantity": 3, "value": 10.0, "display": "(3 for €10.00)"}
              - "buy_x_get_y" for "3 for 2" → {"type": "buy_x_get_y", "quantity": 3, "value": 2, "display": "(3 for 2)"}
              
              NOT discounts (do not include):
              - "(79.5c each)" - unit price indicator
              - "(€1.20 per unit)" - unit price indicator
              - "2 for €3.18 (€1.59 each)" - only extract "2 for €3.18" as discount
              
              IMPORTANT: Always include brackets () around the display text.
              
              Only include the discount field if a multi-purchase offer is clearly visible.
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
      
      console.log('📝 Raw Gemini response text:', responseText);
      
      if (!responseText) {
        throw new Error('No response text from Gemini API');
      }

      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response:', responseText);
        throw new Error('No JSON found in Gemini response');
      }
      
      console.log('🔍 Extracted JSON:', jsonMatch[0]);

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
        success: true,
        discount: parsedData.discount?.display
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
        confidence: parsedData.confidence || 0.8,
        isPerKg: parsedData.isPerKg,
        discount: parsedData.discount
      });
      
      console.log('📋 Full parsed data from Gemini:', parsedData);

      const result_response: GeminiExtractionResult = {
        success: true,
        productName: parsedData.productName.trim(),
        price: parseFloat(parsedData.price.toFixed(2)),
        confidence: Math.min(1.0, Math.max(0.0, parsedData.confidence || 0.8)),
        isPerKg: parsedData.isPerKg || false,
        rawResponse: result
      };

      // Add discount information if present
      if (parsedData.discount && 
          parsedData.discount.type && 
          parsedData.discount.quantity && 
          parsedData.discount.value &&
          (parsedData.discount.type === 'bulk_price' || parsedData.discount.type === 'buy_x_get_y')) {
        result_response.discount = {
          type: parsedData.discount.type,
          quantity: parsedData.discount.quantity,
          value: parsedData.discount.value,
          display: parsedData.discount.display || `(${parsedData.discount.quantity} for ${parsedData.discount.type === 'bulk_price' ? '€' + parsedData.discount.value.toFixed(2) : parsedData.discount.value})`
        };
        console.log('✅ Discount detected by Gemini:', result_response.discount);
      }

      return result_response;

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
        // No discount field for failed extractions
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