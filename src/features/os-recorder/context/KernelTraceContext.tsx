import React from "react";
import { KernelEvent } from "../types/traceTypes";

interface KernelTraceContextValue {
  events: KernelEvent[];
  addEvent: (event: KernelEvent) => void;
  addEvents: (events: KernelEvent[]) => void;
  clear: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
}

const KernelTraceContext = React.createContext<KernelTraceContextValue | undefined>(undefined);

export const useKernelTrace = () => {
  const ctx = React.useContext(KernelTraceContext);
  if (!ctx) throw new Error("useKernelTrace must be used within KernelTraceProvider");
  return ctx;
};

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(events: KernelEvent[]): string {
  if (events.length === 0) return "";

  const headers = ["Timestamp", "Event", "PID", "TID", "Command", "Category", "Container ID", "Container Image", "Host", "Arguments"];
  const rows = events.map(e => [
    e.timestamp,
    e.eventName,
    e.processInfo?.pid ?? "",
    e.processInfo?.tid ?? "",
    e.processInfo?.comm ?? "",
    e.category,
    e.containerInfo?.containerId ?? "",
    e.containerInfo?.containerImage ?? "",
    e.hostInfo?.hostname ?? "",
    JSON.stringify(e.args || {})
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return csvContent;
}

export const KernelTraceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [events, setEvents] = React.useState<KernelEvent[]>([]);

  const addEvent = (event: KernelEvent) => {
    setEvents(prev => [...prev, event]);
  };

  const addEvents = (newEvents: KernelEvent[]) => {
    setEvents(prev => [...prev, ...newEvents]);
  };

  const clear = () => setEvents([]);

  const exportJSON = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      totalEvents: events.length,
      events
    };
    downloadFile(`kernel-trace-${timestamp}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCSV = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvContent = convertToCSV(events);
    downloadFile(`kernel-trace-${timestamp}.csv`, csvContent, "text/csv");
  };

  return (
    <KernelTraceContext.Provider
      value={{ events, addEvent, addEvents, clear, exportJSON, exportCSV }}
    >
      {children}
    </KernelTraceContext.Provider>
  );
};
