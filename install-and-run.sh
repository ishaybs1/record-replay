#!/bin/bash

# Ubuntu VM Setup and Run Script for React/TypeScript Application with Tracee
# This script automates the entire setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Check if sudo is available
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_error "This script requires sudo privileges. Please ensure your user can run sudo commands."
        exit 1
    fi
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    log_success "System packages updated"
}

# Install essential packages
install_essentials() {
    log_info "Installing essential packages..."
    sudo apt install -y curl wget git build-essential
    log_success "Essential packages installed"
}

# Install Node.js using NodeSource repository
install_nodejs() {
    log_info "Installing Node.js 18.x LTS..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            log_success "Node.js $(node --version) is already installed"
            return 0
        else
            log_warning "Node.js version $NODE_VERSION found, but we need 18+. Installing newer version..."
        fi
    fi
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log_success "Node.js $(node --version) and npm $(npm --version) installed successfully"
    else
        log_error "Failed to install Node.js"
        exit 1
    fi
}

# Install project dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Install dependencies with increased memory limit
    export NODE_OPTIONS="--max-old-space-size=4096"
    npm install
    
    log_success "Project dependencies installed"
}

# Install and setup Tracee
install_tracee() {
    log_info "Installing Tracee kernel tracing tool..."
    
    # Check if Tracee is already installed
    if command -v tracee &> /dev/null; then
        log_success "Tracee is already installed"
    else
        # Download and install Tracee
        log_info "Downloading Tracee..."
        wget -q https://github.com/aquasecurity/tracee/releases/latest/download/tracee.tar.gz
        
        if [[ $? -eq 0 ]]; then
            tar -xzf tracee.tar.gz
            sudo mv tracee /usr/local/bin/
            sudo chmod +x /usr/local/bin/tracee
            rm tracee.tar.gz
            log_success "Tracee installed successfully"
        else
            log_error "Failed to download Tracee"
            exit 1
        fi
    fi
    
    # Create tracee output directory
    sudo mkdir -p /tmp/tracee
    sudo chmod 777 /tmp/tracee
    log_success "Tracee output directory created"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall rules..."
    
    # Check if ufw is installed
    if ! command -v ufw &> /dev/null; then
        sudo apt install -y ufw
    fi
    
    # Allow development server port
    sudo ufw allow 8080/tcp
    
    # Allow Tracee WebSocket port
    sudo ufw allow 8081/tcp
    
    # Enable firewall if not already enabled
    if ! sudo ufw status | grep -q "Status: active"; then
        sudo ufw --force enable
    fi
    
    log_success "Firewall configured"
}

# Get VM IP address
get_vm_ip() {
    # Try to get IP address from different network interfaces
    VM_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' 2>/dev/null || \
            hostname -I | awk '{print $1}' 2>/dev/null || \
            ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
    
    if [[ -n "$VM_IP" ]]; then
        echo "$VM_IP"
    else
        echo "localhost"
    fi
}

# Start the application
start_application() {
    log_info "Starting the application..."
    
    # Get VM IP
    VM_IP=$(get_vm_ip)
    
    log_success "Setup complete! Starting the development server..."
    log_info "The application will be available at:"
    log_info "  - Local:  http://localhost:8080"
    log_info "  - Network: http://$VM_IP:8080"
    log_info ""
    log_info "Press Ctrl+C to stop the server"
    log_info "----------------------------------------"
    
    # Start the development server
    npm run dev
}

# Main installation function
main() {
    log_info "Starting Ubuntu VM setup for React/TypeScript application..."
    log_info "This script will install Node.js, dependencies, and Tracee"
    log_info ""
    
    # Pre-flight checks
    check_root
    check_sudo
    
    # Installation steps
    update_system
    install_essentials
    install_nodejs
    install_dependencies
    install_tracee
    configure_firewall
    
    log_success "All components installed successfully!"
    log_info ""
    
    # Ask user if they want to start the application immediately
    read -p "Do you want to start the application now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_application
    else
        VM_IP=$(get_vm_ip)
        log_info "Setup complete! To start the application later, run:"
        log_info "  npm run dev"
        log_info ""
        log_info "The application will be available at:"
        log_info "  - Local:  http://localhost:8080"
        log_info "  - Network: http://$VM_IP:8080"
    fi
}

# Handle script interruption
trap 'log_warning "Installation interrupted by user"; exit 1' INT

# Run main function
main "$@"

