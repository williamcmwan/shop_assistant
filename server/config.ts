export interface ExtractionConfig {
  backend: 'ocr' | 'gemini' | 'gemini_fallback';
  geminiApiKey?: string;
  ocrSpaceApiKey?: string;
  geminiModel: string;
}

export const getExtractionConfig = (): ExtractionConfig => {
  const backend = (process.env.PRICETAG_EXTRACTION_BACKEND || 'ocr') as 'ocr' | 'gemini' | 'gemini_fallback';
  
  return {
    backend,
    geminiApiKey: process.env.GEMINI_API_KEY,
    ocrSpaceApiKey: process.env.OCRSPACE_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  };
};

export const validateConfig = (config: ExtractionConfig): string[] => {
  const errors: string[] = [];
  
  if (!['ocr', 'gemini', 'gemini_fallback'].includes(config.backend)) {
    errors.push(`Invalid backend: ${config.backend}. Must be 'ocr', 'gemini', or 'gemini_fallback'`);
  }
  
  if (config.backend === 'gemini' || config.backend === 'gemini_fallback') {
    if (!config.geminiApiKey) {
      errors.push('GEMINI_API_KEY is required when using Gemini backend');
    }
  }
  
  if ((config.backend === 'ocr' || config.backend === 'gemini_fallback') && !config.ocrSpaceApiKey) {
    errors.push('OCRSPACE_API_KEY is required when using ocr or gemini_fallback backend');
  }
  
  return errors;
}; 