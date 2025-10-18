# Shop Assistant v2.1 🛒

A modern shopping assistant application with Camera, OCR and AI price tag detection capabilities.

**Latest Update**: Added Per-KG price detection with automatic weight calculation, enhanced UI with consistent blue theme, and improved user experience with Enter key support for forms.

## ✨ Features

- **⚖️ Per-KG Price Detection** - Auto detect price per kg items and calculate the price based on weight input with dedicated weight management dialogs
- **�  OCR Price Tag Scanning with Multi-Purchase Discounts** - Take photos of price tags and automatically extract product information including volume discounts (3 for €10, 3 for 2, etc.)
- **🎨 Updated Interface** - Fresh new design with consistent blue theme, improved layouts, and enhanced user experience
- **⌨️ Auto Complete Input** - Smart suggestions based on your shopping history for faster item entry
- **� MCurrency Configuration** - Customize your currency symbol - supports €, $, £, ¥ and custom symbols
- **📝 Shopping List Management** - Create and manage multiple shopping lists
- **⏸️ Hold Item Feature** - Temporarily put items on hold to exclude them from totals and list splitting
- **� Intetlligent Grouping** - Smart bin-packing algorithm optimally splits lists by target amounts
- **� DMobile-First Design** - Optimized for mobile devices with touch-friendly interface
- **⚡ Fast & Lightweight** - Clean, optimized codebase with minimal dependencies
- **🖼️ Image Processing** - Automatic image resizing for optimal OCR performance
- **🔄 Smart Deployment** - Universal deployment script with intelligent cleanup
- **💰 Discount Management** - Automatic detection and application of multi-purchase discounts with smart grouping

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
# Run the deployment script
./scripts/deploy.sh

# The script will:
# 1. Clean and install dependencies
# 2. Build the client
# 3. Copy build files to server/public
# 4. Stop any existing server
```

### Managing the Application
```bash
# Start the server (foreground)
./scripts/app.sh start

# Start the server (background with logging)
./scripts/app.sh start-bg

# Stop the server
./scripts/app.sh stop

# Restart the server (foreground)
./scripts/app.sh restart

# Restart the server (background)
./scripts/app.sh restart-bg

# Check server status
./scripts/app.sh status

# View logs (app, error, or all)
./scripts/app.sh logs
./scripts/app.sh logs error
./scripts/app.sh logs all
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
- **Image Processing**: Client-side Canvas API for image optimization
- **Validation**: Zod schemas

### Key Components
```
client/src/
├── components/
│   ├── photo-capture.tsx    # OCR photo capture interface
│   ├── shopping-item.tsx    # Individual shopping item
│   ├── group-container.tsx  # Shopping list container
│   ├── quantity-input.tsx   # Quantity input component
│   ├── manual-perkg-dialog.tsx  # Manual Per-KG item entry dialog
│   ├── weight-edit-dialog.tsx   # Per-KG item weight editing dialog
│   ├── splash-screen.tsx    # Feature showcase splash screen
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

## 📱 Usage

### Creating Shopping Lists
1. **Create a Shopping List**: Click "New List" and give it a name
2. **Add Items**: Use the form to add items with prices and quantities

### OCR Price Scanning with Discount Detection
3. **Scan Price Tags**: Use the camera button to scan price tags automatically
   - **Multi-Purchase Discounts**: Automatically detects "3 for €10" or "3 for 2" offers
   - **Per-KG Detection**: Automatically detects price per kg items and prompts for weight input
   - **Smart Quantity Setting**: Sets quantity to discount amount for immediate savings
   - **Discount Display**: Shows discount info like "(3 for €10)" in product name

### Per-KG Item Management
4. **Add Per-KG Items**: Use the scale button to manually add items sold by weight
   - **Weight Input Dialog**: Enter product name, price per kg, and weight
   - **Automatic Calculation**: Total price calculated as price per kg × weight
   - **Weight Display**: Shows weight in product name like "Tomatoes (1.5kg)"
   - **Enter Key Support**: Press Enter in any field to quickly submit the form

5. **Edit Per-KG Items**: Click the scale icon on existing per-kg items to modify
   - **Edit All Fields**: Change product name, price per kg, and weight
   - **Real-time Updates**: See total price update as you change values
   - **Quick Entry**: Use Enter key to save changes instantly

### Managing Discounts
6. **Toggle Discounts**: Use the green tag button to apply/remove discounts
   - **Automatic Application**: Discounts apply when quantity matches requirements
   - **Visual Indicators**: Green pricing shows active discounts
   - **Smart Grouping**: Discounted items stay together in groups

### Hold Items
7. **Hold/Resume Items**: Use the pause button to hold items temporarily
   - **Exclude from Total**: Held items are excluded from the total calculation
   - **Exclude from Splitting**: Held items won't be included when splitting lists into groups
   - **Visual Indicators**: Held items show with gray background and "(on hold)" label
   - **Easy Toggle**: Click the play button to resume held items

### Smart Grouping
8. **Enable Split Mode**: Automatically group items by target spending amounts
   - **Whole Unit Grouping**: Multi-purchase discount and Per-KG items are included as whole units in groups (not split)
9. **Track Totals**: Monitor your spending with real-time calculations including discount savings

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
├── scripts/             # Deployment and management scripts
│   ├── deploy.sh        # Deployment script
│   └── app.sh           # Application management (start/stop/restart/logs)
├── logs/                # Application logs (created at runtime)
│   ├── app.log          # Application output logs
│   ├── error.log        # Error logs
│   └── app.pid          # Process ID file for background mode
├── docs/                # Documentation files
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PRD.md
│   └── ...              # Other documentation
├── package.json         # Dependencies
└── README.md           # This file
```

## 🏗️ Technical Architecture

### System Overview
The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **OCR Service**: OCR Space API integration for price tag scanning
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, local storage for persistence

### Data Models
The application uses Zod schemas for type validation:
- **ShoppingItem**: Individual items with name, price, quantity, and total
- **ShoppingGroup**: Collections of items with target amounts for smart grouping  
- **ShoppingList**: Main container with items, groups, and metadata

### Smart Grouping Algorithm
- **Bin Packing**: First Fit Decreasing algorithm for optimal item distribution
- **Target-Based**: Groups items based on configurable target amounts
- **Flexible**: Allows 20% overflow for better item placement

### Data Flow
1. **List Creation**: Users create shopping lists with names and dates
2. **Item Management**: Add/remove items with price and quantity tracking
3. **OCR Scanning**: Take photos of price tags for automatic data extraction
4. **Smart Grouping**: Algorithm distributes items across groups based on target amounts
5. **Local Persistence**: All data stored in browser localStorage
6. **Real-time Updates**: Automatic total calculations and group rebalancing

### Configuration Files
- **postcss.config.js**: PostCSS configuration for Tailwind CSS processing
- **tailwind.config.ts**: Tailwind CSS theme and component configuration
- **tsconfig.json**: TypeScript compilation settings with path aliases
- **vite.config.ts**: Vite build configuration with React plugin and aliases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

