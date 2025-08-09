import { RecordedEvent } from "./types";

const isElement = (node: EventTarget | null): node is Element => !!node && (node as Element).nodeType === 1;

// Build a reasonably stable CSS selector
export function cssPath(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1 && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.classList.length && current.classList.length <= 3) {
      selector +=
        "." + Array.from(current.classList)
          .slice(0, 3)
          .map((c) => CSS.escape(c))
          .join(".");
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.length ? parts.join(" > ") : el.tagName.toLowerCase();
}

export class CoreRecorder {
  private events: RecordedEvent[] = [];
  private startedAt = 0;
  private recording = false;
  private onEvent?: (e: RecordedEvent) => void;
  private originalFetch?: typeof window.fetch;

  getEvents() { return this.events; }
  isRecording() { return this.recording; }

  start(onEvent: (e: RecordedEvent) => void) {
    if (this.recording) return;
    this.events = [];
    this.startedAt = Date.now();
    this.onEvent = onEvent;
    this.recording = true;

    document.addEventListener("click", this.onClick, true);
    document.addEventListener("input", this.onInput, true);
    document.addEventListener("change", this.onInput, true);

    // Patch fetch
    this.originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const start = Date.now();
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const url = input instanceof Request ? input.url : input.toString();

      try {
        const res = await this.originalFetch!(input as any, init);
        const status = (res as Response).status;
        this.push({
          type: "api",
          url,
          method,
          status,
          timestamp: start - this.startedAt,
        });
        return res;
      } catch (err) {
        this.push({
          type: "api",
          url,
          method,
          status: -1,
          timestamp: start - this.startedAt,
          meta: { error: String(err) },
        });
        throw err;
      }
    };
  }

  stop() {
    if (!this.recording) return;
    this.recording = false;
    document.removeEventListener("click", this.onClick, true);
    document.removeEventListener("input", this.onInput, true);
    document.removeEventListener("change", this.onInput, true);
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = undefined;
    }
  }

  addNavigate(url: string) {
    if (!this.recording) return;
    this.push({ type: "navigate", url, timestamp: Date.now() - this.startedAt });
  }

  private push(e: RecordedEvent) {
    this.events.push(e);
    this.onEvent?.(e);
  }

  private onClick = (event: Event) => {
    if (!this.recording) return;
    const target = event.target;
    if (!isElement(target)) return;
    if ((target as Element).closest('[data-recorder-ignore="true"]')) return;
    const selector = cssPath(target as Element);
    this.push({ type: "click", selector, timestamp: Date.now() - this.startedAt });
  };

  private onInput = (event: Event) => {
    if (!this.recording) return;
    const target = event.target;
    if (!isElement(target)) return;
    if ((target as Element).closest('[data-recorder-ignore="true"]')) return;
    const el = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") {
      const selector = cssPath(el);
      this.push({ type: "input", selector, value: (el as any).value ?? "", timestamp: Date.now() - this.startedAt });
    }
  };
}

export async function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function findWithRetry(selector: string, timeoutMs = 3000, step = 100): Promise<Element | null> {
  const start = Date.now();
  let el: Element | null = null;
  while (Date.now() - start < timeoutMs) {
    el = document.querySelector(selector);
    if (el) return el;
    await wait(step);
  }
  return null;
}

export async function replayEvents(events: RecordedEvent[], opts: { dryRun?: boolean; preserveTiming?: boolean; timeoutMs?: number } = {}) {
  const preserveTiming = opts.preserveTiming ?? true;
  const timeoutMs = opts.timeoutMs ?? 3000;
  let lastTs = 0;

  for (const e of events) {
    const delta = e.timestamp - lastTs;
    lastTs = e.timestamp;
    if (preserveTiming && delta > 0) await wait(delta);
    else await wait(150);

    if (e.type === "click" && e.selector) {
      const el = await findWithRetry(e.selector, timeoutMs);
      if (!el) continue;
      if (opts.dryRun) {
        el.classList.add("ring", "ring-primary", "ring-offset-2");
        setTimeout(() => el.classList.remove("ring", "ring-primary", "ring-offset-2"), 500);
        continue;
      }
      (el as HTMLElement).click();
    }

    if (e.type === "input" && e.selector) {
      const el = await findWithRetry(e.selector, timeoutMs);
      if (!el) continue;
      if (opts.dryRun) {
        el.classList.add("ring", "ring-primary", "ring-offset-2");
        setTimeout(() => el.classList.remove("ring", "ring-primary", "ring-offset-2"), 500);
        continue;
      }
      const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      (input as any).value = e.value ?? "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (e.type === "navigate" && e.url) {
      if (opts.dryRun) continue;
      window.history.pushState({}, "", e.url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    if (e.type === "api") {
      // We do not re-fire APIs in replay to avoid side effects; could be enhanced later.
      // In non-dry-run we simply skip, but we keep timing.
      continue;
    }
  }
}
