#!/bin/bash

# Complete Setup and Run Script
# This script installs dependencies, starts Tracee, and runs the React app
# Everything works together in one command!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Linux OS Activity Monitor - Complete Setup & Run     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}❌ Error: This script must run on Linux (Ubuntu/Debian)${NC}"
    echo -e "${YELLOW}   Tracee requires Linux kernel with eBPF support${NC}"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Error: Don't run this script as root/sudo${NC}"
    echo -e "${YELLOW}   The script will ask for sudo when needed${NC}"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Node.js if needed
if ! command_exists node; then
    echo -e "${YELLOW}📥 Installing Node.js 18.x LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed: $(node --version)${NC}"
fi

# Install npm dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📚 Installing npm dependencies...${NC}"
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Install websocat if needed (for WebSocket server)
if ! command_exists websocat; then
    echo -e "${YELLOW}📥 Installing websocat (WebSocket server)...${NC}"
    WEBSOCAT_VERSION="1.13.0"
    wget -q "https://github.com/vi/websocat/releases/download/v${WEBSOCAT_VERSION}/websocat.x86_64-unknown-linux-musl" -O /tmp/websocat
    sudo mv /tmp/websocat /usr/local/bin/websocat
    sudo chmod +x /usr/local/bin/websocat
    echo -e "${GREEN}✅ websocat installed${NC}"
else
    echo -e "${GREEN}✅ websocat already installed${NC}"
fi

# Install Tracee if needed
if ! command_exists tracee; then
    echo -e "${YELLOW}🔍 Installing Tracee...${NC}"
    wget -q https://github.com/aquasecurity/tracee/releases/latest/download/tracee.tar.gz
    tar -xzf tracee.tar.gz
    sudo mv tracee /usr/local/bin/
    sudo chmod +x /usr/local/bin/tracee
    rm tracee.tar.gz
    echo -e "${GREEN}✅ Tracee installed${NC}"
else
    echo -e "${GREEN}✅ Tracee already installed${NC}"
fi

# Create output directory
sudo mkdir -p /tmp/tracee
sudo chmod 777 /tmp/tracee

# Configure firewall if ufw is active
if command_exists ufw && sudo ufw status | grep -q "Status: active"; then
    echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
    sudo ufw allow 8080 >/dev/null 2>&1 || true
    sudo ufw allow 8081 >/dev/null 2>&1 || true
    echo -e "${GREEN}✅ Firewall configured${NC}"
fi

# Get IP address
VM_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Starting Services                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create a temporary file to store PIDs
PIDFILE="/tmp/tracee-app-pids.txt"
echo "" > "$PIDFILE"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"

    # Kill Tracee
    if [ -n "$TRACEE_PID" ]; then
        sudo kill $TRACEE_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Tracee stopped${NC}"
    fi

    # Kill websocat
    if [ -n "$WEBSOCAT_PID" ]; then
        kill $WEBSOCAT_PID 2>/dev/null || true
        echo -e "${GREEN}✅ websocat stopped${NC}"
    fi

    # Kill npm dev server
    if [ -n "$NPM_PID" ]; then
        kill $NPM_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Dev server stopped${NC}"
    fi

    # Kill any remaining processes
    pkill -f "tracee.*json" 2>/dev/null || true
    pkill -f "websocat.*8081" 2>/dev/null || true
    pkill -f "vite.*8080" 2>/dev/null || true

    rm -f "$PIDFILE"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

echo -e "${YELLOW}1️⃣  Starting Tracee (kernel tracer)...${NC}"
# Start Tracee in background, output JSON format
# FIXED: Use -o json instead of --output format:json
# Filter to only capture file creation/opening events (no read/write/close noise)
sudo tracee -o json --events open,openat,openat2,creat,mkdir,rmdir,unlink,unlinkat,rename,renameat 2>/dev/null | tee /tmp/tracee/trace.ndjson | websocat -s 8081 &
WEBSOCAT_PID=$!

# Give Tracee time to initialize
sleep 2

if ps -p $WEBSOCAT_PID > /dev/null; then
    echo -e "${GREEN}✅ Tracee + WebSocket server running (PID: $WEBSOCAT_PID)${NC}"
    echo -e "${GREEN}   WebSocket: ws://localhost:8081${NC}"
else
    echo -e "${RED}❌ Failed to start Tracee${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2️⃣  Starting React development server...${NC}"
# Start npm dev server in background
npm run dev &
NPM_PID=$!

# Wait for dev server to start
sleep 3

if ps -p $NPM_PID > /dev/null; then
    echo -e "${GREEN}✅ Dev server running (PID: $NPM_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start dev server${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 ALL SYSTEMS RUNNING! 🎉                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Access the application:${NC}"
echo -e "   🌐 Local:   ${GREEN}http://localhost:8080${NC}"
echo -e "   🌐 Network: ${GREEN}http://$VM_IP:8080${NC}"
echo ""
echo -e "${BLUE}🔍 Tracee WebSocket:${NC}"
echo -e "   🌐 ${GREEN}ws://localhost:8081${NC}"
echo ""
echo -e "${BLUE}📊 Services Status:${NC}"
echo -e "   ✅ Tracee eBPF:     Running (capturing syscalls)"
echo -e "   ✅ WebSocket:       Running (port 8081)"
echo -e "   ✅ React App:       Running (port 8080)"
echo ""
echo -e "${YELLOW}💡 Usage:${NC}"
echo -e "   1. Open your browser to ${GREEN}http://localhost:8080${NC}"
echo -e "   2. Click ${GREEN}'▶ Start Recording (Real Tracee)'${NC}"
echo -e "   3. Watch real-time kernel events appear!"
echo ""
echo -e "${YELLOW}🛑 To stop: Press ${RED}Ctrl+C${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Keep script running and show logs
echo -e "${YELLOW}📝 Watching for events (Ctrl+C to stop)...${NC}"
echo ""

# Wait for user to stop
wait