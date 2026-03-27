"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  calculateDateRange,
  getDayColumns,
  getTaskPosition,
  phaseColors,
  phaseLabels,
} from "@/lib/utils/gantt";
import type { VideoWithTasks, TaskWithAssignee } from "@/lib/supabase/types";

const DAY_WIDTH = 40;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 48;
const VIDEO_HEADER_HEIGHT = 32;

interface GanttViewProps {
  videos: VideoWithTasks[];
  onTaskClick?: (task: TaskWithAssignee) => void;
}

export function GanttView({ videos, onTaskClick }: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const allTasks = useMemo(
    () => videos.flatMap((v) => v.tasks),
    [videos]
  );

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => calculateDateRange(allTasks),
    [allTasks]
  );

  const days = useMemo(
    () => getDayColumns(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );

  const totalWidth = days.length * DAY_WIDTH;

  let totalRows = 0;
  videos.forEach((v) => {
    totalRows++;
    totalRows += v.tasks.length;
  });

  const todayIndex = days.findIndex((d) => d.isToday);

  return (
    <div className="flex border border-border rounded-lg overflow-hidden bg-card">
      {/* Left panel: labels */}
      <div className="w-60 shrink-0 border-r border-border">
        <div
          className="border-b border-border px-3 flex items-center text-xs text-muted-foreground font-medium"
          style={{ height: HEADER_HEIGHT }}
        >
          planning
        </div>
        {videos.map((video) => (
          <div key={video.id}>
            <div
              className="px-3 flex items-center text-xs font-semibold text-foreground bg-secondary/50 border-b border-border"
              style={{ height: VIDEO_HEADER_HEIGHT }}
            >
              {video.name}
            </div>
            {video.tasks.map((task) => (
              <div
                key={task.id}
                className="px-3 pl-6 flex items-center text-xs text-muted-foreground border-b border-border truncate cursor-pointer hover:text-foreground transition-colors"
                style={{ height: ROW_HEIGHT }}
                onClick={() => onTaskClick?.(task)}
              >
                <span className="truncate">{task.name}</span>
                {task.version_label && (
                  <span className="ml-1.5 text-[10px] font-mono text-muted-foreground/70">
                    {task.version_label}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Right panel: timeline */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto">
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          <div
            className="flex border-b border-border relative"
            style={{ height: HEADER_HEIGHT }}
          >
            {days.map((day) => (
              <div
                key={day.dateStr}
                className={cn(
                  "shrink-0 flex flex-col items-center justify-center text-[10px] border-r border-border",
                  day.isWeekend && "bg-secondary/30",
                  day.isToday && "bg-accent-yellow/10"
                )}
                style={{ width: DAY_WIDTH }}
              >
                <span className="text-muted-foreground">
                  {day.date.toLocaleDateString("nl-NL", { weekday: "narrow" })}
                </span>
                <span
                  className={cn(
                    "font-mono",
                    day.isToday ? "text-accent-yellow font-bold" : "text-foreground"
                  )}
                >
                  {day.date.getDate()}
                </span>
              </div>
            ))}
          </div>

          {videos.map((video) => (
            <div key={video.id}>
              <div
                className="bg-secondary/30 border-b border-border"
                style={{ height: VIDEO_HEADER_HEIGHT }}
              />
              {video.tasks.map((task) => {
                const pos = getTaskPosition(task, rangeStart, DAY_WIDTH);
                return (
                  <div
                    key={task.id}
                    className="relative border-b border-border"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {days.map(
                      (day) =>
                        day.isWeekend && (
                          <div
                            key={day.dateStr}
                            className="absolute top-0 bottom-0 bg-secondary/20"
                            style={{
                              left: days.indexOf(day) * DAY_WIDTH,
                              width: DAY_WIDTH,
                            }}
                          />
                        )
                    )}
                    {pos && (
                      <button
                        className="absolute top-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          left: pos.left,
                          width: pos.width,
                          height: ROW_HEIGHT - 12,
                          backgroundColor: phaseColors[task.phase] ?? "#525252",
                          opacity: task.status === "done" ? 0.4 : 0.85,
                        }}
                        onClick={() => onTaskClick?.(task)}
                        title={`${task.name} · ${phaseLabels[task.phase]} · ${task.start_date} → ${task.end_date}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {todayIndex >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-accent-yellow/60 z-10 pointer-events-none"
              style={{
                left: 240 + todayIndex * DAY_WIDTH + DAY_WIDTH / 2,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
