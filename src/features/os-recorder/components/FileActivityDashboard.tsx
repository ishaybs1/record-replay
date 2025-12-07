import React from "react";
import { KernelEvent } from "../types/traceTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { File, FileEdit, FolderOpen } from "lucide-react";

interface FileActivity {
  path: string;
  reads: number;
  writes: number;
  opens: number;
  total: number;
  processes: Set<string>;
}

interface FileActivityDashboardProps {
  events: KernelEvent[];
}

function extractFilePath(event: KernelEvent): string | null {
  const args = event.args;
  if (!args) return null;

  // Try to find file path in various argument formats
  if (typeof args === "object") {
    // Common file-related argument names
    const pathKeys = ["pathname", "filename", "path", "fd", "oldpath", "newpath"];
    for (const key of pathKeys) {
      if (key in args && typeof args[key] === "string") {
        return args[key];
      }
    }
  }

  return null;
}

function analyzeFileActivity(events: KernelEvent[]): FileActivity[] {
  const fileMap = new Map<string, FileActivity>();

  const fileEvents = events.filter((e) => e.category === "file");

  fileEvents.forEach((event) => {
    const path = extractFilePath(event);
    if (!path || path === "") return;

    if (!fileMap.has(path)) {
      fileMap.set(path, {
        path,
        reads: 0,
        writes: 0,
        opens: 0,
        total: 0,
        processes: new Set(),
      });
    }

    const activity = fileMap.get(path)!;
    activity.total++;

    const eventName = event.eventName.toLowerCase();
    if (eventName.includes("read")) activity.reads++;
    if (eventName.includes("write")) activity.writes++;
    if (eventName.includes("open")) activity.opens++;

    if (event.processInfo?.comm) {
      activity.processes.add(event.processInfo.comm);
    }
  });

  return Array.from(fileMap.values()).sort((a, b) => b.total - a.total);
}

export const FileActivityDashboard: React.FC<FileActivityDashboardProps> = ({ events }) => {
  const [filter, setFilter] = React.useState("");
  const fileActivities = React.useMemo(() => analyzeFileActivity(events), [events]);

  const filtered = React.useMemo(() => {
    if (!filter) return fileActivities;
    const lower = filter.toLowerCase();
    return fileActivities.filter((f) => f.path.toLowerCase().includes(lower));
  }, [fileActivities, filter]);

  const totalFiles = fileActivities.length;
  const totalOperations = fileActivities.reduce((sum, f) => sum + f.total, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">File Activity</h3>
        <span className="text-xs text-muted-foreground">
          {totalFiles} files, {totalOperations} ops
        </span>
      </div>

      <Input
        placeholder="Filter by file path..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-8 text-xs"
      />

      <ScrollArea className="h-[400px] border rounded-md">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {filter ? "No files match your filter" : "No file events captured yet"}
            </p>
          ) : (
            filtered.slice(0, 100).map((file, idx) => (
              <div
                key={idx}
                className="p-2 border rounded-sm hover:bg-accent cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <File className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono break-all">{file.path}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        <FileEdit className="inline h-3 w-3 mr-1" />
                        {file.writes} writes
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <FolderOpen className="inline h-3 w-3 mr-1" />
                        {file.reads} reads
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {file.opens} opens
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Processes: {Array.from(file.processes).join(", ")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold">{file.total}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileActivityDashboard;
