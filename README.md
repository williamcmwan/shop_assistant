# Shop Assistant v2.4 🛒

A modern shopping assistant application with Camera and AI-powered price tag detection using Google Gemini.

**Latest Update**: Added AI Assistant feature with personalized recipe suggestions, meal planning, nutritional analysis, and budget insights based on your shopping items.

## ✨ Features

- **✨ AI Assistant** - Personalized recipe suggestions, meal planning, nutritional analysis, and budget insights based on your shopping items with intelligent follow-up conversations
- **🖼️ Product Photo Thumbnails** - AI-powered product image extraction from captured photos using Gemini vision, with 50x50px thumbnails displayed in lists
- **⚙️ Configurable Photo Settings** - Enable/disable product photo extraction for faster processing, with option to clear all stored thumbnails
- **⚖️ Per-KG Price Detection** - Auto detect price per kg items and calculate the price based on weight input with dedicated weight management dialogs
- **📷 AI Price Tag Scanning with Multi-Purchase Discounts** - Take photos of price tags and automatically extract product information using Gemini AI, including volume discounts (3 for €10, 3 for 2, etc.)
- **🎨 Updated Interface** - Fresh new design with consistent blue theme, improved layouts, and enhanced user experience
- **⌨️ Auto Complete Input** - Smart suggestions based on your shopping history for faster item entry
- **� MCurrency Configuration** - Customize your currency symbol - supports €, $, £, ¥ and custom symbols
- **📝 Shopping List Management** - Create and manage multiple shopping lists
- **⏸️ Hold Item Feature** - Temporarily put items on hold to exclude them from totals and list splitting
- **� Intetlligent Grouping** - Smart bin-packing algorithm optimally splits lists by target amounts
- **� DMobile-First Design** - Optimized for mobile devices with touch-friendly interface
- **⚡ Fast & Lightweight** - Clean, optimized codebase with minimal dependencies
- **🖼️ Image Processing** - Automatic image resizing for optimal AI performance
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
│   ├── photo-capture.tsx    # AI photo capture interface
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
│   ├── ocr-service.ts       # Extraction service (client-side)
│   ├── storage.ts           # Local storage utilities
│   ├── queryClient.ts       # React Query configuration
│   ├── bin-packing.ts       # Bin packing algorithm
│   └── utils.ts             # Utility functions
├── hooks/
│   └── use-toast.ts         # Toast notification hook
└── pages/
    ├── main.tsx             # Home page
    ├── create-list.tsx      # Create shopping list
    ├── ask-ai.tsx           # AI Assistant page
    ├── not-found.tsx        # 404 page
    └── shopping-list.tsx    # Shopping list view
```

## 📱 Usage

### Creating Shopping Lists
1. **Create a Shopping List**: Click "New List" and give it a name
2. **Add Items**: Use the form to add items with prices and quantities

### AI Assistant
3. **Ask AI**: Access the AI Assistant from the main page or shopping list header
   - **Recipe Suggestions**: Get personalized meal ideas and recipes based on your shopping items
   - **Nutritional Analysis**: Learn about the nutritional value of your purchases
   - **Budget Analysis**: Analyze spending patterns and get money-saving tips
   - **Custom Questions**: Ask any question about your shopping items
   - **Follow-up Conversations**: Continue conversations with follow-up questions
   - **Response History**: Save and revisit previous AI conversations
   - **Multiple Sharing Options**: Share responses via WhatsApp, Telegram, Email, SMS, or copy to clipboard
   - **Flexible Time Periods**: Analyze items from 1-7 days for different insights

### AI Price Scanning with Discount Detection
4. **Scan Price Tags**: Use the camera button to scan price tags automatically with Gemini AI
   - **Multi-Purchase Discounts**: Automatically detects "3 for €10" or "3 for 2" offers
   - **Per-KG Detection**: Automatically detects price per kg items and prompts for weight input
   - **Product Photo Extraction**: Gemini AI extracts product thumbnails from captured images
   - **Smart Quantity Setting**: Sets quantity to discount amount for immediate savings
   - **Discount Display**: Shows discount info like "(3 for €10)" in product name

### Product Photo Management
4a. **Product Thumbnails**: 50x50px product photos displayed next to items
   - **Automatic Extraction**: Gemini AI identifies and extracts product images from price tag photos
   - **Visual Identification**: Quickly identify items by their product photos in lists and groups
   - **Configurable**: Enable/disable photo extraction in Settings for faster processing
   - **Storage Management**: Clear all product photos from Settings to free up space

### Per-KG Item Management
5. **Add Per-KG Items**: Use the scale button to manually add items sold by weight
   - **Weight Input Dialog**: Enter product name, price per kg, and weight
   - **Automatic Calculation**: Total price calculated as price per kg × weight
   - **Weight Display**: Shows weight in product name like "Tomatoes (1.5kg)"
   - **Enter Key Support**: Press Enter in any field to quickly submit the form

6. **Edit Per-KG Items**: Click the scale icon on existing per-kg items to modify
   - **Edit All Fields**: Change product name, price per kg, and weight
   - **Real-time Updates**: See total price update as you change values
   - **Quick Entry**: Use Enter key to save changes instantly

### Managing Discounts
7. **Toggle Discounts**: Use the green tag button to apply/remove discounts
   - **Automatic Application**: Discounts apply when quantity matches requirements
   - **Visual Indicators**: Green pricing shows active discounts
   - **Smart Grouping**: Discounted items stay together in groups

### Hold Items
8. **Hold/Resume Items**: Use the pause button to hold items temporarily
   - **Exclude from Total**: Held items are excluded from the total calculation
   - **Exclude from Splitting**: Held items won't be included when splitting lists into groups
   - **Visual Indicators**: Held items show with gray background and "(on hold)" label
   - **Easy Toggle**: Click the play button to resume held items

### Smart Grouping
9. **Enable Split Mode**: Automatically group items by target spending amounts
   - **Whole Unit Grouping**: Multi-purchase discount and Per-KG items are included as whole units in groups (not split)
10. **Track Totals**: Monitor your spending with real-time calculations including discount savings

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory (see `env.example` for full configuration):

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Model Configuration
GEMINI_MODEL=gemini-2.0-flash-lite

# Server Configuration
PORT=3000
NODE_ENV=production
```

### AI-Powered Extraction

The application uses Google Gemini AI for intelligent price tag extraction:

- **Superior Accuracy**: AI-powered product name and price extraction
- **Visual Recognition**: Can identify products even without readable text
- **Discount Detection**: Automatically detects multi-purchase offers
- **Product Photos**: Extracts product thumbnails from captured images
- **Fast Processing**: Optimized for quick response times

### App Configuration Settings

Access the Settings menu (gear icon) on the main page to configure:

#### Product Photo Settings
- **Enable/Disable Product Photos**: Toggle product photo extraction on/off
  - When enabled: AI extracts product thumbnails from captured images
  - When disabled: Faster processing, no photo extraction or storage
- **Clear All Product Photos**: Remove all stored product thumbnails to free up browser storage
  - Removes photos from all shopping lists
  - Preserves all other item data (names, prices, quantities)

#### Currency Settings
- **Change Currency Symbol**: Customize your preferred currency symbol
  - Common options: €, $, £, ¥
  - Custom symbols: Enter any symbol up to 3 characters

#### Data Management
- **Clear Autocomplete**: Remove all saved item name suggestions
- **Clear AI History**: Remove all saved AI conversations and responses
- **Show App Info**: View the feature showcase splash screen

### API Setup

#### Google Gemini API (Required)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add `GEMINI_API_KEY=your_key` to your `.env` file
4. (Optional) Configure the model: `GEMINI_MODEL=gemini-2.0-flash-lite`

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
- Image processing libraries
- Styling utilities

## 🎯 AI Extraction Features

### Google Gemini AI
- **Advanced Vision AI**: Uses Google's latest Gemini models for superior accuracy
- **Visual Product Recognition**: Identifies products even when text is unclear
- **Multi-language Support**: Handles various languages and formats
- **Discount Detection**: Automatically identifies promotional offers

### Image Processing
- **Automatic resizing** to stay within API limits
- **Quality optimization** for better recognition
- **Format conversion** to JPEG for optimal results

### Smart Extraction
- **AI-powered parsing** with Gemini for superior accuracy
- **Image identification** when no text is readable - identifies products by visual appearance
- **Confidence scoring** to determine extraction quality
- **Product photo extraction** for visual item identification

### Supported Price Formats
- `€ 11.25` - Standard Euro format
- `€ 11 25` - Spaced format
- `ONLY € 11.25` - Promotional format
- `11.25 €` - Reverse format
- `40c` - Cent format (converted to €0.40)
- `NOW €1.49` - Promotional pricing

## 📱 Mobile Optimization

- **Touch-friendly interface** with large touch targets
- **Camera integration** for photo capture
- **Responsive design** for all screen sizes
- **Offline capability** with local storage
- **Loading indicators** during AI processing

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
- **AI Service**: Google Gemini API integration for intelligent price tag scanning
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
3. **AI Scanning**: Take photos of price tags for automatic data extraction using Gemini AI
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

