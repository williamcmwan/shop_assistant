import { ocrSpace } from 'ocr-space-api-wrapper';
import { ExtractionConfig } from './config';
import { LoggingService, APICallLog } from './logging-service';

export interface OCRExtractionResult {
  success: boolean;
  productName: string;
  price: number;
  confidence: number;
  error?: string;
  rawResponse?: any;
}

export class OCRService {
  private config: ExtractionConfig;
  private loggingService: LoggingService;

  constructor(config: ExtractionConfig) {
    this.config = config;
    this.loggingService = new LoggingService();
  }

  async extractProductInfo(imageData: string): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔄 Using OCR-Space API for extraction...');
      
      const result = await ocrSpace(imageData, {
        apiKey: this.config.ocrSpaceApiKey,
        language: 'eng',
        isOverlayRequired: false,
        filetype: 'jpg',
        detectOrientation: true,
        scale: true,
        OCREngine: "2"
      });

      console.log('OCR-Space API response:', JSON.stringify(result, null, 2));

      if (result && result.ParsedResults && result.ParsedResults.length > 0) {
        const extractedText = result.ParsedResults[0].ParsedText;
        const confidence = result.ParsedResults[0].TextOverlay?.Lines?.[0]?.Words?.[0]?.Confidence || 0.5;
        
        // Parse the extracted text using the existing parsing logic
        const parsed = this.parseProductInfo(extractedText);
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        
        // Log successful extraction
        const logData: APICallLog = {
          timestamp,
          api: 'OCR',
          elapsedTime,
          productName: parsed.productName,
          price: parsed.price,
          inputTokens: 0, // OCR doesn't use tokens
          outputTokens: 0,
          success: true
        };
        this.loggingService.logAPICall(logData);
        
        // Save image if extraction failed (no product name or price)
        if (!parsed.productName || parsed.price === 0) {
          this.loggingService.saveFailedExtractionImage(
            imageData, 
            'OCR', 
            'No product name or price extracted'
          );
        }
        
        console.log('✅ OCR-Space extraction successful:', {
          productName: parsed.productName,
          price: parsed.price,
          confidence: confidence
        });

        return {
          success: true,
          productName: parsed.productName,
          price: parsed.price,
          confidence: confidence,
          rawResponse: result
        };
      } else {
        throw new Error('No text extracted from OCR-Space API');
      }
      
    } catch (error) {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed extraction
      const logData: APICallLog = {
        timestamp,
        api: 'OCR',
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
      this.loggingService.saveFailedExtractionImage(imageData, 'OCR', errorMessage);
      
      console.error('❌ OCR-Space extraction failed:', error);
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

  // Reuse the existing parsing logic from the client
  private parseProductInfo(text: string): { productName: string; price: number } {
    console.log("=== Starting OCR Text Parsing ===");
    console.log("Original text:", text);
    
    const cleanedText = this.preprocessText(text);
    console.log("Cleaned text:", cleanedText);
    
    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log("Lines after splitting:", lines);
    
    let productName = "";
    let price = 0;
    
    // Enhanced price detection patterns
    const pricePatterns = [
      /NOW\s*€\s*(\d+[.,]\d{2})/gi, // NOW €1.49
      /NOW\s*(\d+)[cC]/gi,           // NOW 40c
      /NOW\s*€\s*(\d+)/gi,           // NOW €1
      /ONLY\s*€\s*(\d+[.,]\d{2})/gi,
      /€\s*(\d+[.,]\d{2})/g,
      /(\d+[.,]\d{2})\s*€/g,
      /ONLY\s*(\d+[.,]\d{2})/g,
      /(\d+[.,]\d{2})/g,
      /€\s*(\d+)\s*(\d{2})/g,  // Handle cases like "€ 11 25"
      /NOW\s*(\d+[.,]\d{2})/gi, // NOW 1.49
      /WAS\s*€\s*(\d+[.,]\d{2})/gi, // WAS €1.49
      /WAS\s*(\d+)[cC]/gi,           // WAS 40c
      /WAS\s*€\s*(\d+)/gi,           // WAS €1
      /WAS\s*(\d+[.,]\d{2})/gi, // WAS 1.49
    ];

    let allPriceMatches: Array<{price: number, line: string, index: number, pattern: string, isNow?: boolean, isWas?: boolean}> = [];

    // Collect all price matches
    lines.forEach((line, index) => {
      // Skip lines with unit prices or non-euro currencies
      const lowerLine = line.toLowerCase();
      if (/(per\s*kg|per\s*litre|per\s*l|per\s*unit|each|per\s*piece|per\s*item)/.test(lowerLine)) return;
      if (/£|\$/.test(line)) return;
      
      pricePatterns.forEach((pattern, patternIndex) => {
        const matches = Array.from(line.matchAll(pattern));
        matches.forEach(match => {
          let priceStr;
          let priceValue = 0;
          let isNow = false;
          let isWas = false;
          
          if (match[0] &&
              /\d+[.,]\d{2}/.test(match[0]) &&
              !/\d+[.,]\d{2}\//.test(match[0])) {
            if (patternIndex === 1 || patternIndex === 11) { // NOW 40c or WAS 40c
              priceValue = parseInt(match[1], 10) / 100;
            } else if (patternIndex === 9) { // "€ 11 25"
              priceStr = `${match[1]}.${match[2]}`;
              priceValue = parseFloat(priceStr);
            } else {
              priceStr = match[1] && match[1].replace(',', '.');
              priceValue = parseFloat(priceStr);
            }
            if (patternIndex <= 2 || patternIndex === 9 || patternIndex === 10) isNow = /now/i.test(line);
            if (patternIndex >= 11) isWas = /was/i.test(line);
            if (priceValue > 0.01 && priceValue < 1000) {
              allPriceMatches.push({
                price: priceValue,
                line: line,
                index: index,
                pattern: patternIndex.toString(),
                isNow,
                isWas
              });
            }
          }
        });
      });
      
      // Manual fallback: if line contains 'NOW' and ends with 'c', extract cents
      if (/NOW\s*\d+[cC]/.test(line)) {
        const centsMatch = line.match(/NOW\s*(\d+)[cC]/i);
        if (centsMatch && centsMatch[1]) {
          const priceValue = parseInt(centsMatch[1], 10) / 100;
          allPriceMatches.push({
            price: priceValue,
            line: line,
            index: index,
            pattern: 'manual-NOW-cents',
            isNow: true,
            isWas: false
          });
        }
      }
    });

    // Price selection logic
    let selectedPrice = 0;
    // 1. Prefer the lowest NOW price (including cents)
    const nowPrices = allPriceMatches.filter(match => match.isNow);
    if (nowPrices.length > 0) {
      const minNow = nowPrices.reduce((min, cur) => cur.price < min.price ? cur : min, nowPrices[0]);
      selectedPrice = minNow.price;
    } else {
      // 2. Fallback to ONLY price
      const onlyPrice = allPriceMatches.find(match =>
        typeof match.pattern === 'string' ? (match.pattern === 'ONLY_EURO' || match.pattern === 'ONLY') : false
      );
      if (onlyPrice) {
        selectedPrice = onlyPrice.price;
      } else {
        // 3. Fallback to first price (but skip WAS if NOW exists)
        const firstPrice = allPriceMatches.find(match => !match.isWas);
        if (firstPrice) {
          selectedPrice = firstPrice.price;
        } else if (allPriceMatches.length > 0) {
          selectedPrice = allPriceMatches[0].price;
        }
      }
    }
    price = selectedPrice;

    // Product name extraction
    const isBarcode = (line: string) => /^\d{8,}$/.test(line.trim());
    const isPriceLine = (line: string) => /\d+[.,]\d{2}/.test(line) || /\d+\s*[cC]/.test(line) || /€\s*\d+[.,]\d{2}/.test(line);
    const isSymbolLine = (line: string) => /^\s*[€$£]\s*$/i.test(line.trim());
    const offerPatterns = [/save/i, /%/, /offer/i, /discount/i];
    
    let candidateLines = lines.filter(
      line =>
        !isBarcode(line) &&
        !isPriceLine(line) &&
        !isSymbolLine(line) &&
        line.trim().length > 0
    );
    
    // Skip initial offer/discount lines
    let startIdx = 0;
    while (
      startIdx < candidateLines.length &&
      offerPatterns.some(pat => pat.test(candidateLines[startIdx]))
    ) {
      startIdx++;
    }
    const productNameLines = candidateLines.slice(startIdx);
    if (productNameLines.length >= 1) {
      productName = productNameLines.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // Clean product name
    productName = this.cleanProductName(productName);
    
    console.log("=== Final Result ===");
    console.log("Product Name:", productName);
    console.log("Price:", price);
    console.log("===================");
    
    return { productName, price };
  }

  private preprocessText(text: string): string {
    return text
      .replace(/€\s*([0-9]+)[.,]\s*([0-9]{2})/g, '€$1.$2')
      .replace(/ONLY\s*€/g, 'ONLY €')
      .replace(/NOW\s*€/g, 'NOW €')
      .replace(/\s*\n\s*/g, '\n')
      .trim();
  }

  private cleanProductName(name: string): string {
    if (!name) return name;
    
    let cleaned = name;
    
    // Remove specific store names (case insensitive)
    cleaned = cleaned.replace(/dunnes\s+stores/gi, '');
    cleaned = cleaned.replace(/simply\s+better/gi, '');
    cleaned = cleaned.replace(/total\s+price/gi, '');
    
    // Remove special characters like = or |
    cleaned = cleaned.replace(/[=|]/g, '');
    
    // Remove long numbers (barcodes) - 8+ digits
    cleaned = cleaned.replace(/\b\d{8,}\b/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
} 