import React, { useState } from "react";
import { useRecorder } from "./RecorderContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import KernelTraceViewer from "./kernel/KernelTraceViewer";

export const RecorderPanel: React.FC = () => {
  const { isRecording, start, stop, events, replay, exportJSON, exportJS, dryRun, setDryRun, clear } = useRecorder();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside
      data-recorder-ignore="true"
      aria-label="Action Recorder Panel"
      className="fixed bottom-4 right-4 z-50 w-[280px] rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-lg"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Session Recorder</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{events.length} events</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Toggle settings"
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
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

        <KernelTraceViewer />

        {showSettings && (
          <>
            <div className="h-px bg-border my-2" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Dry run</span>
                <Switch checked={dryRun} onCheckedChange={setDryRun} aria-label="Toggle dry run" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => replay()} disabled={!events.length} aria-label="Replay events">
                  ▶ Replay
                </Button>
                <Button size="sm" variant="outline" onClick={exportJSON} disabled={!events.length} aria-label="Download JSON">
                  ⇩ JSON
                </Button>
                <Button size="sm" variant="outline" onClick={exportJS} disabled={!events.length} aria-label="Download JS">
                  ⇩ JS
                </Button>
                <Button size="sm" variant="ghost" onClick={clear} disabled={!events.length} aria-label="Clear events">
                  Clear
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Advanced options for testing and exporting recordings
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default RecorderPanel;
