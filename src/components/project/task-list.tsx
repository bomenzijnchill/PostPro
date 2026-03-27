"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { phaseColors, phaseLabels, statusLabels } from "@/lib/utils/gantt";
import type { VideoWithTasks, TaskWithAssignee } from "@/lib/supabase/types";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";

interface TaskListProps {
  videos: VideoWithTasks[];
  onTaskClick?: (task: TaskWithAssignee) => void;
}

const statusOrder = ["in_progress", "todo", "review", "blocked", "done"];

export function TaskList({ videos, onTaskClick }: TaskListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleVideo = (videoId: string) => {
    setCollapsed((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <div key={video.id} className="border border-border rounded-lg overflow-hidden">
          {/* Video header */}
          <button
            onClick={() => toggleVideo(video.id)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-secondary/50 transition-colors text-left"
          >
            {collapsed[video.id] ? (
              <ChevronRight size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
            <span className="font-semibold text-sm">{video.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {video.tasks.length} taken
            </span>
          </button>

          {/* Tasks */}
          {!collapsed[video.id] && (
            <div className="divide-y divide-border">
              {video.tasks
                .sort(
                  (a, b) =>
                    statusOrder.indexOf(a.status) -
                    statusOrder.indexOf(b.status)
                )
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 cursor-pointer transition-colors"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* Status dot */}
                    <button
                      className={cn(
                        "w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                        task.status === "done"
                          ? "bg-success border-success"
                          : task.status === "in_progress"
                          ? "border-accent-yellow bg-accent-yellow/20"
                          : task.status === "blocked"
                          ? "border-danger bg-danger/20"
                          : "border-muted-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: cycle status
                      }}
                      aria-label={`Status: ${statusLabels[task.status]}`}
                    />

                    {/* Task name + version */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm truncate",
                            task.status === "done" && "line-through text-muted-foreground"
                          )}
                        >
                          {task.name}
                        </span>
                        {task.version_label && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {task.version_label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phase badge */}
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                      style={{
                        borderColor: phaseColors[task.phase],
                        color: phaseColors[task.phase],
                      }}
                    >
                      {phaseLabels[task.phase]}
                    </Badge>

                    {/* Assigned */}
                    {task.assigned_profile && (
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[10px] bg-accent-purple/20 text-accent-purple">
                          {task.assigned_profile.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Date range */}
                    {task.start_date && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden lg:block">
                        {new Date(task.start_date).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                        {task.end_date && task.end_date !== task.start_date && (
                          <>
                            {" → "}
                            {new Date(task.end_date).toLocaleDateString("nl-NL", {
                              day: "numeric",
                              month: "short",
                            })}
                          </>
                        )}
                      </span>
                    )}

                    {/* Hours */}
                    {task.budgeted_hours && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {task.logged_hours ?? 0}u/{task.budgeted_hours}u
                      </span>
                    )}

                    {/* Review link */}
                    {task.review_link && (
                      <a
                        href={task.review_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-accent-teal transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
