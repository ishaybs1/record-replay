export type KernelEventCategory =
  | "process"
  | "file"
  | "network"
  | "syscall"
  | "security"
  | "container"
  | "other";

export interface ProcessInfo {
  pid?: number;
  ppid?: number;
  tid?: number;
  comm?: string;
}

export interface ContainerInfo {
  containerId?: string;
  containerImage?: string;
}

export interface HostInfo {
  hostname?: string;
}

export interface KernelEvent {
  timestamp: number; // epoch ms if available, otherwise relative ms
  ts?: number; // alias for timestamp (backward compat)
  eventName: string;
  name?: string; // alias for eventName (backward compat)
  processInfo?: ProcessInfo;
  containerInfo?: ContainerInfo;
  hostInfo?: HostInfo;
  category: KernelEventCategory;
  // Legacy fields for backward compatibility
  pid?: number;
  tid?: number;
  comm?: string;
  host?: string;
  containerId?: string;
  containerImage?: string;
  args?: Record<string, any>;
}
