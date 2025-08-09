import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { parseTracee } from "./traceeParser";
import { KernelEvent, KernelEventCategory } from "./traceTypes";

const categories: KernelEventCategory[] = ["process", "file", "network", "security", "container", "syscall", "other"];

export default function KernelTraceViewer() {
  const [events, setEvents] = React.useState<KernelEvent[]>([]);
  const [filters, setFilters] = React.useState<Record<KernelEventCategory, boolean>>({
    process: true, file: true, network: true, security: true, container: true, syscall: true, other: true,
  });

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

  const filtered = events.filter((e) => filters[e.category]);

  const from = events[0]?.ts;
  const to = events[events.length - 1]?.ts;
  const duration = from && to ? Math.max(0, to - from) : 0;

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "kernel-trace.json"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <section aria-label="Kernel Traces Import" className="space-y-3" data-recorder-ignore="true">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Kernel Traces (Import)</h3>
        <div className="flex items-center gap-2">
          <input aria-label="Upload Tracee JSON/NDJSON" type="file" accept=".json,.ndjson,.log,.txt" onChange={onInput} className="text-xs" />
          <Button size="sm" variant="outline" onClick={downloadJSON} disabled={!filtered.length}>Export JSON</Button>
        </div>
      </header>
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
                  <div className="text-muted-foreground">{e.comm ?? ""} #{e.pid ?? "-"}</div>
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
            {!filtered.length && <li className="px-3 py-6 text-center text-muted-foreground">Upload Tracee NDJSON to view events</li>}
          </ul>
        </ScrollArea>
      </div>
    </section>
  );
}
