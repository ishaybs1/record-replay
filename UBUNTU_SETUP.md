# Ubuntu VM Setup Instructions

This guide will help you set up and run this React/TypeScript application with Tracee kernel tracing on an Ubuntu VM.

## Prerequisites

- Ubuntu 20.04 LTS or later
- At least 4GB RAM
- At least 20GB free disk space
- Internet connection
- sudo privileges

## Quick Start (Automated Setup)

For a fully automated setup, you can use the provided installation script:

```bash
# Make the script executable (on Ubuntu)
chmod +x install-and-run.sh

# Run the complete setup script
./install-and-run.sh
```

Or for a quick minimal setup:

```bash
# Quick setup script (less verbose)
chmod +x quick-setup.sh
./quick-setup.sh
```

The scripts will:
- Update your system
- Install Node.js 18.x LTS
- Install all project dependencies
- Set up Tracee kernel tracing
- Configure firewall rules
- Start the development server

## Manual Setup (Step by Step)

If you prefer to set up manually or need more control:

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Node.js

### Option A: Using NodeSource Repository (Recommended)

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Option B: Using nvm (Alternative)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
```

## Step 3: Install Git

```bash
sudo apt install git -y
```

## Step 4: Clone the Repository

```bash
# Clone your repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

## Step 5: Install Dependencies

```bash
# Install project dependencies
npm install
```

## Step 6: Install Tracee (Optional - for kernel tracing)

If you want to use the kernel tracing features:

```bash
# Download and install Tracee
wget https://github.com/aquasecurity/tracee/releases/latest/download/tracee.tar.gz
tar -xzf tracee.tar.gz
sudo mv tracee /usr/local/bin/
sudo chmod +x /usr/local/bin/tracee

# Create output directory
sudo mkdir -p /tmp/tracee
sudo chmod 777 /tmp/tracee
```

## Step 7: Configure Firewall (if needed)

```bash
# Allow the development server port
sudo ufw allow 8080

# Allow Tracee WebSocket port (if using)
sudo ufw allow 8081
```

## Step 8: Run the Application

### Development Mode

```bash
# Start the development server
npm run dev
```

The application will be available at:
- **Local access**: http://localhost:8080
- **Network access**: http://YOUR_VM_IP:8080

### Production Build

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Step 9: Running Tracee (Optional)

If you installed Tracee and want to run kernel tracing:

```bash
# Make the run script executable
chmod +x run

# Run Tracee (requires sudo)
sudo tracee --output json --events all > /tmp/tracee/trace.ndjson
```

## Step 10: Access from Host Machine

To access the application from your host machine:

1. Find your VM's IP address:
   ```bash
   ip addr show
   ```

2. Open your browser on the host machine and navigate to:
   ```
   http://YOUR_VM_IP:8080
   ```

## Troubleshooting

### Port Already in Use

If port 8080 is already in use:

```bash
# Find what's using the port
sudo lsof -i :8080

# Kill the process if needed
sudo kill -9 <PID>
```

### Permission Issues with Tracee

```bash
# Ensure proper permissions
sudo chmod +x /usr/local/bin/tracee
sudo chown root:root /usr/local/bin/tracee
```

### Node.js Version Issues

If you encounter Node.js version issues:

```bash
# Check current version
node --version

# Update to latest LTS if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Memory Issues

If you encounter memory issues during npm install:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm install
```

## Environment Variables

Create a `.env` file in the project root if needed:

```bash
# Example .env file
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:8081
```

## Development Tips

1. **Hot Reload**: The development server supports hot reloading - changes will be reflected immediately.

2. **Linting**: Run the linter to check code quality:
   ```bash
   npm run lint
   ```

3. **Type Checking**: The project uses TypeScript for type safety.

4. **Tailwind CSS**: The project uses Tailwind CSS for styling with shadcn/ui components.

## Security Considerations

1. **Firewall**: Consider configuring UFW firewall rules for production:
   ```bash
   sudo ufw enable
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 8080
   ```

2. **Tracee Permissions**: Tracee requires root privileges - use with caution in production environments.

## Next Steps

1. Configure your IDE/editor for TypeScript development
2. Set up version control with Git
3. Consider setting up CI/CD pipelines
4. Configure monitoring and logging for production use

## Available Scripts

This project includes two automated setup scripts:

### `install-and-run.sh` - Complete Setup Script
- **Purpose**: Full automated installation with detailed logging
- **Features**: 
  - Comprehensive error checking
  - Colored output for better readability
  - Interactive prompts
  - Automatic IP detection
  - Option to start immediately or later
- **Usage**: `./install-and-run.sh`

### `quick-setup.sh` - Minimal Setup Script
- **Purpose**: Fast, minimal setup for experienced users
- **Features**:
  - Streamlined installation process
  - Less verbose output
  - Automatic start after installation
- **Usage**: `./quick-setup.sh`

### Script Features
Both scripts automatically:
- Update Ubuntu system packages
- Install Node.js 18.x LTS
- Install project dependencies with increased memory limit
- Set up Tracee kernel tracing tool
- Create necessary directories with proper permissions
- Configure firewall rules
- Detect VM IP address
- Start the development server

### Running Scripts
```bash
# Make scripts executable
chmod +x install-and-run.sh quick-setup.sh

# Run complete setup
./install-and-run.sh

# Or run quick setup
./quick-setup.sh
```

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all dependencies are installed correctly
3. Ensure all required ports are accessible
4. Check system logs: `journalctl -f`
5. Try running the setup scripts with verbose output for debugging
