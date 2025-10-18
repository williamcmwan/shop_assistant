// Product Image Service - Fetches real product images from the web

export interface ProductImageResult {
  success: boolean;
  imageUrl?: string;
  thumbnail?: string;
  error?: string;
}

// Create a square thumbnail from a web image URL
const createThumbnailFromUrl = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set thumbnail size to 50x50 square
      const thumbnailSize = 50;
      canvas.width = thumbnailSize;
      canvas.height = thumbnailSize;
      
      if (ctx) {
        // Calculate dimensions for center cropping to square
        const { width, height } = img;
        let sourceX = 0;
        let sourceY = 0;
        let sourceSize = Math.min(width, height);
        
        // Center the crop
        if (width > height) {
          sourceX = (width - height) / 2;
        } else {
          sourceY = (height - width) / 2;
        }
        
        // Draw the cropped and scaled image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceSize, sourceSize, // Source rectangle (square crop)
          0, 0, thumbnailSize, thumbnailSize // Destination rectangle (50x50)
        );
        
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

// Common product name mappings for better search results
const PRODUCT_MAPPINGS: Record<string, string> = {
  'coca cola': 'coca-cola,coke,bottle,drink',
  'pepsi': 'pepsi,cola,bottle,drink',
  'sprite': 'sprite,lemon-lime,bottle,drink',
  'fanta': 'fanta,orange,bottle,drink',
  'milk': 'milk,carton,dairy,white',
  'bread': 'bread,loaf,bakery,wheat',
  'bananas': 'banana,yellow,fruit,fresh',
  'apples': 'apple,red,fruit,fresh',
  'tomatoes': 'tomato,red,vegetable,fresh',
  'onions': 'onion,vegetable,fresh,bulb',
  'potatoes': 'potato,vegetable,fresh,brown',
  'carrots': 'carrot,orange,vegetable,fresh',
  'chicken': 'chicken,meat,protein,fresh',
  'beef': 'beef,meat,protein,red',
  'rice': 'rice,grain,white,bag',
  'pasta': 'pasta,noodles,italian,box',
  'cheese': 'cheese,dairy,yellow,block',
  'yogurt': 'yogurt,dairy,cup,white',
  'butter': 'butter,dairy,yellow,block',
  'eggs': 'eggs,protein,white,carton',
  'orange juice': 'orange-juice,juice,carton,orange',
  'water': 'water,bottle,clear,plastic',
  'coffee': 'coffee,beans,brown,bag',
  'tea': 'tea,leaves,box,green',
  'cereal': 'cereal,box,breakfast,colorful',
  'chocolate': 'chocolate,bar,brown,sweet',
  'cookies': 'cookies,biscuits,sweet,package',
  'chips': 'chips,crisps,bag,snack',
  'ice cream': 'ice-cream,frozen,tub,cold'
};

// Clean product name for better search results
const cleanProductNameForSearch = (productName: string): string => {
  const cleaned = productName
    .replace(/\([^)]*\)/g, '') // Remove parentheses content like "(1.5kg)"
    .replace(/\d+\s*(kg|g|ml|l|oz|lb)\b/gi, '') // Remove weight/volume measurements
    .replace(/class\s+\d+/gi, '') // Remove "Class 1", "Class 2" etc.
    .replace(/grade\s+[a-z]/gi, '') // Remove "Grade A", "Grade B" etc.
    .replace(/\b(organic|bio|fresh|frozen|premium|select|choice)\b/gi, '') // Remove quality descriptors
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .toLowerCase();
  
  // Check for common product mappings
  for (const [key, value] of Object.entries(PRODUCT_MAPPINGS)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  return cleaned;
};

// Try multiple image sources for best results
const IMAGE_SOURCES = [
  // Primary: Unsplash with food/product focus
  (searchQuery: string) => `https://source.unsplash.com/600x600/?${searchQuery},product,food,grocery,fresh`,
  // Secondary: Unsplash with different keywords
  (searchQuery: string) => `https://source.unsplash.com/600x600/?${searchQuery},ingredient,kitchen,cooking`,
  // Tertiary: Foodish API for food items (fallback)
  (searchQuery: string) => `https://source.unsplash.com/600x600/?${searchQuery},organic,healthy,natural`
];

// Fetch product image using multiple sources
export const fetchProductImage = async (productName: string): Promise<ProductImageResult> => {
  try {
    console.log('🔍 Fetching product image for:', productName);
    
    const cleanedName = cleanProductNameForSearch(productName);
    console.log('🧹 Cleaned product name:', cleanedName);
    
    if (!cleanedName || cleanedName.length < 2) {
      return {
        success: false,
        error: 'Product name too short or empty'
      };
    }
    
    const searchQuery = encodeURIComponent(cleanedName);
    
    // Try each image source
    for (let i = 0; i < IMAGE_SOURCES.length; i++) {
      const imageUrl = IMAGE_SOURCES[i](searchQuery);
      console.log(`📸 Trying image source ${i + 1}:`, imageUrl);
      
      const result = await tryImageSource(imageUrl);
      if (result.success) {
        console.log(`✅ Success with image source ${i + 1}`);
        return result;
      }
      
      console.log(`❌ Failed with image source ${i + 1}:`, result.error);
    }
    
    return {
      success: false,
      error: 'All image sources failed'
    };
    
  } catch (error) {
    console.error('❌ Product image fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to try a single image source
const tryImageSource = async (imageUrl: string): Promise<ProductImageResult> => {
  return new Promise((resolve) => {
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        error: 'Image fetch timeout'
      });
    }, 3000); // 3 second timeout per source
    
    testImg.onload = async () => {
      clearTimeout(timeout);
      try {
        // Create thumbnail from the fetched image
        const thumbnail = await createThumbnailFromUrl(imageUrl);
        
        resolve({
          success: true,
          imageUrl,
          thumbnail
        });
      } catch (error) {
        resolve({
          success: false,
          error: 'Failed to create thumbnail'
        });
      }
    };
    
    testImg.onerror = () => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: 'Failed to load image'
      });
    };
    
    testImg.src = imageUrl;
  });
};

// Alternative: Use a more reliable image search API
export const fetchProductImageAlternative = async (productName: string): Promise<ProductImageResult> => {
  try {
    console.log('🔍 Fetching product image (alternative) for:', productName);
    
    const cleanedName = cleanProductNameForSearch(productName);
    
    if (!cleanedName || cleanedName.length < 2) {
      return {
        success: false,
        error: 'Product name too short or empty'
      };
    }
    
    // Use Lorem Picsum with a hash of the product name for consistent square images
    const hash = cleanedName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const imageId = Math.abs(hash) % 1000 + 100; // Generate ID between 100-1099
    const imageUrl = `https://picsum.photos/id/${imageId}/600/600`;
    
    console.log('📸 Using placeholder image:', imageUrl);
    
    try {
      const thumbnail = await createThumbnailFromUrl(imageUrl);
      console.log('✅ Placeholder image thumbnail created');
      
      return {
        success: true,
        imageUrl,
        thumbnail
      };
    } catch (error) {
      console.error('❌ Failed to create placeholder thumbnail:', error);
      return {
        success: false,
        error: 'Failed to create thumbnail'
      };
    }
    
  } catch (error) {
    console.error('❌ Alternative image fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};