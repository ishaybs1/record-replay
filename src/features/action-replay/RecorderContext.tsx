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

async function saveToLogs(events: RecordedEvent[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logData = {
    timestamp,
    events,
    totalEvents: events.length,
    duration: events.length > 0 ? events[events.length - 1].timestamp : 0
  };
  
  try {
    // In a real app, you'd save to filesystem or send to backend
    // For now, we'll download the file and log the data
    const filename = `logs/session-${timestamp}.json`;
    const content = JSON.stringify(logData, null, 2);
    
    console.log(`Recording saved to ${filename}:`, logData);
    
    // Auto-download the log file
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Generate ChatGPT prompt
    const prompt = generateChatGPTPrompt(logData);
    console.log("Send this to ChatGPT:", prompt);
    
    return { filename, content, prompt };
  } catch (error) {
    console.error('Failed to save recording:', error);
    throw error;
  }
}

function generateChatGPTPrompt(logData: any) {
  return `Please analyze this user session recording and generate Python code using Selenium or Playwright to replicate these actions:

Session Data:
- Duration: ${logData.duration}ms
- Total Events: ${logData.totalEvents}
- Timestamp: ${logData.timestamp}

Events:
${JSON.stringify(logData.events, null, 2)}

Please provide Python code that:
1. Sets up a browser automation framework (Selenium or Playwright)
2. Replicates each recorded action (clicks, inputs, navigation)
3. Includes appropriate waits and error handling
4. Is ready to run with minimal setup

Focus on the main user interactions and ignore minor mouse movements.`;
}

import { replayEvents } from "./recorder";
import { generateReplayScript } from "./exportScript";

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

export const RecorderProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const recorderRef = React.useRef<CoreRecorder>();
  const [isRecording, setIsRecording] = React.useState(false);
  const [events, setEvents] = React.useState<RecordedEvent[]>([]);
  const [dryRun, setDryRun] = React.useState(true);

  if (!recorderRef.current) recorderRef.current = new CoreRecorder();

  const start = () => {
    // Browser recording disabled - only system operations are shown
    console.log("Browser recording is disabled. Use System Operations section for kernel traces.");
  };

  const stop = async () => {
    recorderRef.current!.stop();
    setIsRecording(false);
    
    if (events.length > 0) {
      try {
        const result = await saveToLogs(events);
        console.log("Session recorded successfully:", result.filename);
        console.log("Copy this prompt to ChatGPT:");
        console.log("=" + "=".repeat(50));
        console.log(result.prompt);
        console.log("=" + "=".repeat(50));
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    }
  };

  const clear = () => setEvents([]);

  const addNavigate = (url: string) => {
    // Navigation tracking disabled - no browser events recorded
  };

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
