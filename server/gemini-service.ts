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
  productImage?: string; // Base64 thumbnail of the actual product from the image
  cropArea?: {
    centerX: number; // Center X as percentage (0-100)
    centerY: number; // Center Y as percentage (0-100)
    size: number; // Size as percentage (20-50)
  };
}

export class GeminiService {
  private config: ExtractionConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
  private loggingService: LoggingService;

  constructor(config: ExtractionConfig) {
    this.config = config;
    this.loggingService = new LoggingService();
  }

  // No separate API call needed - we just return the image data for client-side thumbnail creation
  private async createProductThumbnail(imageData: string): Promise<string | undefined> {
    // Simply return the image data - the client will create the thumbnail
    // No additional Gemini API call needed!
    console.log('📸 Using captured image for thumbnail (no additional API call)');
    return imageData;
  }

  async extractProductInfo(imageData: string, extractPhoto: boolean = true): Promise<GeminiExtractionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      console.log('🔄 Using Gemini API for extraction...');
      console.log(`📸 Photo extraction: ${extractPhoto ? 'enabled' : 'disabled (faster processing)'}`);

      if (!this.config.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Image is already optimized on client side, use as-is
      // Prepare the image data (remove data URL prefix if present)
      const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;

      // Get image dimensions to provide to Gemini
      const imageBuffer = Buffer.from(base64Image, 'base64');
      let imageDimensions = '512x512'; // default assumption
      try {
        const sharp = (await import('sharp')).default;
        const metadata = await sharp(imageBuffer).metadata();
        if (metadata.width && metadata.height) {
          imageDimensions = `${metadata.width}x${metadata.height}`;
          console.log(`📐 Image dimensions: ${imageDimensions}`);
        }
      } catch (error) {
        console.warn('Could not extract image dimensions, using default');
      }

      const requestBody = {
        contents: [{
          parts: [
            {
              text: `Extract product info from this image as JSON. Identify product even without text.

productName: Clean name + weight (e.g. "Greek Yogurt 450g"). If no text, identify visually.
price: Current unit price. Use "NOW"/"ONLY" price, NOT "WAS" price. IGNORE "SAVE €X" and "WAS €X". Convert "40c"→0.40. 0 if none.
isPerKg: true only if "PER KG" without weight/total.
discount: Check yellow labels/packaging for "X for €Y" or "X for Y".
  - "2 for €4.50" → {"type":"bulk_price","quantity":2,"value":4.5,"display":"(2 for €4.50)"}
  - "3 for 2" → {"type":"buy_x_get_y","quantity":3,"value":2,"display":"(3 for 2)"}
  - Extract BOTH unit price AND discount.
confidence: 0.8-1.0 (text), 0.4-0.6 (visual).
cropArea: Pick ONE prominent item (not shelf). Ignore labels. Return center % and size %.
  - centerX: horizontal center (0-100%)
  - centerY: vertical center (0-100%)
  - size: 20-50% (typically 35-40 for one item)

Example: {"productName":"Baby Carrot 200g","price":1.79,"confidence":0.9,"discount":{"type":"bulk_price","quantity":2,"value":3.0,"display":"(2 for €3.00)"},"isPerKg":false,"cropArea":{"centerX":50,"centerY":30,"size":40}}`
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

      // Save image if extraction completely failed (no product name at all)
      if (!parsedData.productName) {
        this.loggingService.saveFailedExtractionImage(
          imageData,
          'Gemini',
          'No product name extracted'
        );
      } else if (parsedData.price === 0 && parsedData.productName) {
        console.log('🖼️ Image identification successful (product name without price):', parsedData.productName);
      }

      console.log('✅ Gemini extraction successful:', {
        productName: parsedData.productName,
        price: parsedData.price,
        confidence: parsedData.confidence || 0.8,
        isPerKg: parsedData.isPerKg,
        discount: parsedData.discount
      });

      console.log('📋 Full parsed data from Gemini:', parsedData);

      // Create product thumbnail from the actual captured image (only if enabled)
      let productImage: string | undefined;
      if (extractPhoto) {
        console.log('📸 Extracting product photo...');
        productImage = await this.createProductThumbnail(imageData);
      } else {
        console.log('⏭️ Skipping product photo extraction for faster processing');
      }

      const result_response: GeminiExtractionResult = {
        success: true,
        productName: parsedData.productName.trim(),
        price: parseFloat(parsedData.price.toFixed(2)),
        confidence: Math.min(1.0, Math.max(0.0, parsedData.confidence || 0.8)),
        isPerKg: parsedData.isPerKg || false,
        rawResponse: result,
        productImage: productImage,
        cropArea: parsedData.cropArea
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