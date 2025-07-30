# Shop Assistant v1.0 - Complete Export Package

## Essential Files for Deployment

### Root Directory Files
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui component configuration
- `deploy-universal.sh` - Universal deployment script
- `start-prod.sh` - Production startup script (created by deploy script)
- `restart.sh` - Server restart script (created by deploy script)
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

### Client Directory (Frontend)
```
client/
├── index.html
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── photo-capture.tsx    # OCR photo capture interface
    │   ├── group-container.tsx
    │   ├── quantity-input.tsx
    │   ├── shopping-item.tsx
    │   └── ui/ (8 essential shadcn/ui components)
    ├── hooks/
    │   └── use-toast.ts
    ├── lib/
    │   ├── bin-packing.ts
    │   ├── ocr-service.ts       # OCR text processing logic
    │   ├── queryClient.ts
    │   ├── storage.ts
    │   └── utils.ts
    └── pages/
        ├── create-list.tsx
        ├── main.tsx
        ├── not-found.tsx
        └── shopping-list.tsx
```

### Server Directory (Backend)
```
server/
├── index.ts
├── routes.ts
├── vite.ts
└── public/           # Production build files (created by deploy script)
    ├── index.html
    └── assets/
```

### Shared Directory
```
shared/
└── schema.ts
```

## Key Features Implemented

### ✅ Core Functionality
- Create and manage shopping lists
- Add/edit/remove items with prices and quantities
- Smart bin-packing algorithm for optimal grouping
- Drag and drop items between groups
- Local storage persistence

### ✅ OCR Price Tag Scanning
- Camera integration for photo capture
- Automatic image processing and optimization
- Smart product name and price extraction
- Support for various price formats (€, cents, promotional)
- Loading states and error handling

### ✅ Mobile-First Design
- Touch-friendly quantity controls with +/- buttons
- Responsive layout optimized for mobile devices
- Large touch targets (44px minimum)
- Smooth drag and drop interactions
- Camera integration for OCR scanning

### ✅ Advanced Features
- Item splitting across multiple groups
- Visual indicators for split items (e.g., "2/3")
- Target amount customization (default €25)
- Real-time total calculations
- Currency formatting in euros (€)
- Universal deployment with smart cleanup

## Dependencies Summary

### Production Dependencies (25 packages)
Key dependencies include:
- React 18.3.1 & React DOM
- Express 4.21.2 with session management
- TypeScript 5.6.3
- Vite 5.4.19 for build tooling
- TanStack Query for state management
- shadcn/ui component library (8 essential components)
- Tailwind CSS for styling
- OCR Space API wrapper for text extraction
- Sharp for image processing
- Zod for validation

### Development Dependencies (15 packages)
- Vite plugins and TypeScript types
- Build tools (esbuild, autoprefixer)
- Development server tools (tsx)

## Deployment Instructions

### 1. Copy All Files
Copy the entire project structure to your server, excluding:
- `node_modules/` (will be installed)
- `dist/` (will be built)
- `server/public/` (will be created by deploy script)

### 2. Universal Deployment (Recommended)
```bash
# Make deploy script executable
chmod +x deploy-universal.sh

# Run universal deployment
./deploy-universal.sh

# Start production server
./start-prod.sh
```

### 3. Manual Deployment
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Copy build files to server/public
mkdir -p server/public
cp -r dist/public/* server/public/

# Start application
NODE_ENV=production PORT=3000 npx tsx server/index.ts
```

### 4. Environment Configuration
Create `.env` file:
```env
NODE_ENV=production
PORT=3000
OCR_API_KEY=your_ocr_api_key_here
```

## Universal Deployment Script Features

### Smart Cleanup
- Only removes dependencies if package.json has changed
- Preserves existing installations when possible
- Faster deployments with intelligent dependency checking

### Same-Folder Deployment
- No separate deploy directory needed
- All files stay in their original locations
- Simplified file structure management

### Enhanced Server Management
- Graceful shutdown of existing servers
- Automatic port conflict resolution
- Production startup scripts generation

### Available Commands After Deployment
```bash
./start-prod.sh    # Start the production server
./restart.sh       # Restart the server
./deploy-universal.sh  # Redeploy (smart cleanup)
```

## File Modifications for Your Server

### Remove Replit-Specific Code (if applicable)
In `vite.config.ts`, you may want to remove Replit plugins:
```typescript
// Remove these lines for non-Replit deployment
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// And the cartographer plugin import/usage
```

### Simplified vite.config.ts for your server:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

## Testing Your Deployment

1. Create a shopping list
2. Add items with different prices and quantities
3. Test OCR functionality with price tag photos
4. Split the list into groups (test bin-packing)
5. Drag items between groups
6. Edit item prices/quantities
7. Verify data persists in browser storage

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## OCR Features

### Supported Price Formats
- `€ 11.25` - Standard Euro format
- `€ 11 25` - Spaced format
- `ONLY € 11.25` - Promotional format
- `11.25 €` - Reverse format
- `40c` - Cent format (converted to €0.40)

### Image Processing
- Automatic resizing to stay within OCR API limits
- Quality optimization for better text recognition
- Format conversion to JPEG for optimal results

The application is production-ready and includes all the features you requested with mobile-first design, intelligent grouping, OCR scanning, and persistent storage.