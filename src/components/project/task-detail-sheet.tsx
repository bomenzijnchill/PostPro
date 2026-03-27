"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TimeEntryForm } from "./time-entry-form";
import { phaseColors, phaseLabels, statusLabels } from "@/lib/utils/gantt";
import { createClient } from "@/lib/supabase/client";
import type { TaskWithAssignee, Profile, TimeEntry } from "@/lib/supabase/types";
import { ExternalLink, Clock } from "lucide-react";

interface TaskDetailSheetProps {
  task: TaskWithAssignee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members?: Profile[];
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  members = [],
}: TaskDetailSheetProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showTimeForm, setShowTimeForm] = useState(false);

  const updateTask = useMutation({
    mutationFn: async (updates: Record<string, string | number | boolean | null>) => {
      if (!task) return;
      const { error } = await supabase
        .from("tasks")
        .update(updates as Record<string, unknown>)
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail"] });
    },
  });

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[480px] bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{task.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">status</Label>
            <Select
              value={task.status}
              onValueChange={(value) => updateTask.mutate({ status: value })}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phase */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">fase</Label>
            <Select
              value={task.phase}
              onValueChange={(value) => updateTask.mutate({ phase: value })}
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(phaseLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: phaseColors[key] }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned to */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">eigenaar</Label>
            <Select
              value={task.assigned_to ?? ""}
              onValueChange={(value) =>
                updateTask.mutate({ assigned_to: value || null })
              }
            >
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="niet toegewezen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">niet toegewezen</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">startdatum</Label>
              <Input
                type="date"
                value={task.start_date ?? ""}
                onChange={(e) =>
                  updateTask.mutate({ start_date: e.target.value || null })
                }
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">einddatum</Label>
              <Input
                type="date"
                value={task.end_date ?? ""}
                onChange={(e) =>
                  updateTask.mutate({ end_date: e.target.value || null })
                }
                className="bg-secondary"
              />
            </div>
          </div>

          {/* Version label */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">versie</Label>
            <Input
              value={task.version_label ?? ""}
              onChange={(e) =>
                updateTask.mutate({ version_label: e.target.value || null })
              }
              placeholder="bijv. V0.5, V1, FINAL"
              className="bg-secondary"
            />
          </div>

          {/* Budgeted hours */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">budget uren</Label>
            <Input
              type="number"
              step="0.5"
              value={task.budgeted_hours ?? ""}
              onChange={(e) =>
                updateTask.mutate({
                  budgeted_hours: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="bg-secondary font-mono"
            />
          </div>

          {/* Review link */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">review link</Label>
            <div className="flex gap-2">
              <Input
                value={task.review_link ?? ""}
                onChange={(e) =>
                  updateTask.mutate({ review_link: e.target.value || null })
                }
                placeholder="frame.io / vimeo url"
                className="bg-secondary flex-1"
              />
              {task.review_link && (
                <a
                  href={task.review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-md bg-secondary text-muted-foreground hover:text-accent-teal transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">notities</Label>
            <textarea
              value={task.notes ?? ""}
              onChange={(e) => updateTask.mutate({ notes: e.target.value || null })}
              rows={3}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="interne notities..."
            />
          </div>

          <Separator />

          {/* Time entries section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock size={14} />
                uren log
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {task.logged_hours ?? 0}u gelogd
                {task.budgeted_hours ? ` / ${task.budgeted_hours}u budget` : ""}
              </span>
            </div>

            {/* Time entries list */}
            {task.time_entries && task.time_entries.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {task.time_entries.map((entry: TimeEntry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 text-xs text-muted-foreground rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <span className="font-mono">
                      {new Date(entry.logged_at).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {entry.hours}u
                    </span>
                    {entry.note && <span className="truncate">{entry.note}</span>}
                  </div>
                ))}
              </div>
            )}

            {showTimeForm ? (
              <TimeEntryForm
                taskId={task.id}
                onClose={() => setShowTimeForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeForm(true)}
                className="w-full"
              >
                + uren loggen
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
