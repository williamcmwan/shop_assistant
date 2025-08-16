#!/bin/bash

# ShopAssist Application Management Script
# Combined script for start, stop, and restart operations with background support

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Get port from environment or default to 3000
PORT=${PORT:-3000}

# Log file paths
LOG_DIR="./logs"
APP_LOG="$LOG_DIR/app.log"
ERROR_LOG="$LOG_DIR/error.log"
PID_FILE="$LOG_DIR/app.pid"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

start_server() {
    local background_mode=${1:-false}
    
    echo "🚀 Starting ShopAssist Production Server"
    echo "========================================"
    
    # Check if server files exist
    if [ ! -f "server/index.ts" ]; then
        print_error "server/index.ts not found"
        exit 1
    fi
    
    # Check if server is already running
    if [ -f "$PID_FILE" ]; then
        local existing_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ ! -z "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            print_error "Server is already running (PID: $existing_pid)"
            print_info "Use './scripts/app.sh stop' to stop it first"
            exit 1
        else
            # Remove stale PID file
            rm -f "$PID_FILE"
        fi
    fi
    
    # Double check with port
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        print_error "Port $PORT is already in use by PID $PID"
        print_info "Use './scripts/app.sh stop' to stop it first"
        exit 1
    fi
    
    # Set environment variables
    export NODE_ENV=production
    export PORT=$PORT
    
    print_status "Starting server on port $PORT..."
    print_info "Server will be available at: http://localhost:$PORT"
    print_info "Mobile devices can access via your computer's IP address"
    
    if [ "$background_mode" = "true" ]; then
        print_status "Starting in background mode..."
        print_info "Logs: $APP_LOG"
        print_info "Errors: $ERROR_LOG"
        print_info "PID file: $PID_FILE"
        echo ""
        
        # Start server in background with logging
        nohup env NODE_ENV=production PORT=$PORT npx tsx server/index.ts > "$APP_LOG" 2> "$ERROR_LOG" &
        local server_pid=$!
        echo "$server_pid" > "$PID_FILE"
        
        # Disown the process to prevent it from being terminated when shell exits
        disown %1 2>/dev/null || true
        
        # Wait a moment to check if server started successfully
        sleep 2
        if kill -0 "$server_pid" 2>/dev/null; then
            print_success "Server started in background (PID: $server_pid)"
            print_info "Use './scripts/app.sh logs' to view logs"
            print_info "Use './scripts/app.sh stop' to stop the server"
        else
            print_error "Failed to start server"
            rm -f "$PID_FILE"
            exit 1
        fi
    else
        print_info "Press Ctrl+C to stop the server"
        echo ""
        
        # Start server in foreground
        npx tsx server/index.ts
    fi
}

stop_server() {
    echo "🛑 Stopping ShopAssist Server"
    echo "============================="
    
    local server_pid=""
    
    # Try to get PID from file first
    if [ -f "$PID_FILE" ]; then
        server_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ ! -z "$server_pid" ] && kill -0 "$server_pid" 2>/dev/null; then
            print_status "Found server process from PID file (PID: $server_pid)"
        else
            print_info "PID file exists but process not found, cleaning up..."
            rm -f "$PID_FILE"
            server_pid=""
        fi
    fi
    
    # Fallback to port-based detection
    if [ -z "$server_pid" ]; then
        server_pid=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ -z "$server_pid" ]; then
            print_info "No server running on port $PORT"
            rm -f "$PID_FILE"
            return 0
        fi
        print_status "Found server process on port $PORT (PID: $server_pid)"
    fi
    
    print_status "Stopping server (PID: $server_pid)..."
    kill -TERM "$server_pid" 2>/dev/null || true
    sleep 2
    
    # Check if still running and force kill if necessary
    if kill -0 "$server_pid" 2>/dev/null; then
        print_status "Force killing process $server_pid..."
        kill -9 "$server_pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Final check and cleanup
    if kill -0 "$server_pid" 2>/dev/null; then
        print_error "Failed to stop server"
        exit 1
    else
        print_success "Server stopped successfully"
        rm -f "$PID_FILE"
    fi
}

restart_server() {
    local background_mode=${1:-false}
    
    echo "🔄 Restarting ShopAssist Server"
    echo "==============================="
    
    stop_server
    echo ""
    start_server "$background_mode"
}

show_logs() {
    local log_type=${1:-app}
    
    case "$log_type" in
        app)
            if [ -f "$APP_LOG" ]; then
                print_info "Showing application logs ($APP_LOG):"
                echo ""
                tail -f "$APP_LOG"
            else
                print_info "No application logs found at $APP_LOG"
            fi
            ;;
        error)
            if [ -f "$ERROR_LOG" ]; then
                print_info "Showing error logs ($ERROR_LOG):"
                echo ""
                tail -f "$ERROR_LOG"
            else
                print_info "No error logs found at $ERROR_LOG"
            fi
            ;;
        all)
            if [ -f "$APP_LOG" ] || [ -f "$ERROR_LOG" ]; then
                print_info "Showing all logs (app + error):"
                echo ""
                if [ -f "$APP_LOG" ] && [ -f "$ERROR_LOG" ]; then
                    tail -f "$APP_LOG" "$ERROR_LOG"
                elif [ -f "$APP_LOG" ]; then
                    tail -f "$APP_LOG"
                elif [ -f "$ERROR_LOG" ]; then
                    tail -f "$ERROR_LOG"
                fi
            else
                print_info "No logs found in $LOG_DIR"
            fi
            ;;
        *)
            print_error "Invalid log type: $log_type"
            print_info "Available types: app, error, all"
            exit 1
            ;;
    esac
}

show_usage() {
    echo "ShopAssist Application Management"
    echo "Usage: $0 {start|start-bg|stop|restart|restart-bg|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start      - Start the production server (foreground)"
    echo "  start-bg   - Start the production server (background)"
    echo "  stop       - Stop the running server"
    echo "  restart    - Stop and then start the server (foreground)"
    echo "  restart-bg - Stop and then start the server (background)"
    echo "  status     - Show server status"
    echo "  logs [type] - Show logs (types: app, error, all)"
    echo ""
    echo "Environment:"
    echo "  PORT       - Server port (default: 3000)"
    echo ""
    echo "Log files:"
    echo "  App logs:  $APP_LOG"
    echo "  Errors:    $ERROR_LOG"
    echo "  PID file:  $PID_FILE"
}

show_status() {
    echo "📊 ShopAssist Server Status"
    echo "=========================="
    
    local server_pid=""
    local is_background=false
    
    # Check PID file first
    if [ -f "$PID_FILE" ]; then
        server_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ ! -z "$server_pid" ] && kill -0 "$server_pid" 2>/dev/null; then
            is_background=true
            print_success "Server is running in background (PID: $server_pid)"
        else
            print_info "Stale PID file found, cleaning up..."
            rm -f "$PID_FILE"
            server_pid=""
        fi
    fi
    
    # Fallback to port check
    if [ -z "$server_pid" ]; then
        server_pid=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ ! -z "$server_pid" ]; then
            print_success "Server is running on port $PORT (PID: $server_pid)"
            print_info "Note: Running in foreground mode (no PID file)"
        else
            print_info "Server is not running on port $PORT"
            return 0
        fi
    fi
    
    print_info "URL: http://localhost:$PORT"
    
    if [ "$is_background" = "true" ]; then
        print_info "Mode: Background"
        print_info "Logs: Use './scripts/app.sh logs' to view"
        
        # Show log file sizes if they exist
        if [ -f "$APP_LOG" ]; then
            local log_size=$(du -h "$APP_LOG" | cut -f1)
            print_info "App log size: $log_size"
        fi
        if [ -f "$ERROR_LOG" ]; then
            local error_size=$(du -h "$ERROR_LOG" | cut -f1)
            print_info "Error log size: $error_size"
        fi
    else
        print_info "Mode: Foreground"
    fi
}

# Main script logic
case "${1:-}" in
    start)
        start_server false
        ;;
    start-bg)
        start_server true
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server false
        ;;
    restart-bg)
        restart_server true
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-app}"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
