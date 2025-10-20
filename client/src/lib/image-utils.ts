export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export class ClientImageUtils {
  private static defaultOptions: Required<ImageResizeOptions> = {
    maxWidth: 384,    // Maximum 384px for cost optimization
    maxHeight: 384,   // Maintain aspect ratio
    quality: 85,      // Good balance between size and quality (0-100)
    format: 'jpeg'    // Smaller file size than PNG
  };

  /**
   * Resize an image on the client side using Canvas API
   * @param imageData Base64 encoded image data
   * @param options Resize options
   * @returns Resized base64 image data
   */
  static async resizeImage(
    imageData: string, 
    options: ImageResizeOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const opts = { ...this.defaultOptions, ...options };
        
        // Create an image element
        const img = new Image();
        img.onload = () => {
          try {
            // Calculate new dimensions while maintaining aspect ratio
            const { width, height } = this.calculateDimensions(
              img.width, 
              img.height, 
              opts.maxWidth, 
              opts.maxHeight
            );
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Unable to get canvas context'));
              return;
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Fill with white background (for JPEG format)
            if (opts.format === 'jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            
            // Draw resized image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with quality setting
            const resizedDataUrl = canvas.toDataURL(
              `image/${opts.format}`, 
              opts.quality / 100
            );
            
            console.log(`🖼️ Client-side resize: ${img.width}x${img.height} → ${width}x${height} (${opts.format}, quality: ${opts.quality})`);
            
            resolve(resizedDataUrl);
            
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Load the image
        img.src = imageData;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate optimal dimensions for AI processing
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
    
    // Ensure minimum size for AI readability
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
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          // Calculate approximate size from base64
          const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
          const originalSize = Math.ceil((base64Data.length * 3) / 4); // Approximate base64 to binary size
          
          resolve({
            width: img.width,
            height: img.height,
            originalSize,
            format: 'unknown' // Canvas doesn't provide format info easily
          });
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageData;
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Optimize image specifically for AI processing
   * @param imageData Base64 encoded image data
   * @returns Optimized base64 image data
   */
  static async optimizeForOCR(imageData: string): Promise<string> {
    return this.resizeImage(imageData, {
      maxWidth: 384,   // Maximum 384px for AI processing
      maxHeight: 384,
      quality: 85,     // Good quality for text recognition (0-100)
      format: 'jpeg'
    });
  }

  /**
   * Optimize image for maximum upload speed and cost efficiency
   * @param imageData Base64 encoded image data
   * @returns Optimized base64 image data
   */
  static async optimizeForUpload(imageData: string): Promise<string> {
    return this.resizeImage(imageData, {
      maxWidth: 384,   // Maximum 384px for optimal AI performance
      maxHeight: 384,
      quality: 80,     // Good balance between quality and size
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
      maxWidth: 384,   // Maximum 384px for AI
      maxHeight: 384,
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