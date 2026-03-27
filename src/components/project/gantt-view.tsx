"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  calculateDateRange,
  getDayColumns,
  getTaskPosition,
  phaseColors,
  phaseLabels,
} from "@/lib/utils/gantt";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { VideoWithTasks, TaskWithAssignee, Profile, Project } from "@/lib/supabase/types";

const DAY_WIDTH = 48;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 52;
const VIDEO_HEADER_HEIGHT = 36;
const LEFT_PANEL_WIDTH = 300;

interface GanttViewProps {
  videos: VideoWithTasks[];
  project?: Project;
  members?: Profile[];
  onTaskClick?: (task: TaskWithAssignee) => void;
  filterPerson?: string[];
  filterPhase?: string[];
  filterStatus?: string[];
  filterSearch?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatHours(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export function GanttView({
  videos,
  project,
  members,
  onTaskClick,
  filterPerson,
  filterPhase,
  filterStatus,
  filterSearch,
}: GanttViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Drag state
  const [dragState, setDragState] = useState<{
    taskId: string;
    mode: "move" | "resize";
    startX: number;
    origLeft: number;
    origWidth: number;
    origStartDate: string;
    origEndDate: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ left: number; width: number } | null>(null);

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
  const todayIndex = days.findIndex((d) => d.isToday);

  // Filter logic
  const isTaskVisible = useCallback(
    (task: TaskWithAssignee): boolean => {
      if (filterPerson?.length && !filterPerson.includes(task.assigned_to ?? "")) return false;
      if (filterPhase?.length && !filterPhase.includes(task.phase)) return false;
      if (filterStatus?.length && !filterStatus.includes(task.status)) return false;
      if (filterSearch && !task.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    },
    [filterPerson, filterPhase, filterStatus, filterSearch]
  );

  // Filtered videos (hide videos with no visible tasks)
  const filteredVideos = useMemo(() => {
    const hasFilters = (filterPerson?.length ?? 0) > 0 || (filterPhase?.length ?? 0) > 0 || (filterStatus?.length ?? 0) > 0 || (filterSearch?.length ?? 0) > 0;
    if (!hasFilters) return videos;
    return videos
      .map((v) => ({ ...v, tasks: v.tasks.filter(isTaskVisible) }))
      .filter((v) => v.tasks.length > 0);
  }, [videos, isTaskVisible, filterPerson, filterPhase, filterStatus, filterSearch]);

  // Project summary stats
  const totalBudgetHours = useMemo(() => allTasks.reduce((s, t) => s + (t.budgeted_hours ?? 0), 0), [allTasks]);
  const totalLoggedHours = useMemo(() => allTasks.reduce((s, t) => s + (t.logged_hours ?? 0), 0), [allTasks]);
  const progressPct = totalBudgetHours > 0 ? Math.round((totalLoggedHours / totalBudgetHours) * 100) : 0;

  // Sync vertical scroll between left panel and timeline
  const handleTimelineScroll = useCallback(() => {
    if (scrollContainerRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = scrollContainerRef.current.scrollTop;
    }
  }, []);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent, task: TaskWithAssignee, mode: "move" | "resize") => {
      e.preventDefault();
      e.stopPropagation();
      const pos = getTaskPosition(task, rangeStart, DAY_WIDTH);
      if (!pos || !task.start_date || !task.end_date) return;
      setDragState({
        taskId: task.id,
        mode,
        startX: e.clientX,
        origLeft: pos.left,
        origWidth: pos.width,
        origStartDate: task.start_date,
        origEndDate: task.end_date,
      });
      setDragOffset({ left: pos.left, width: pos.width });

      const handleMouseMove = (me: MouseEvent) => {
        const dx = me.clientX - e.clientX;
        if (mode === "move") {
          setDragOffset({ left: pos.left + dx, width: pos.width });
        } else {
          setDragOffset({ left: pos.left, width: Math.max(pos.width + dx, DAY_WIDTH) });
        }
      };

      const handleMouseUp = async (me: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        const dx = me.clientX - e.clientX;
        const daysDelta = Math.round(dx / DAY_WIDTH);
        if (daysDelta === 0) {
          setDragState(null);
          setDragOffset(null);
          return;
        }

        const origStart = new Date(task.start_date!);
        const origEnd = new Date(task.end_date!);
        let newStart: Date, newEnd: Date;

        if (mode === "move") {
          newStart = new Date(origStart);
          newStart.setDate(newStart.getDate() + daysDelta);
          newEnd = new Date(origEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);
        } else {
          newStart = origStart;
          newEnd = new Date(origEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);
          if (newEnd < newStart) newEnd = new Date(newStart);
        }

        const fmt = (d: Date) => d.toISOString().split("T")[0];
        await supabase
          .from("tasks")
          .update({ start_date: fmt(newStart), end_date: fmt(newEnd) })
          .eq("id", task.id);

        queryClient.invalidateQueries({ queryKey: ["project-detail"] });
        setDragState(null);
        setDragOffset(null);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [rangeStart, supabase, queryClient]
  );

  return (
    <div className="flex flex-col">
      {/* Project summary bar */}
      {project && (
        <div className="flex items-center gap-6 mb-4 p-4 bg-card border border-border rounded-lg">
          <div>
            <span className="text-xs text-muted-foreground">budget</span>
            <p className="text-sm font-mono font-semibold">
              {formatHours(totalLoggedHours)}u / {formatHours(totalBudgetHours)}u
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">voortgang</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    progressPct > 95 ? "bg-danger" : progressPct > 80 ? "bg-warning" : "bg-accent-teal"
                  )}
                  style={{ width: `${Math.min(progressPct, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono">{progressPct}%</span>
            </div>
          </div>
          {project.start_date && project.end_date && (
            <div>
              <span className="text-xs text-muted-foreground">periode</span>
              <p className="text-sm font-mono">
                {new Date(project.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                {" — "}
                {new Date(project.end_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
              </p>
            </div>
          )}
          {members && members.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">team</span>
              <div className="flex -space-x-2 mt-0.5">
                {members.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-foreground"
                    title={m.name}
                  >
                    {getInitials(m.name)}
                  </div>
                ))}
                {members.length > 6 && (
                  <div className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                    +{members.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gantt chart */}
      <div className="flex border border-border rounded-lg overflow-hidden bg-card" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {/* Left panel: labels */}
        <div className="shrink-0 border-r border-border flex flex-col" style={{ width: LEFT_PANEL_WIDTH }}>
          {/* Sticky header */}
          <div
            className="border-b border-border px-3 flex items-center text-xs text-muted-foreground font-medium shrink-0"
            style={{ height: HEADER_HEIGHT }}
          >
            <span className="w-1/2">taak</span>
            <span className="w-1/4 text-right">eigenaar</span>
            <span className="w-1/4 text-right">uren</span>
          </div>
          {/* Scrollable rows */}
          <div ref={leftPanelRef} className="overflow-hidden flex-1">
            {filteredVideos.map((video) => (
              <div key={video.id}>
                <div
                  className="px-3 flex items-center text-xs font-semibold text-foreground bg-secondary/50 border-b border-border"
                  style={{ height: VIDEO_HEADER_HEIGHT }}
                >
                  <span className="truncate flex-1">{video.name}</span>
                  {video.budget_hours && (
                    <span className="text-[10px] font-mono text-muted-foreground ml-2">
                      {formatHours(video.budget_hours)}u
                    </span>
                  )}
                </div>
                {video.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-3 flex items-center text-xs border-b border-border cursor-pointer hover:bg-secondary/30 transition-colors"
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="flex items-center gap-1.5 w-1/2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: phaseColors[task.phase] ?? "#525252" }}
                      />
                      <span className="truncate text-muted-foreground hover:text-foreground">{task.name}</span>
                      {task.version_label && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                          {task.version_label}
                        </span>
                      )}
                    </div>
                    <div className="w-1/4 flex justify-end">
                      {task.assigned_profile ? (
                        <div
                          className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-foreground"
                          title={task.assigned_profile.name}
                        >
                          {getInitials(task.assigned_profile.name)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </div>
                    <div className="w-1/4 text-right font-mono text-[11px]">
                      {(task.logged_hours ?? 0) > 0 || (task.budgeted_hours ?? 0) > 0 ? (
                        <span className={cn(
                          (task.logged_hours ?? 0) > (task.budgeted_hours ?? 0) && (task.budgeted_hours ?? 0) > 0
                            ? "text-danger"
                            : "text-muted-foreground"
                        )}>
                          {formatHours(task.logged_hours ?? 0)}/{formatHours(task.budgeted_hours ?? 0)}u
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: timeline */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          onScroll={handleTimelineScroll}
        >
          <div style={{ width: totalWidth, minWidth: "100%" }} className="relative">
            {/* Date header */}
            <div
              className="flex border-b border-border sticky top-0 z-20 bg-card"
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

            {/* Task rows */}
            {filteredVideos.map((video) => (
              <div key={video.id}>
                {/* Video header row */}
                <div
                  className="bg-secondary/30 border-b border-border"
                  style={{ height: VIDEO_HEADER_HEIGHT }}
                />
                {video.tasks.map((task) => {
                  const isDragging = dragState?.taskId === task.id;
                  const pos = isDragging && dragOffset
                    ? dragOffset
                    : getTaskPosition(task, rangeStart, DAY_WIDTH);

                  return (
                    <div
                      key={task.id}
                      className="relative border-b border-border"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* Weekend backgrounds */}
                      {days.map((day, idx) =>
                        day.isWeekend ? (
                          <div
                            key={day.dateStr}
                            className="absolute top-0 bottom-0 bg-secondary/20"
                            style={{ left: idx * DAY_WIDTH, width: DAY_WIDTH }}
                          />
                        ) : null
                      )}
                      {/* Task bar */}
                      {pos && (
                        <div
                          className={cn(
                            "absolute top-1.5 rounded flex items-center gap-1 px-1.5 cursor-grab select-none",
                            isDragging && "opacity-70 z-30",
                            task.status === "done" && "opacity-50"
                          )}
                          style={{
                            left: pos.left,
                            width: pos.width,
                            height: ROW_HEIGHT - 12,
                            backgroundColor: phaseColors[task.phase] ?? "#525252",
                          }}
                          onMouseDown={(e) => handleDragStart(e, task, "move")}
                          onClick={(e) => {
                            if (!dragState) {
                              e.stopPropagation();
                              onTaskClick?.(task);
                            }
                          }}
                          title={`${task.name} · ${phaseLabels[task.phase]} · ${task.assigned_profile?.name ?? "niet toegewezen"}`}
                        >
                          {/* Assignee initials */}
                          {task.assigned_profile && pos.width > 60 && (
                            <span className="text-[9px] font-bold text-white/80 shrink-0">
                              {getInitials(task.assigned_profile.name)}
                            </span>
                          )}
                          {/* Hours label */}
                          {pos.width > 40 && (task.budgeted_hours ?? 0) > 0 && (
                            <span className="text-[10px] font-mono text-white/90 truncate">
                              {formatHours(task.logged_hours ?? 0)}/{formatHours(task.budgeted_hours ?? 0)}
                            </span>
                          )}
                          {/* Resize handle */}
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleDragStart(e, task, "resize");
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Today line */}
            {todayIndex >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent-yellow/60 z-10 pointer-events-none"
                style={{ left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
