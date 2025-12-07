import { KernelEvent, KernelEventCategory } from "./traceTypes";

function categorize(name: string): KernelEventCategory {
  const n = name.toLowerCase();
  if (["execve", "execveat", "fork", "vfork", "clone", "clone3", "exit", "setuid", "setgid"].includes(n)) return "process";
  if (["open", "openat", "creat", "rename", "renameat", "unlink", "unlinkat", "read", "write", "close", "chmod", "chown", "stat", "lstat", "fstat"].some(k => n.startsWith(k))) return "file";
  // Network events are filtered out - they return "other" to be hidden
  if (["connect", "accept", "bind", "listen", "send", "sendto", "recv", "recvfrom", "getsockopt", "setsockopt"].some(k => n.startsWith(k))) return "other";
  if (["ptrace", "capset", "capget", "seccomp", "bpf"].some(k => n.startsWith(k))) return "security";
  if (["cgroup", "mount", "umount", "pivot_root"].some(k => n.includes(k))) return "container";
  return "syscall";
}

// Supports Tracee JSON NDJSON (one JSON object per line)
// Gracefully skips invalid lines
export function parseTracee(text: string): KernelEvent[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const raw: any[] = [];
  for (const line of lines) {
    try {
      raw.push(JSON.parse(line));
    } catch {
      // ignore non-JSON lines
    }
  }

  // Extract timestamps and normalize to ms
  const events: KernelEvent[] = raw.map((e) => {
    const name = e.eventName || e.event || e.name || "unknown";
    // Tracee often uses timestamp (ns); try common keys
    const tsCandidate = e.timestamp || e.time || e.ts || e.eventTS || Date.now();
    let tsMs = Number(tsCandidate);
    if (tsMs > 1e13) tsMs = Math.floor(tsMs / 1e6); // ns -> ms
    else if (tsMs > 1e10) tsMs = Math.floor(tsMs / 1e3); // us -> ms

    const pid = e.processId ?? e.pid ?? e.process?.pid;
    const tid = e.threadId ?? e.tid ?? e.process?.tid;
    const comm = e.processName ?? e.comm ?? e.process?.name;
    const host = e.hostName ?? e.host ?? e.node ?? undefined;
    const containerId = e.containerId ?? e.container?.id ?? undefined;
    const containerImage = e.containerImage ?? e.container?.image ?? e.image ?? e.container?.imageName ?? undefined;

    // Args can be array (Tracee) or object; normalize to object
    let args: Record<string, any> | undefined;
    if (Array.isArray(e.args)) {
      args = {};
      for (const a of e.args) {
        if (a && a.name) args[a.name] = a.value;
      }
    } else if (e.args && typeof e.args === 'object') {
      args = e.args;
    }

    return {
      ts: tsMs,
      name: String(name),
      pid: typeof pid === 'number' ? pid : undefined,
      tid: typeof tid === 'number' ? tid : undefined,
      comm: typeof comm === 'string' ? comm : undefined,
      category: categorize(String(name)),
      host,
      containerId,
      containerImage,
      args,
    } as KernelEvent;
  });

  return events.sort((a, b) => a.ts - b.ts);
}

export function parseTraceeLine(line: string): KernelEvent | undefined {
  try {
    const e = JSON.parse(line);
    const name = e.eventName || e.event || e.name || "unknown";
    const tsCandidate = e.timestamp || e.time || e.ts || e.eventTS || Date.now();
    let tsMs = Number(tsCandidate);
    if (tsMs > 1e13) tsMs = Math.floor(tsMs / 1e6); // ns -> ms
    else if (tsMs > 1e10) tsMs = Math.floor(tsMs / 1e3); // us -> ms

    const pid = e.processId ?? e.pid ?? e.process?.pid;
    const tid = e.threadId ?? e.tid ?? e.process?.tid;
    const comm = e.processName ?? e.comm ?? e.process?.name;
    const host = e.hostName ?? e.host ?? e.node ?? undefined;
    const containerId = e.containerId ?? e.container?.id ?? undefined;
    const containerImage = e.containerImage ?? e.container?.image ?? e.image ?? e.container?.imageName ?? undefined;

    let args: Record<string, any> | undefined;
    if (Array.isArray(e.args)) {
      args = {};
      for (const a of e.args) {
        if (a && a.name) args[a.name] = a.value;
      }
    } else if (e.args && typeof e.args === 'object') {
      args = e.args;
    }

    return {
      ts: tsMs,
      name: String(name),
      pid: typeof pid === 'number' ? pid : undefined,
      tid: typeof tid === 'number' ? tid : undefined,
      comm: typeof comm === 'string' ? comm : undefined,
      category: categorize(String(name)),
      host,
      containerId,
      containerImage,
      args,
    } as KernelEvent;
  } catch {
    return undefined;
  }
}
