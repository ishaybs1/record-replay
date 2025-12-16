export type KernelEventCategory =
  | "process"
  | "file"
  | "network"
  | "syscall"
  | "security"
  | "container"
  | "other";

export interface KernelEvent {
  ts: number; // epoch ms if available, otherwise relative ms
  name: string;
  pid?: number;
  tid?: number;
  comm?: string;
  category: KernelEventCategory;
  host?: string;
  containerId?: string;
  containerImage?: string;
  args?: Record<string, any>;
}
