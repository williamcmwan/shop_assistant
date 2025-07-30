# Shop Assistant v1.0 🛒

A modern shopping assistant application with Camera, OCR and AI price tag detection capabilities.

## ✨ Features

- **📸 OCR Price Tag Scanning** - Take photos of price tags and automatically extract product information
- **📝 Shopping List Management** - Create and manage multiple shopping lists
- **🎯 Product Suggestions** - Smart suggestions for product names and prices
- **📱 Mobile-First Design** - Optimized for mobile devices
- **⚡ Fast & Lightweight** - Clean, optimized codebase with minimal dependencies
- **🖼️ Image Processing** - Automatic image resizing for optimal OCR performance
- **🔄 Smart Deployment** - Universal deployment script with intelligent cleanup

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd shop-assistant

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Deployment
```bash
# Run the universal deployment script
./deploy-universal.sh

# The script will:
# 1. Check if dependencies need updating (smart cleanup)
# 2. Install dependencies only if needed
# 3. Build the client
# 4. Copy build files to server/public
# 5. Create production startup scripts
# 6. Stop any existing server
```

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Wouter (lightweight router)
- **State Management**: React Query for server state
- **UI Components**: Custom components built with Radix UI primitives

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **OCR Service**: OCR Space API integration
- **Image Processing**: Sharp library for image optimization
- **Validation**: Zod schemas

### Key Components
```
client/src/
├── components/
│   ├── photo-capture.tsx    # OCR photo capture interface
│   ├── shopping-item.tsx    # Individual shopping item
│   ├── group-container.tsx  # Shopping list container
│   ├── quantity-input.tsx   # Quantity input component
│   └── ui/                  # Minimal UI components
│       ├── button.tsx       # Button component
│       ├── input.tsx        # Input component
│       ├── card.tsx         # Card component
│       ├── label.tsx        # Label component
│       ├── alert-dialog.tsx # Alert dialog
│       ├── toaster.tsx      # Toast notifications
│       ├── toast.tsx        # Toast component
│       └── tooltip.tsx      # Tooltip component
├── lib/
│   ├── ocr-service.ts       # OCR text processing logic
│   ├── storage.ts           # Local storage utilities
│   ├── queryClient.ts       # React Query configuration
│   ├── bin-packing.ts       # Bin packing algorithm
│   └── utils.ts             # Utility functions
├── hooks/
│   └── use-toast.ts         # Toast notification hook
└── pages/
    ├── main.tsx             # Home page
    ├── create-list.tsx      # Create shopping list
    ├── not-found.tsx        # 404 page
    └── shopping-list.tsx    # Shopping list view
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory (see `env.example` for full configuration):

```env
# Extraction Backend Configuration
PRICETAG_EXTRACTION_BACKEND=gemini_fallback  # ocr | gemini | gemini_fallback

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OCRSPACE_API_KEY=your_ocr_space_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Flexible Extraction Backends

The application supports three extraction options:

#### Option 1: OCR-Space Only (`ocr`)
- **Use case**: Free tier, limited requests
- **Setup**: Only requires `OCRSPACE_API_KEY`
- **Performance**: Good for basic text extraction

#### Option 2: Gemini Only (`gemini`)
- **Use case**: Better accuracy, paid service
- **Setup**: Requires `GEMINI_API_KEY`
- **Performance**: Superior product name and price extraction

#### Option 3: Gemini with Fallback (`gemini_fallback`) - **Recommended**
- **Use case**: Production environments, maximum reliability
- **Setup**: Requires both API keys
- **Performance**: Uses Gemini first, falls back to OCR-Space if needed

### API Setup

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add `GEMINI_API_KEY=your_key` to your `.env` file

#### OCR Space API
1. Sign up at [OCR Space](https://ocr.space/ocrapi)
2. Get your API key
3. Add `OCRSPACE_API_KEY=your_key` to your `.env` file

## 📦 Deployment

### Universal Deployment (Recommended)
```bash
# Run the universal deployment script
./deploy-universal.sh

# This will:
# ✅ Check if dependencies need updating
# ✅ Install dependencies only if needed
# ✅ Build the application
# ✅ Copy build files to server/public
# ✅ Create production startup scripts
# ✅ Stop any existing server
```

### Available Commands After Deployment
```bash
./start-prod.sh    # Start the production server
./restart.sh       # Restart the server
./deploy-universal.sh  # Redeploy (smart cleanup)
```

### Manual Deployment
```bash
# Build the client
npm run build

# Copy build files to server/public
mkdir -p server/public
cp -r dist/public/* server/public/

# Start the server
NODE_ENV=production PORT=3000 npx tsx server/index.ts
```

## 🧹 Code Cleanup

### Removed Components
- **35+ unused UI components** removed from `client/src/components/ui/`
- **Unused dependencies** cleaned up from `package.json`
- **Reduced bundle size** significantly

### Kept Components
Only essential UI components remain:
- `button.tsx` - Button component
- `input.tsx` - Input component  
- `card.tsx` - Card component
- `label.tsx` - Label component
- `alert-dialog.tsx` - Alert dialogs
- `toaster.tsx` - Toast notifications
- `toast.tsx` - Toast component
- `tooltip.tsx` - Tooltip component

### Dependencies Cleanup
**Removed:**
- All unused Radix UI components
- Unused animation libraries
- Database dependencies (not used)
- Authentication libraries (not used)
- Chart libraries (not used)
- Form libraries (not used)

**Kept:**
- Core React dependencies
- Essential Radix UI primitives
- OCR and image processing libraries
- Styling utilities

## 🎯 Flexible Extraction Features

### Multiple Backend Support
- **OCR-Space API**: Traditional text extraction with pattern matching
- **Google Gemini API**: AI-powered product name and price extraction
- **Hybrid Fallback**: Gemini primary with OCR-Space backup for reliability

### Image Processing
- **Automatic resizing** to stay within API limits
- **Quality optimization** for better recognition
- **Format conversion** to JPEG for optimal results

### Smart Extraction
- **AI-powered parsing** with Gemini for superior accuracy
- **Pattern-based fallback** with OCR-Space for reliability
- **Confidence scoring** to determine extraction quality
- **Automatic fallback** when primary API fails or has low confidence

### Supported Price Formats
- `€ 11.25` - Standard Euro format
- `€ 11 25` - Spaced format
- `ONLY € 11.25` - Promotional format
- `11.25 €` - Reverse format
- `40c` - Cent format (converted to €0.40)

### Backend Selection
Configure your preferred extraction method via environment variables:
- `PRICETAG_EXTRACTION_BACKEND=ocr` - OCR-Space only
- `PRICETAG_EXTRACTION_BACKEND=gemini` - Gemini only  
- `PRICETAG_EXTRACTION_BACKEND=gemini_fallback` - Gemini with OCR fallback

## 📱 Mobile Optimization

- **Touch-friendly interface** with large touch targets
- **Camera integration** for photo capture
- **Responsive design** for all screen sizes
- **Offline capability** with local storage
- **Loading indicators** during OCR processing

## 🔍 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Project Structure
```
shop-assistant/
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared schemas
├── deploy-universal.sh  # Universal deployment script
├── start-prod.sh        # Production startup script
├── restart.sh           # Server restart script
├── package.json         # Dependencies
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

