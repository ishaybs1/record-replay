import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { KernelEvent } from "../types/traceTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface ProcessNode {
  pid: number;
  ppid?: number;
  comm: string;
  children: ProcessNode[];
  eventCount: number;
  events: KernelEvent[];
}

interface ProcessTreeViewProps {
  events: KernelEvent[];
}

function buildProcessTree(events: KernelEvent[]): ProcessNode[] {
  const processMap = new Map<number, ProcessNode>();
  const roots: ProcessNode[] = [];

  // Build process map
  events.forEach((event) => {
    const pid = event.processInfo?.pid;
    const ppid = event.processInfo?.ppid;
    const comm = event.processInfo?.comm || "unknown";

    if (pid === undefined) return;

    if (!processMap.has(pid)) {
      processMap.set(pid, {
        pid,
        ppid,
        comm,
        children: [],
        eventCount: 0,
        events: [],
      });
    }

    const node = processMap.get(pid)!;
    node.eventCount++;
    node.events.push(event);

    // Update comm if it was unknown
    if (node.comm === "unknown" && comm !== "unknown") {
      node.comm = comm;
    }
  });

  // Build tree structure
  processMap.forEach((node) => {
    if (node.ppid !== undefined && processMap.has(node.ppid)) {
      const parent = processMap.get(node.ppid)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => b.eventCount - a.eventCount);
}

const ProcessTreeNode: React.FC<{
  node: ProcessNode;
  depth: number;
}> = ({ node, depth }) => {
  const [expanded, setExpanded] = React.useState(depth < 2);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded-sm cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children.length > 0 ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        <span className="text-xs font-mono text-muted-foreground">
          {node.pid}
        </span>
        <span className="text-xs font-semibold flex-1">{node.comm}</span>
        <span className="text-xs text-muted-foreground">
          {node.eventCount} events
        </span>
      </div>
      {expanded &&
        node.children
          .sort((a, b) => b.eventCount - a.eventCount)
          .map((child) => (
            <ProcessTreeNode key={child.pid} node={child} depth={depth + 1} />
          ))}
    </div>
  );
};

export const ProcessTreeView: React.FC<ProcessTreeViewProps> = ({ events }) => {
  const tree = React.useMemo(() => buildProcessTree(events), [events]);
  const totalProcesses = React.useMemo(() => {
    const uniquePids = new Set(events.map((e) => e.processInfo?.pid).filter((p) => p !== undefined));
    return uniquePids.size;
  }, [events]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Process Tree</h3>
        <span className="text-xs text-muted-foreground">
          {totalProcesses} processes
        </span>
      </div>
      <ScrollArea className="h-[400px] border rounded-md">
        <div className="p-2">
          {tree.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No process events captured yet
            </p>
          ) : (
            tree.map((node) => (
              <ProcessTreeNode key={node.pid} node={node} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProcessTreeView;
