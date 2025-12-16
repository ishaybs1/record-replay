import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { parseTracee, parseTraceeLine } from "../parsers/traceeParser";
import { KernelEvent, KernelEventCategory } from "../types/traceTypes";

const categories: KernelEventCategory[] = ["process", "file", "network", "security", "container", "syscall", "other"];

export default function KernelTraceViewer() {
  const [events, setEvents] = React.useState<KernelEvent[]>([]);
  const [filters, setFilters] = React.useState<Record<KernelEventCategory, boolean>>({
    process: false, file: false, network: false, security: false, container: false, syscall: true, other: false,
  });
  const [streamUrl, setStreamUrl] = React.useState<string>("");
  const [streaming, setStreaming] = React.useState(false);
  const [autoLog, setAutoLog] = React.useState(true);
  const abortRef = React.useRef<AbortController | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const logIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseTracee(text);
    setEvents(parsed);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const toggle = (c: KernelEventCategory) => setFilters((f) => ({ ...f, [c]: !f[c] }));

  const connect = async () => {
    if (!streamUrl || streaming) return;
    try {
      if (streamUrl.startsWith("ws")) {
        setStreaming(true);
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;
        ws.onmessage = (ev) => {
          if (typeof ev.data !== "string") return;
          const chunks = ev.data.split(/\r?\n/);
          for (const line of chunks) {
            if (!line) continue;
            const evt = parseTraceeLine(line);
            if (evt) {
              setEvents((prev) => {
                const next = [...prev, evt];
                return next.length > 5000 ? next.slice(next.length - 5000) : next;
              });
            }
          }
        };
        ws.onclose = () => setStreaming(false);
        ws.onerror = () => setStreaming(false);
      } else {
        setStreaming(true);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const resp = await fetch(streamUrl, { signal: ctrl.signal });
        if (!resp.body) throw new Error("No response body");
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const evt = parseTraceeLine(line);
            if (evt) {
              setEvents((prev) => {
                const next = [...prev, evt];
                return next.length > 5000 ? next.slice(next.length - 5000) : next;
              });
            }
          }
        }
        setStreaming(false);
      }
    } catch {
      setStreaming(false);
    }
  };

  const disconnect = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    setStreaming(false);
  };

  const filtered = events.filter((e) => filters[e.category]);

  const from = events[0]?.ts;
  const to = events[events.length - 1]?.ts;
  const duration = from && to ? Math.max(0, to - from) : 0;

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "syscalls.json"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const saveToTxt = (eventsToSave: KernelEvent[]) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const lines = eventsToSave.map(e => {
      const eventTime = e.ts || e.timestamp || Date.now();
      const time = new Date(eventTime).toISOString();
      const eventName = e.name || e.eventName || 'unknown';
      const pid = e.pid || e.processInfo?.pid || '-';
      const tid = e.tid || e.processInfo?.tid || '-';
      const comm = e.comm || e.processInfo?.comm || '-';
      const args = e.args ? JSON.stringify(e.args) : '';
      return `[${time}] ${e.category.toUpperCase()} | ${eventName} | PID:${pid} TID:${tid} COMM:${comm} | ${args}`;
    });
    const content = `# Linux OS Activity Log\n# Generated: ${new Date().toISOString()}\n# Total Events: ${eventsToSave.length}\n\n${lines.join('\n')}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `os-activity-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-save to txt file every 30 seconds when recording
  React.useEffect(() => {
    if (autoLog && streaming && events.length > 0) {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
      logIntervalRef.current = setInterval(() => {
        if (events.length > 0) {
          saveToTxt(events);
        }
      }, 30000); // Save every 30 seconds
    }
    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = null;
      }
    };
  }, [autoLog, streaming, events]);

  const generateSampleData = () => {
    // Generate sample syscall data for demonstration - core system operations only
    const sampleEvents: KernelEvent[] = [
      {
        ts: Date.now() - 2000,
        name: "openat",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { pathname: "/etc/passwd", flags: "O_RDONLY" }
      },
      {
        ts: Date.now() - 1800,
        name: "read",
        pid: 1234,
        tid: 1234,
        comm: "bash", 
        category: "syscall",
        args: { fd: 3, count: 1024 }
      },
      {
        ts: Date.now() - 1600,
        name: "write",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall", 
        args: { fd: 1, count: 50 }
      },
      {
        ts: Date.now() - 1400,
        name: "close",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { fd: 3 }
      },
      {
        ts: Date.now() - 1200,
        name: "execve",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { filename: "/bin/ls", argv: ["ls", "-la"] }
      },
      {
        ts: Date.now() - 1000,
        name: "stat",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { pathname: "/tmp", statbuf: "0x7fff12345678" }
      },
      {
        ts: Date.now() - 800,
        name: "chmod",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { pathname: "/tmp/file.txt", mode: "0644" }
      },
      {
        ts: Date.now() - 600,
        name: "unlink",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { pathname: "/tmp/tempfile" }
      },
      {
        ts: Date.now() - 400,
        name: "mkdir",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: { pathname: "/tmp/newdir", mode: "0755" }
      },
      {
        ts: Date.now() - 200,
        name: "getpid",
        pid: 1234,
        tid: 1234,
        comm: "bash",
        category: "syscall",
        args: {}
      }
    ];
    setEvents(sampleEvents);
  };

  return (
    <section aria-label="Kernel Traces Import" className="space-y-3" data-recorder-ignore="true">
      <header>
        <h3 className="text-sm font-semibold mb-2">System Operations (Syscalls)</h3>
      </header>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="ws://tracee-stream.default.svc.cluster.local:8081"
            value={streamUrl}
            onChange={(e)=>setStreamUrl(e.target.value)}
            aria-label="NDJSON stream URL"
            className="h-8 text-xs flex-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!streaming ? (
            <Button size="sm" variant="secondary" onClick={connect} disabled={!streamUrl} className="w-full">
              ▶ Start Recording
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={disconnect} className="w-full">
              ⏹ Stop Recording
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={generateSampleData} className="w-full">
            Sample Data
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={downloadJSON} disabled={!filtered.length} className="w-full text-xs">
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => saveToTxt(events)} disabled={!events.length} className="w-full text-xs">
            Save TXT
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2">
            <Switch checked={autoLog} onCheckedChange={setAutoLog} aria-label="Auto-save to TXT" />
            <span>Auto-save (30s)</span>
          </label>
          {autoLog && streaming && (
            <span className="text-green-500">● Auto-logging</span>
          )}
        </div>

        <div className="text-xs">
          <input
            aria-label="Upload Tracee JSON/NDJSON"
            type="file"
            accept=".json,.ndjson,.log,.txt"
            onChange={onInput}
            className="text-xs w-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>Events: <span className="text-foreground font-medium">{events.length}</span></div>
        <div>Duration: <span className="text-foreground font-medium">{(duration/1000).toFixed(2)}s</span></div>
        <div>Processes: <span className="text-foreground font-medium">{new Set(events.map(e=>e.pid).filter(Boolean)).size}</span></div>
      </div>
      <Separator />
      <div className="flex flex-wrap gap-3 text-xs">
        {categories.map((c) => (
          <label key={c} className="inline-flex items-center gap-2">
            <Switch checked={filters[c]} onCheckedChange={() => toggle(c)} aria-label={`Toggle ${c}`} />
            <span className="capitalize">{c}</span>
          </label>
        ))}
      </div>
      <div className="border rounded-md h-40">
        <ScrollArea className="h-40">
          <ul className="divide-y">
            {filtered.slice(0, 300).map((e, i) => (
              <li key={i} className="px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground">{e.name}</div>
                  <div className="text-muted-foreground">
                    {e.comm ?? ""} #{e.pid ?? "-"}
                    {e.containerImage && <span className="ml-2 opacity-80">({e.containerImage})</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="capitalize">{e.category}</span>
                  <span>{from ? ((e.ts - from)/1000).toFixed(3) : "0.000"}s</span>
                </div>
                {e.args && (
                  <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] opacity-80">{JSON.stringify(e.args).slice(0, 240)}</pre>
                )}
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-6 text-center text-muted-foreground">
              <div className="space-y-2">
                <p>Upload Tracee NDJSON to view system operations (syscalls)</p>
                <p className="text-xs">Or click "Sample Data" to see example syscalls</p>
              </div>
            </li>}
          </ul>
        </ScrollArea>
      </div>
    </section>
  );
}
