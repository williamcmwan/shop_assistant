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
