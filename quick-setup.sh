#!/bin/bash

# Quick Setup Script - Minimal installation for experienced users
# Run this if you just want to get the app running quickly

set -e

echo "🚀 Quick Setup for React/TypeScript App with Tracee"
echo "=================================================="

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Install Tracee if not present
if ! command -v tracee &> /dev/null; then
    echo "🔍 Installing Tracee..."
    wget -q https://github.com/aquasecurity/tracee/releases/latest/download/tracee.tar.gz
    tar -xzf tracee.tar.gz
    sudo mv tracee /usr/local/bin/
    sudo chmod +x /usr/local/bin/tracee
    rm tracee.tar.gz
    sudo mkdir -p /tmp/tracee
    sudo chmod 777 /tmp/tracee
fi

# Get IP and start
VM_IP=$(hostname -I | awk '{print $1}')
echo "✅ Setup complete!"
echo "🌐 App will be available at: http://$VM_IP:8080"
echo "🎯 Starting development server..."

npm run dev

