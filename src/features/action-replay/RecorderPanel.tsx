import React from "react";
import { useRecorder } from "./RecorderContext";
import { Button } from "@/components/ui/button";

export const RecorderPanel: React.FC = () => {
  const { isRecording, start, stop, events } = useRecorder();

  return (
    <aside
      data-recorder-ignore="true"
      aria-label="Action Recorder Panel"
      className="fixed bottom-4 right-4 z-50 w-[280px] rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-lg"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Session Recorder</h2>
          <span className="text-xs text-muted-foreground">{events.length} events</span>
        </div>
        
        <div className="flex justify-center">
          {!isRecording ? (
            <Button size="lg" onClick={start} aria-label="Start recording" className="w-full">
              ⏺ Start Recording
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={stop} aria-label="Stop recording" className="w-full">
              ⏹ Stop Recording
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Records user interactions and saves to logs for Python code generation
        </p>
      </div>
    </aside>
  );
};

export default RecorderPanel;
