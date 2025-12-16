# Quick Start Guide

## 🚀 One-Command Setup

This guide shows you how to run the complete Linux OS Activity Monitor with Tracee in **one command**.

---

## Option 1: Linux / Ubuntu VM (Recommended)

If you're on Ubuntu/Linux, just run:

```bash
chmod +x run-with-tracee.sh
./run-with-tracee.sh
```

**That's it!** The script will:
- ✅ Install Node.js (if needed)
- ✅ Install dependencies
- ✅ Install Tracee eBPF
- ✅ Install websocat (WebSocket server)
- ✅ Start Tracee capturing kernel events
- ✅ Start WebSocket server on port 8081
- ✅ Start React app on port 8080
- ✅ Everything works together automatically!

Then open your browser to: **http://localhost:8080**

---

## Option 2: Windows with WSL

If you're on Windows, you need WSL (Windows Subsystem for Linux):

### Step 1: Install WSL (if not already installed)

Open PowerShell as Administrator and run:
```powershell
wsl --install -d Ubuntu
```

Restart your computer after installation.

### Step 2: Run the app

**Option A - Use the batch file:**
```cmd
run-with-tracee.bat
```

**Option B - Use npm:**
```cmd
npm run start:wsl
```

**Option C - Manually in WSL:**
```bash
wsl
cd /mnt/c/Users/ishay/rec
chmod +x run-with-tracee.sh
./run-with-tracee.sh
```

Then open your browser to: **http://localhost:8080**

---

## Option 3: Just the Frontend (No Tracee)

If you just want to test the UI without kernel tracing:

```bash
npm install
npm run dev
```

Then open http://localhost:8080 and click **"🎭 Start Demo Mode"** to see fake data.

---

## What You'll See

Once everything is running:

```
╔════════════════════════════════════════════════════════╗
║              🎉 ALL SYSTEMS RUNNING! 🎉                ║
╚════════════════════════════════════════════════════════╝

📍 Access the application:
   🌐 Local:   http://localhost:8080
   🌐 Network: http://192.168.1.100:8080

🔍 Tracee WebSocket:
   🌐 ws://localhost:8081

📊 Services Status:
   ✅ Tracee eBPF:     Running (capturing syscalls)
   ✅ WebSocket:       Running (port 8081)
   ✅ React App:       Running (port 8080)

💡 Usage:
   1. Open your browser to http://localhost:8080
   2. Click '▶ Start Recording (Real Tracee)'
   3. Watch real-time kernel events appear!

🛑 To stop: Press Ctrl+C
```

---

## Troubleshooting

### "Cannot connect to Tracee"
- Make sure you're running on **Linux** (Ubuntu, Debian, etc.)
- Tracee requires Linux kernel with eBPF support
- Windows alone cannot run Tracee (you need WSL)

### "websocat: command not found"
The script automatically installs websocat. If it fails, install manually:
```bash
wget https://github.com/vi/websocat/releases/download/v1.13.0/websocat.x86_64-unknown-linux-musl -O /tmp/websocat
sudo mv /tmp/websocat /usr/local/bin/websocat
sudo chmod +x /usr/local/bin/websocat
```

### "Permission denied"
Run Tracee with sudo (the script handles this automatically):
```bash
sudo tracee --help
```

### Port already in use
Kill processes on ports 8080 or 8081:
```bash
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:8081 | xargs kill -9
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (http://localhost:8080)                │
│  ┌─────────────────────────────────────┐        │
│  │  React App (UI)                     │        │
│  └──────────────┬──────────────────────┘        │
│                 │                                │
│                 │ WebSocket Connection           │
│                 ↓                                │
│  ┌─────────────────────────────────────┐        │
│  │  websocat (ws://localhost:8081)     │        │
│  └──────────────┬──────────────────────┘        │
│                 │                                │
│                 │ JSON Stream                    │
│                 ↓                                │
│  ┌─────────────────────────────────────┐        │
│  │  Tracee eBPF (Kernel Tracer)        │        │
│  │  Captures: syscalls, file I/O,      │        │
│  │  process events, network, security  │        │
│  └─────────────────────────────────────┘        │
│                 │                                │
│                 ↓                                │
│         Linux Kernel (eBPF)                      │
└─────────────────────────────────────────────────┘
```

---

## What the Script Does

The `run-with-tracee.sh` script automatically:

1. **Checks System**: Verifies you're on Linux
2. **Installs Dependencies**:
   - Node.js 18.x LTS
   - npm packages
   - Tracee eBPF
   - websocat
3. **Configures Firewall**: Opens ports 8080 and 8081
4. **Starts Tracee**: Captures kernel events as JSON
5. **Starts WebSocket**: Pipes Tracee output to ws://localhost:8081
6. **Starts React App**: Launches dev server on http://localhost:8080
7. **Manages Processes**: Handles cleanup when you press Ctrl+C

---

## Development Scripts

```bash
# Just the React app (no Tracee)
npm run dev

# Full stack with Tracee (Linux/Ubuntu)
npm run start:full
./run-with-tracee.sh

# Full stack with Tracee (Windows WSL)
npm run start:wsl
run-with-tracee.bat

# Build for production
npm run build

# Run linter
npm run lint
```

---

## System Requirements

### For Full Functionality (Tracee)
- **OS**: Linux (Ubuntu 20.04+, Debian, etc.)
- **Kernel**: 4.14+ with eBPF support
- **RAM**: 4GB minimum
- **Disk**: 20GB free space
- **Privileges**: sudo access for Tracee

### For Demo Mode Only
- **OS**: Any (Windows, Mac, Linux)
- **Node.js**: 18.x LTS or higher
- **Browser**: Modern browser (Chrome, Firefox, Edge)

---

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- See [UBUNTU_SETUP.md](UBUNTU_SETUP.md) for manual setup steps
- Open an issue on GitHub if you encounter problems

---

**Happy Monitoring! 🎉**
