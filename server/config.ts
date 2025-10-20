export interface ExtractionConfig {
  geminiApiKey?: string;
  geminiModel: string;
}

export const getExtractionConfig = (): ExtractionConfig => {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  };
};

export const validateConfig = (config: ExtractionConfig): string[] => {
  const errors: string[] = [];
  
  if (!config.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required');
  }
  
  return errors;
}; 