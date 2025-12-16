import React from "react";
import KernelTraceViewer from "./KernelTraceViewer";

export const OSRecorderPanel: React.FC = () => {
  return (
    <aside
      aria-label="OS Activity Recorder Panel"
      className="fixed bottom-4 right-4 z-50 w-[320px] rounded-lg border border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-lg"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Linux OS Activity Monitor</h2>
        </div>

        <KernelTraceViewer />
      </div>
    </aside>
  );
};

export default OSRecorderPanel;
