#!/bin/bash

# ShopAssist Universal Deployment Script
# Version: 2.3.1
# Deploys application in the same folder with smart cleanup

set -euo pipefail

echo "🚀 Starting ShopAssist Universal Deployment v2.3.1"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${YELLOW}[STATUS] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_warning() {
    echo -e "${RED}[WARNING] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a file/directory exists and is newer than a reference
is_newer_than() {
    local file="$1"
    local reference="$2"
    
    if [ ! -f "$file" ] || [ ! -f "$reference" ]; then
        return 1
    fi
    
    [ "$file" -nt "$reference" ]
}

# Function to check if cleanup is needed
needs_cleanup() {
    local package_json_modified=false
    local client_package_json_modified=false
    
    # Check if package.json was modified since last install
    if [ -f "package-lock.json" ]; then
        if is_newer_than "package.json" "package-lock.json"; then
            package_json_modified=true
        fi
    else
        package_json_modified=true
    fi
    
    # Check if client/package.json was modified since last install
    if [ -f "client/package-lock.json" ]; then
        if is_newer_than "client/package.json" "client/package-lock.json"; then
            client_package_json_modified=true
        fi
    else
        client_package_json_modified=true
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
        return 0  # Cleanup needed
    fi
    
    # Check if any source files are newer than node_modules
    if [ "$package_json_modified" = true ] || [ "$client_package_json_modified" = true ]; then
        return 0  # Cleanup needed
    fi
    
    return 1  # No cleanup needed
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Determine if cleanup is needed
if needs_cleanup; then
    print_status "Dependencies need to be updated. Performing cleanup..."
    
    # Clean previous builds and dependencies
    print_status "Removing old node_modules and package-lock files..."
    rm -rf node_modules
    rm -rf client/node_modules
    rm -f package-lock.json
    rm -f client/package-lock.json
    rm -rf client/dist
    rm -rf dist
    rm -rf server/public
    
    print_success "Cleanup completed."
else
    print_status "No cleanup needed. Dependencies are up to date."
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed."
fi

if [ ! -d "client/node_modules" ]; then
    print_status "Installing client dependencies..."
    cd client && npm install && cd ..
    print_success "Client dependencies installed."
fi

# Build client
print_status "Building client..."
cd client && npm run build && cd ..
print_success "Client build completed."

# Copy client build files to server/public for production
print_status "Copying client build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/
print_success "Client build files copied to server/public."

# Stop existing server if running
PID=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    print_warning "Port 3000 is in use by PID $PID. Stopping it..."
    kill -TERM $PID 2>/dev/null || true
    sleep 2
    # Force kill if still running
    PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        print_warning "Force killing process $PID..."
        kill -9 $PID 2>/dev/null || true
    fi
    print_success "Server stopped."
else
    print_status "Port 3000 is free."
fi

# Create production start script
print_status "Creating production start script..."
cat > "start-prod.sh" <<'EOL'
#!/bin/bash
set -e

echo "🚀 Starting ShopAssist Production Server"
echo "========================================"

# Set environment variables
export NODE_ENV=production
export PORT=3000

# Check if server files exist
if [ ! -f "server/index.ts" ]; then
    echo "❌ Error: server/index.ts not found"
    exit 1
fi

# Start the server
echo "📍 Starting server on port $PORT..."
echo "🌐 Server will be available at: http://localhost:$PORT"
echo "📱 Mobile devices can access via your computer's IP address"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npx tsx server/index.ts
EOL

chmod +x "start-prod.sh"
print_success "Production start script created."

# Create a simple restart script
print_status "Creating restart script..."
cat > "restart.sh" <<'EOL'
#!/bin/bash
echo "🔄 Restarting ShopAssist..."

# Stop existing server
PID=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$PID" ]; then
    echo "Stopping existing server (PID: $PID)..."
    kill -TERM $PID 2>/dev/null || true
    sleep 2
    PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo "Force killing process $PID..."
        kill -9 $PID 2>/dev/null || true
    fi
fi

# Start server
echo "Starting server..."
./start-prod.sh
EOL

chmod +x "restart.sh"
print_success "Restart script created."

# Print completion message
echo ""
print_success "🎉 Universal deployment completed successfully!"
echo ""
echo "📋 Available commands:"
echo -e "  ${YELLOW}./start-prod.sh${NC}  - Start the production server"
echo -e "  ${YELLOW}./restart.sh${NC}     - Restart the server"
echo -e "  ${YELLOW}./deploy-universal.sh${NC} - Redeploy (smart cleanup)"
echo ""
echo "🌐 Server will be available at: http://localhost:3000"
echo "📱 Mobile devices can access via your computer's IP address"
echo ""
echo "💡 Tip: Run './start-prod.sh' to start the server now" 