# Shop Assistant v1.0

## Overview

This is a React-based shopping list application built with TypeScript that helps users create, manage, and organize their shopping lists with smart grouping capabilities and OCR price tag scanning. The app features a mobile-first design using shadcn/ui components and includes a bin-packing algorithm for intelligently distributing items across groups based on target amounts.

## User Preferences

Preferred communication style: Simple, everyday language.
Currency preference: Euro (€) instead of USD ($)


## System Architecture

The application follows a full-stack architecture with a clear separation between client and server components:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **OCR Service**: OCR Space API integration for price tag scanning
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, local storage for persistence
- **Deployment**: Universal deployment script with smart cleanup

## Key Components

### Frontend Architecture
- **Component Structure**: Organized into pages, components, and UI components
- **Routing**: Uses Wouter for client-side routing
- **State Management**: React hooks with TanStack Query for data fetching
- **UI Components**: Essential shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with dark mode support and CSS custom properties
- **OCR Integration**: Photo capture component with loading states

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **API Structure**: RESTful routes with `/api` prefix
- **Storage Interface**: Abstract storage interface with in-memory implementation
- **Development Setup**: Vite integration for development with HMR support
- **OCR Processing**: Image optimization and text extraction via OCR Space API

### Data Models
The application uses Zod schemas for type validation:
- **ShoppingItem**: Individual items with name, price, quantity, and total
- **ShoppingGroup**: Collections of items with target amounts for smart grouping
- **ShoppingList**: Main container with items, groups, and metadata

### Smart Grouping Algorithm
- **Bin Packing**: First Fit Decreasing algorithm for optimal item distribution
- **Target-Based**: Groups items based on configurable target amounts
- **Flexible**: Allows 20% overflow for better item placement

### OCR Features
- **Image Processing**: Automatic resizing and optimization for OCR API
- **Text Parsing**: Smart extraction of product names and prices
- **Price Formats**: Support for various Euro price formats including cents
- **Loading States**: Proper UX during OCR processing

## Data Flow

1. **List Creation**: Users create shopping lists with names and dates
2. **Item Management**: Add/remove items with price and quantity tracking
3. **OCR Scanning**: Take photos of price tags for automatic data extraction
4. **Smart Grouping**: Algorithm distributes items across groups based on target amounts
5. **Local Persistence**: All data stored in browser localStorage
6. **Real-time Updates**: Automatic total calculations and group rebalancing

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18 with TypeScript support
- **UI Components**: Essential shadcn/ui component library with Radix UI
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with class variance authority

### Backend Dependencies
- **Server**: Express.js with TypeScript
- **OCR Service**: OCR Space API wrapper for text extraction
- **Image Processing**: Sharp library for image optimization
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESBuild for fast bundling

## Deployment Strategy

### Development
- **Local Development**: `npm run dev` starts both client and server with HMR
- **Asset Handling**: Vite handles client assets with path resolution
- **OCR Testing**: Local OCR processing with image optimization

### Production
- **Universal Deployment**: `./deploy-universal.sh` script with smart cleanup
- **Build Process**: 
  1. Vite builds the client to `dist/public`
  2. Build files copied to `server/public`
  3. Production startup scripts generated
- **Server**: Express serves static files and API routes
- **Environment**: Configurable via environment variables
- **Server Management**: Graceful shutdown and restart capabilities

### File Structure
- `client/`: React frontend application
- `server/`: Express backend with API routes
- `shared/`: Common schemas and types shared between client and server
- `deploy-universal.sh`: Universal deployment script
- `start-prod.sh`: Production startup script (generated)
- `restart.sh`: Server restart script (generated)

## Universal Deployment Features

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

The application is designed to be easily deployable on platforms like Replit with minimal configuration, while maintaining the flexibility to scale to more complex deployment scenarios. The universal deployment script ensures consistent and reliable deployments across different environments.