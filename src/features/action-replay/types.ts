export type EventType = "click" | "input" | "navigate" | "api";

export type RecordedEvent = {
  type: EventType;
  timestamp: number; // ms since recording start
  selector?: string; // For DOM events
  value?: string; // For inputs
  url?: string; // For navigation/api
  method?: string; // For api
  status?: number; // For api
  requestBodySnippet?: string; // For api
  meta?: Record<string, any>;
};

export type ReplayOptions = {
  dryRun?: boolean;
  preserveTiming?: boolean; // if false, small fixed delay between steps
  timeoutMs?: number; // selector wait timeout
};

export type RecorderControls = {
  start: () => void;
  stop: () => void;
};
