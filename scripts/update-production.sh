#!/bin/bash

# Production Update Script
# Updates the application with latest changes and removes old dependencies

set -euo pipefail

echo "🔄 Starting Production Update"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${YELLOW}[STATUS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Stop the server
print_status "Stopping server..."
./scripts/app.sh stop 2>/dev/null || print_info "Server was not running"

# Step 2: Backup current .env
print_status "Backing up .env file..."
if [ -f ".env" ]; then
    cp .env .env.backup
    print_success ".env backed up to .env.backup"
else
    print_info "No .env file found to backup"
fi

# Step 3: Pull latest changes
print_status "Pulling latest changes from git..."
git pull origin main

# Step 4: Clean old dependencies
print_status "Cleaning old dependencies..."
rm -rf node_modules
print_success "node_modules removed"

# Step 5: Clean package-lock
print_status "Removing package-lock.json..."
rm -f package-lock.json
print_success "package-lock.json removed"

# Step 6: Clean npm cache
print_status "Cleaning npm cache..."
npm cache clean --force
print_success "npm cache cleaned"

# Step 7: Install fresh dependencies
print_status "Installing fresh dependencies..."
npm install
print_success "Dependencies installed"

# Step 8: Check .env configuration
print_status "Checking .env configuration..."
if [ -f ".env" ]; then
    if grep -q "OCRSPACE_API_KEY" .env; then
        print_info "⚠️  Found OCRSPACE_API_KEY in .env (no longer needed)"
        echo ""
        echo "You can remove these lines from .env:"
        echo "  - PRICETAG_EXTRACTION_BACKEND"
        echo "  - OCRSPACE_API_KEY"
        echo ""
    fi
    
    if ! grep -q "GEMINI_API_KEY" .env; then
        print_error "GEMINI_API_KEY not found in .env!"
        echo ""
        echo "Please add to .env:"
        echo "  GEMINI_API_KEY=your_gemini_api_key_here"
        echo "  GEMINI_MODEL=gemini-2.0-flash-lite"
        echo ""
        exit 1
    else
        print_success "GEMINI_API_KEY found in .env"
    fi
else
    print_error ".env file not found!"
    echo ""
    echo "Please create .env file with:"
    echo "  GEMINI_API_KEY=your_gemini_api_key_here"
    echo "  GEMINI_MODEL=gemini-2.0-flash-lite"
    echo "  PORT=3000"
    echo "  NODE_ENV=production"
    echo ""
    exit 1
fi

# Step 9: Rebuild the application
print_status "Rebuilding application..."
./scripts/deploy.sh

# Step 10: Start the server
print_status "Starting server..."
./scripts/app.sh start-bg

# Wait a moment for server to start
sleep 3

# Step 11: Verify server is running
print_status "Verifying server status..."
if ./scripts/app.sh status | grep -q "running"; then
    print_success "Server is running!"
else
    print_error "Server failed to start. Check logs with: ./scripts/app.sh logs"
    exit 1
fi

# Step 12: Test health endpoint
print_status "Testing health endpoint..."
PORT=${PORT:-3000}
if curl -s "http://localhost:$PORT/api/health" | grep -q "ok"; then
    print_success "Health check passed!"
else
    print_error "Health check failed. Check logs with: ./scripts/app.sh logs"
    exit 1
fi

echo ""
print_success "🎉 Production update completed successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Server stopped"
echo "  ✅ Latest code pulled"
echo "  ✅ Dependencies cleaned and reinstalled"
echo "  ✅ Application rebuilt"
echo "  ✅ Server restarted"
echo "  ✅ Health check passed"
echo ""
echo "🔍 Next steps:"
echo "  - Test price tag scanning with camera"
echo "  - Monitor logs: ./scripts/app.sh logs"
echo "  - Check status: ./scripts/app.sh status"
echo ""
echo "📱 Application is available at: http://localhost:$PORT"
