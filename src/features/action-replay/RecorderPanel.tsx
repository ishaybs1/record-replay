import React from "react";
import { useRecorder } from "./RecorderContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import KernelTraceViewer from "./kernel/KernelTraceViewer";

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <span>{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export const RecorderPanel: React.FC = () => {
  const { isRecording, start, stop, events, replay, exportJSON, exportJS, dryRun, setDryRun, clear } = useRecorder();

  return (
    <aside
      data-recorder-ignore="true"
      aria-label="Action Recorder Panel"
      className="fixed bottom-4 right-4 z-50 w-[320px] rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-lg"
    >
      <header className="px-4 py-2 border-b border-border">
        <h2 className="text-sm font-semibold">Action Recorder</h2>
      </header>
      <div className="p-4 space-y-3">
        <Stat label="Events" value={events.length} />
        <div className="flex items-center justify-between">
          <span className="text-sm">Dry run</span>
          <Switch checked={dryRun} onCheckedChange={setDryRun} aria-label="Toggle dry run" />
        </div>
        <div className="flex flex-wrap gap-2">
          {!isRecording ? (
            <Button size="sm" onClick={start} aria-label="Start recording">⏺ Start</Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={stop} aria-label="Stop recording">⏹ Stop</Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => replay()} disabled={!events.length} aria-label="Replay events">▶ Replay</Button>
          <Button size="sm" variant="outline" onClick={exportJSON} disabled={!events.length} aria-label="Download JSON">⇩ JSON</Button>
          <Button size="sm" variant="outline" onClick={exportJS} disabled={!events.length} aria-label="Download JS">⇩ JS</Button>
          <Button size="sm" variant="ghost" onClick={clear} disabled={!events.length} aria-label="Clear events">Clear</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The recorder captures clicks, inputs, navigation, and API calls. Use dry run to safely test.
        </p>
        <div className="h-px bg-border my-2" />
        <KernelTraceViewer />
      </div>
    </aside>
  );
};

export default RecorderPanel;
