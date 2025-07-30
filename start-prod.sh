#!/bin/bash
set -e

echo "🚀 Starting ShopAssist Production Server"
echo "========================================"

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Set default environment variables
export NODE_ENV=production
export PORT=${PORT:-3000}

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
