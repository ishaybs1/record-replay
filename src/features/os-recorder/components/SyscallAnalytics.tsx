import React from "react";
import { KernelEvent, KernelEventCategory } from "../types/traceTypes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SyscallAnalyticsProps {
  events: KernelEvent[];
}

interface CategoryStats {
  category: KernelEventCategory;
  count: number;
  percentage: number;
}

interface ProcessStats {
  comm: string;
  pid: number;
  count: number;
}

interface SyscallStats {
  name: string;
  count: number;
}

const CATEGORY_COLORS: Record<KernelEventCategory, string> = {
  process: "#10b981",
  file: "#3b82f6",
  network: "#8b5cf6",
  security: "#ef4444",
  container: "#f59e0b",
  syscall: "#6366f1",
  other: "#64748b",
};

function analyzeSyscalls(events: KernelEvent[]) {
  const categoryMap = new Map<KernelEventCategory, number>();
  const processMap = new Map<string, ProcessStats>();
  const syscallMap = new Map<string, number>();

  events.forEach((event) => {
    // Category stats
    const catCount = categoryMap.get(event.category) || 0;
    categoryMap.set(event.category, catCount + 1);

    // Process stats
    if (event.processInfo?.comm && event.processInfo?.pid) {
      const key = `${event.processInfo.comm}-${event.processInfo.pid}`;
      if (!processMap.has(key)) {
        processMap.set(key, {
          comm: event.processInfo.comm,
          pid: event.processInfo.pid,
          count: 0,
        });
      }
      processMap.get(key)!.count++;
    }

    // Syscall stats
    const syscallCount = syscallMap.get(event.eventName) || 0;
    syscallMap.set(event.eventName, syscallCount + 1);
  });

  const total = events.length;
  const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(
    ([category, count]) => ({
      category,
      count,
      percentage: (count / total) * 100,
    })
  );

  const processStats: ProcessStats[] = Array.from(processMap.values()).sort(
    (a, b) => b.count - a.count
  );

  const syscallStats: SyscallStats[] = Array.from(syscallMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { categoryStats, processStats, syscallStats, total };
}

export const SyscallAnalytics: React.FC<SyscallAnalyticsProps> = ({ events }) => {
  const { categoryStats, processStats, syscallStats, total } = React.useMemo(
    () => analyzeSyscalls(events),
    [events]
  );

  const duration = React.useMemo(() => {
    if (events.length < 2) return 0;
    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;
    return last - first;
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-md p-3">
          <p className="text-xs text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="border rounded-md p-3">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-2xl font-bold">{(duration / 1000).toFixed(1)}s</p>
        </div>
        <div className="border rounded-md p-3">
          <p className="text-xs text-muted-foreground">Processes</p>
          <p className="text-2xl font-bold">{processStats.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Category Distribution</h3>
        <div className="border rounded-md p-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryStats}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ category, percentage }) =>
                  `${category}: ${percentage.toFixed(1)}%`
                }
              >
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Top Processes by Syscall Count</h3>
        <div className="border rounded-md p-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={processStats.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="comm" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Top Syscalls</h3>
        <ScrollArea className="h-[200px] border rounded-md">
          <div className="p-2 space-y-1">
            {syscallStats.slice(0, 20).map((syscall, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 border rounded-sm hover:bg-accent"
              >
                <span className="text-xs font-mono">{syscall.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(syscall.count / syscallStats[0].count) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">
                    {syscall.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default SyscallAnalytics;
