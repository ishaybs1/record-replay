# Linux OS Activity Monitor

A real-time Linux operating system activity monitor built with React, TypeScript, and Tracee eBPF. Monitor kernel-level syscalls, visualize process trees, track file activity, and analyze system operations.

## Features

### 🔍 **Kernel Trace Viewer**
- Real-time syscall monitoring via Tracee eBPF
- WebSocket streaming support for live events
- File upload for analyzing Tracee NDJSON logs
- Category-based filtering (process, file, security, container, syscall)
- Export to JSON/CSV formats

### 🌳 **Process Tree Visualization**
- Hierarchical process view showing parent-child relationships
- Event count per process
- Collapsible tree structure for easy navigation
- Real-time process tracking

### 📁 **File Activity Dashboard**
- Track file I/O operations (read, write, open)
- Filter files by path
- View which processes access specific files
- Top files by operation count

### 📊 **Syscall Analytics**
- Category distribution charts (pie chart visualization)
- Top processes by syscall count (bar chart)
- Top syscalls with frequency analysis
- Duration tracking and event statistics

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn-ui + Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Kernel Tracing**: Tracee eBPF (Aqua Security)
- **Deployment**: Kubernetes-ready with DaemonSet configuration

## Quick Start

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`.

### Ubuntu Setup

For a complete Ubuntu setup with Tracee integration, use the provided scripts:

```sh
# Complete automated setup
./install-and-run.sh

# Or quick setup for experienced users
./quick-setup.sh
```

See [UBUNTU_SETUP.md](UBUNTU_SETUP.md) for detailed manual setup instructions.

## Kubernetes Deployment

Deploy Tracee as a DaemonSet to monitor all nodes in your cluster:

```sh
# Deploy Tracee DaemonSet
kubectl apply -f k8s/tracee-daemonset.yaml

# Deploy Tracee Service
kubectl apply -f k8s/tracee-service.yaml
```

The Tracee WebSocket stream will be available at:
```
ws://tracee-stream.default.svc.cluster.local:8081
```

### Tracee Configuration

The DaemonSet runs two containers per node:
1. **Tracee** - eBPF-based kernel tracer capturing all syscalls
2. **Websocat** - WebSocket server streaming events to the UI

## Architecture

```
src/features/os-recorder/
├── context/
│   └── KernelTraceContext.tsx    # Global state for kernel events
├── components/
│   ├── KernelTraceViewer.tsx     # Main trace viewer UI
│   ├── OSRecorderPanel.tsx       # Control panel
│   ├── ProcessTreeView.tsx       # Process hierarchy
│   ├── FileActivityDashboard.tsx # File I/O tracking
│   └── SyscallAnalytics.tsx      # Statistics & charts
├── parsers/
│   └── traceeParser.ts           # NDJSON parser for Tracee
└── types/
    └── traceTypes.ts             # TypeScript interfaces
```

## Use Cases

- **System Debugging**: Track down mysterious system behavior
- **Security Monitoring**: Detect unusual process activity or file access
- **Performance Analysis**: Identify syscall hotspots and bottlenecks
- **Container Monitoring**: Track container operations in Kubernetes
- **DevOps Auditing**: Monitor system-level changes in production

## Event Categories

The application categorizes syscalls into:

- **Process**: `execve`, `fork`, `clone`, `exit`, `setuid`, `setgid`
- **File**: `open`, `read`, `write`, `close`, `chmod`, `chown`, `stat`
- **Security**: `ptrace`, `capset`, `seccomp`, `bpf`
- **Container**: `cgroup`, `mount`, `umount`, `pivot_root`
- **Syscall**: All other system calls
- **Other**: Uncategorized events

Network events are captured but filtered by default to reduce noise.

## Export Formats

### JSON Export
Exports complete trace session with metadata:
```json
{
  "version": 1,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "totalEvents": 1523,
  "events": [...]
}
```

### CSV Export
Tabular format for spreadsheet analysis with columns:
- Timestamp, Event, PID, TID, Command, Category, Container ID, Container Image, Host, Arguments

## Requirements

### Runtime
- **Node.js**: 18.x LTS or higher
- **Linux Kernel**: 4.14+ (for eBPF support)
- **Privileges**: Root or CAP_SYS_ADMIN for Tracee

### Development
- npm or yarn
- TypeScript 5.x

## Project Info

**Lovable Project URL**: https://lovable.dev/projects/952c077f-284d-4a03-8779-4c969037a675

## Development Workflow

### Using Lovable
Visit the [Lovable Project](https://lovable.dev/projects/952c077f-284d-4a03-8779-4c969037a675) and start prompting. Changes are committed automatically.

### Using Your IDE
Clone, edit, and push changes. They'll be reflected in Lovable automatically.

### GitHub Codespaces
Launch a Codespace from the repository for instant cloud-based development.

## Deployment

Deploy to production via Lovable:
1. Open your [Lovable project](https://lovable.dev/projects/952c077f-284d-4a03-8779-4c969037a675)
2. Click **Share → Publish**

### Custom Domain
Connect a custom domain via **Project > Settings > Domains**.

Read more: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
- GitHub Issues: [Report a bug](https://github.com/your-repo/issues)
- Documentation: Check [UBUNTU_SETUP.md](UBUNTU_SETUP.md) for setup help
