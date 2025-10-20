import sharp from 'sharp';

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export class ImageUtils {
  private static defaultOptions: Required<ImageResizeOptions> = {
    maxWidth: 512,    // Maximum 512px for better text recognition
    maxHeight: 512,   // Maintain aspect ratio
    quality: 85,      // Good balance between size and quality (0-100)
    format: 'jpeg'    // Smaller file size than PNG
  };

  /**
   * Resize an image to optimize for API calls while maintaining OCR readability
   * @param imageData Base64 encoded image data
   * @param options Resize options
   * @returns Resized base64 image data
   */
  static async resizeImage(
    imageData: string, 
    options: ImageResizeOptions = {}
  ): Promise<string> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      
      // Remove data URL prefix if present
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      // Get original image info
      const originalBuffer = Buffer.from(base64Data, 'base64');
      const originalImage = sharp(originalBuffer);
      const originalMetadata = await originalImage.metadata();
      
      if (!originalMetadata.width || !originalMetadata.height) {
        throw new Error('Unable to get image dimensions');
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      const { width, height } = this.calculateDimensions(
        originalMetadata.width, 
        originalMetadata.height, 
        opts.maxWidth, 
        opts.maxHeight
      );
      
      // Resize image using Sharp with better error handling
      let resizedBuffer: Buffer;
      try {
        resizedBuffer = await originalImage
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
          })
          .toFormat(opts.format, { quality: opts.quality })
          .toBuffer();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ Image resize failed, trying alternative approach: ${errorMessage}`);
        
        // Try alternative approach: convert to JPEG first, then resize
        try {
          resizedBuffer = await sharp(originalBuffer)
            .jpeg({ quality: opts.quality })
            .resize(width, height, {
              fit: 'inside',
              withoutEnlargement: true,
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toBuffer();
        } catch (secondError) {
          const secondErrorMessage = secondError instanceof Error ? secondError.message : 'Unknown error';
          console.error(`❌ Alternative resize also failed: ${secondErrorMessage}`);
          // As last resort, return a minimal version of the original
          resizedBuffer = await sharp(originalBuffer)
            .jpeg({ quality: 70 })
            .resize(Math.min(width, 384), Math.min(height, 384), {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toBuffer();
        }
      }
      
      // Convert back to base64
      const resizedBase64 = `data:image/${opts.format};base64,${resizedBuffer.toString('base64')}`;
      
      console.log(`🖼️ Resized image: ${originalMetadata.width}x${originalMetadata.height} → ${width}x${height} (${opts.format}, quality: ${opts.quality})`);
      
      return resizedBase64;
      
    } catch (error) {
      console.error('❌ Error resizing image:', error);
      // Return original image if resize fails
      return imageData;
    }
  }

  /**
   * Calculate optimal dimensions for OCR/AI processing
   * @param originalWidth Original image width
   * @param originalHeight Original image height
   * @param maxWidth Maximum allowed width
   * @param maxHeight Maximum allowed height
   * @returns New dimensions
   */
  private static calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Calculate scale factors
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
    
    // Apply scaling
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    
    // Ensure minimum size for OCR readability
    const minWidth = 150;
    const minHeight = 100;
    
    if (width < minWidth || height < minHeight) {
      const minScaleX = minWidth / originalWidth;
      const minScaleY = minHeight / originalHeight;
      const minScale = Math.max(minScaleX, minScaleY);
      
      width = Math.round(originalWidth * minScale);
      height = Math.round(originalHeight * minScale);
    }
    
    return { width, height };
  }

  /**
   * Get image information without loading the full image
   * @param imageData Base64 encoded image data
   * @returns Image dimensions and size info
   */
  static async getImageInfo(imageData: string): Promise<{
    width: number;
    height: number;
    originalSize: number;
    format: string;
  }> {
    try {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const buffer = Buffer.from(base64Data, 'base64');
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        originalSize: buffer.length,
        format: metadata.format || 'unknown'
      };
    } catch (error) {
      console.error('❌ Error getting image info:', error);
      return {
        width: 0,
        height: 0,
        originalSize: 0,
        format: 'unknown'
      };
    }
  }

  /**
   * Optimize image specifically for OCR processing
   * @param imageData Base64 encoded image data
   * @returns Optimized base64 image data
   */
  static async optimizeForOCR(imageData: string): Promise<string> {
    return this.resizeImage(imageData, {
      maxWidth: 512,   // Maximum 512px for OCR
      maxHeight: 512,
      quality: 85,     // Good quality for text recognition (0-100)
      format: 'jpeg'
    });
  }

  /**
   * Optimize image specifically for AI processing
   * @param imageData Base64 encoded image data
   * @returns Optimized base64 image data
   */
  static async optimizeForAI(imageData: string): Promise<string> {
    return this.resizeImage(imageData, {
      maxWidth: 512,   // Maximum 512px for AI
      maxHeight: 512,
      quality: 80,     // Good balance (0-100)
      format: 'jpeg'
    });
  }

  /**
   * Ultra-compact optimization for maximum cost savings
   * @param imageData Base64 encoded image data
   * @returns Ultra-optimized base64 image data
   */
  static async ultraOptimize(imageData: string): Promise<string> {
    return this.resizeImage(imageData, {
      maxWidth: 256,   // Ultra-small for maximum savings
      maxHeight: 256,
      quality: 75,     // Lower quality for maximum compression
      format: 'jpeg'
    });
  }
} 