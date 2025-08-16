#!/bin/bash

# ShopAssist Deployment Script
# Simplified version - uses port 3000 by default from .env or environment

set -euo pipefail

echo "🚀 Starting ShopAssist Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${YELLOW}[STATUS] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Get port from environment or default to 3000
PORT=${PORT:-3000}
print_status "Server will run on port: $PORT"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf client/dist
rm -rf dist
rm -rf server/public

# Install dependencies
print_status "Installing root dependencies..."
npm install

print_status "Installing client dependencies..."
cd client && npm install && cd ..

# Build client
print_status "Building client..."
cd client && npm run build && cd ..

# Copy client build files to server/public for production
print_status "Copying client build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

# Stop existing server if running
PID=$(lsof -ti:$PORT 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    print_status "Stopping existing server on port $PORT (PID: $PID)..."
    kill -TERM $PID 2>/dev/null || true
    sleep 2
    # Force kill if still running
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        print_status "Force killing process $PID..."
        kill -9 $PID 2>/dev/null || true
    fi
fi

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Available commands:"
echo -e "  ${YELLOW}./scripts/app.sh start${NC}   - Start the server"
echo -e "  ${YELLOW}./scripts/app.sh stop${NC}    - Stop the server"
echo -e "  ${YELLOW}./scripts/app.sh restart${NC} - Restart the server"
echo ""
echo "🌐 Server will be available at: http://localhost:$PORT"
echo "📱 Mobile devices can access via your computer's IP address"
