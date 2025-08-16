# Shop Assistant v1.0 - Deployment Guide

## Overview
This is a mobile-first supermarket shopping assistant built with React, TypeScript, and Express.js. The application features intelligent bin-packing algorithms for grouping items, drag-and-drop functionality, OCR price tag scanning, and local storage persistence.

## System Requirements
- Node.js 18+ (recommended: 20.x)
- npm or yarn package manager
- OCR Space API key (for price tag scanning)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
This starts both the frontend (Vite) and backend (Express) servers simultaneously.

### 3. Production Deployment (Recommended)
```bash
# Use the universal deployment script
./deploy-universal.sh

# This will:
# ✅ Check if dependencies need updating
# ✅ Install dependencies only if needed
# ✅ Build the client
# ✅ Copy build files to server/public
# ✅ Create production startup scripts
# ✅ Stop any existing server
```

### 4. Start Production Server
```bash
# After deployment, start the server
./start-prod.sh

# Or restart if already running
./restart.sh
```

## Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── index.css      # Global styles
│   └── index.html
├── server/                # Express backend
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── vite.ts           # Vite development integration
│   └── public/           # Production build files (created by deploy script)
├── shared/               # Shared types and schemas
│   └── schema.ts
├── deploy-universal.sh   # Universal deployment script
├── start-prod.sh         # Production startup script
├── restart.sh            # Server restart script
└── package.json
```

## Configuration Files

### Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=production
PORT=3000
OCR_API_KEY=your_ocr_api_key_here
```

### OCR Space API Setup
The application uses OCR Space API for price tag scanning:
1. Sign up at [OCR Space](https://ocr.space/ocrapi)
2. Get your API key
3. Add it to your environment variables

## Universal Deployment Script

### Features
- **Smart Cleanup**: Only removes dependencies if package.json has changed
- **Same-Folder Deployment**: No separate deploy directory needed
- **Automatic Server Management**: Stops existing servers gracefully
- **Production Scripts**: Creates `start-prod.sh` and `restart.sh`

### Usage
```bash
# Deploy the application
./deploy-universal.sh

# Start production server
./start-prod.sh

# Restart server
./restart.sh
```

### What the Script Does
1. **Checks Dependencies**: Compares package.json timestamps with package-lock.json
2. **Smart Cleanup**: Only reinstalls if dependencies changed
3. **Builds Client**: Creates optimized production build
4. **Copies Files**: Moves build files to `server/public`
5. **Creates Scripts**: Generates production startup scripts
6. **Manages Server**: Stops existing processes on port 3000

## Features
- ✅ Mobile-responsive design with touch-friendly controls
- ✅ Smart bin-packing algorithm for optimal item grouping
- ✅ Drag and drop functionality between groups
- ✅ Item editing (price and quantity updates)
- ✅ Local storage persistence
- ✅ Euro (€) currency formatting
- ✅ Split items across multiple groups
- ✅ Target amount customization (default: €25)
- ✅ OCR price tag scanning with camera
- ✅ Automatic image processing and optimization
- ✅ Smart product name and price extraction

## API Endpoints
- `GET /api/lists` - Get all shopping lists
- `POST /api/lists` - Create new shopping list
- `PUT /api/lists/:id` - Update shopping list
- `DELETE /api/lists/:id` - Delete shopping list
- `POST /api/ocr` - Process image for OCR text extraction

## Deployment Options

### 1. Universal Deployment (Recommended)
```bash
./deploy-universal.sh
./start-prod.sh
```

### 2. Manual Deployment
```bash
# Build the client
npm run build

# Copy build files
mkdir -p server/public
cp -r dist/public/* server/public/

# Start server
NODE_ENV=production PORT=3000 npx tsx server/index.ts
```

### 3. Docker (Dockerfile example)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN mkdir -p server/public && cp -r dist/public/* server/public/
EXPOSE 3000
CMD ["npx", "tsx", "server/index.ts"]
```

### 4. Cloud Platforms
The app is ready for deployment on:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Port Already in Use
The universal deployment script automatically handles this, but if needed:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Issues
The universal deployment script handles dependency issues automatically:
```bash
# Force full cleanup and reinstall
rm -rf node_modules package-lock.json client/node_modules client/package-lock.json
./deploy-universal.sh
```

### OCR Issues
- Ensure OCR_API_KEY is set in environment variables
- Check OCR Space API quota and limits
- Verify image quality and size (auto-resized by the app)

### File Not Found Errors
If you see "Could not find the build directory" errors:
```bash
# Ensure build files are copied correctly
./deploy-universal.sh
```

## Support
This application uses modern web technologies:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query
- **OCR**: OCR Space API integration
- **Image Processing**: Client-side Canvas API

All dependencies are listed in `package.json` and will be installed automatically by the deployment script.

