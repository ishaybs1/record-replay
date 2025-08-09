import React from "react";
import { CoreRecorder } from "./recorder";
import { RecordedEvent, ReplayOptions } from "./types";

interface RecorderContextValue {
  isRecording: boolean;
  events: RecordedEvent[];
  start: () => void;
  stop: () => void;
  clear: () => void;
  addNavigate: (url: string) => void;
  replay: (opts?: ReplayOptions) => Promise<void>;
  exportJSON: () => void;
  exportJS: () => void;
  dryRun: boolean;
  setDryRun: (v: boolean) => void;
}

const RecorderContext = React.createContext<RecorderContextValue | undefined>(undefined);

export const useRecorder = () => {
  const ctx = React.useContext(RecorderContext);
  if (!ctx) throw new Error("useRecorder must be used within RecorderProvider");
  return ctx;
};

function download(filename: string, content: string, type = "application/json") {
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

import { replayEvents } from "./recorder";
import { generateReplayScript } from "./exportScript";

export const RecorderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const recorderRef = React.useRef<CoreRecorder>();
  const [isRecording, setIsRecording] = React.useState(false);
  const [events, setEvents] = React.useState<RecordedEvent[]>([]);
  const [dryRun, setDryRun] = React.useState(true);

  if (!recorderRef.current) recorderRef.current = new CoreRecorder();

  const start = () => {
    setEvents([]);
    recorderRef.current!.start((e) => setEvents((prev) => [...prev, e]));
    setIsRecording(true);
  };

  const stop = () => {
    recorderRef.current!.stop();
    setIsRecording(false);
  };

  const clear = () => setEvents([]);

  const addNavigate = (url: string) => recorderRef.current!.addNavigate(url);

  const replay = async (opts?: ReplayOptions) => {
    await replayEvents(events, { dryRun: opts?.dryRun ?? dryRun, preserveTiming: opts?.preserveTiming ?? true, timeoutMs: opts?.timeoutMs ?? 3000 });
  };

  const exportJSON = () => {
    const payload = { version: 1, createdAt: new Date().toISOString(), events };
    download("replay.json", JSON.stringify(payload, null, 2));
  };

  const exportJS = () => {
    const script = generateReplayScript(events);
    download("replay.js", script, "application/javascript");
  };

  return (
    <RecorderContext.Provider
      value={{ isRecording, events, start, stop, clear, addNavigate, replay, exportJSON, exportJS, dryRun, setDryRun }}
    >
      {children}
    </RecorderContext.Provider>
  );
};
