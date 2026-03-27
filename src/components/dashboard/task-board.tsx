"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { phaseColors, phaseLabels, statusLabels } from "@/lib/utils/gantt";
import type { Profile } from "@/lib/supabase/types";
import { Search, ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";

interface TaskRow {
  id: string;
  name: string;
  project_id: string;
  project_name: string;
  client_name: string;
  video_name: string;
  phase: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  start_date: string | null;
  end_date: string | null;
  budgeted_hours: number;
  logged_hours: number;
  version_label: string | null;
}

interface TaskBoardProps {
  tasks: TaskRow[];
  members: Profile[];
  currentUserId?: string;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const statusOrder = ["in_progress", "todo", "review", "blocked", "done"];
const statusGroupLabels: Record<string, string> = {
  in_progress: "in productie",
  todo: "to do",
  review: "review",
  blocked: "geblokkeerd",
  done: "afgerond",
};
const statusGroupColors: Record<string, string> = {
  in_progress: "text-accent-purple",
  todo: "text-accent-yellow",
  review: "text-accent-orange",
  blocked: "text-danger",
  done: "text-success",
};

export function TaskBoard({ tasks, members, currentUserId }: TaskBoardProps) {
  const [search, setSearch] = useState("");
  const [filterPerson, setFilterPerson] = useState<string[]>([]);
  const [filterPhase, setFilterPhase] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterProject, setFilterProject] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(["done"]));
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => map.set(t.project_id, t.project_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPerson.length && !filterPerson.includes(t.assigned_to ?? "")) return false;
      if (filterPhase.length && !filterPhase.includes(t.phase)) return false;
      if (filterStatus.length && !filterStatus.includes(t.status)) return false;
      if (filterProject.length && !filterProject.includes(t.project_id)) return false;
      if (myTasksOnly && t.assigned_to !== currentUserId) return false;
      return true;
    });
  }, [tasks, search, filterPerson, filterPhase, filterStatus, filterProject, myTasksOnly, currentUserId]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TaskRow[]> = {};
    statusOrder.forEach((s) => { groups[s] = []; });
    filteredTasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t);
      else groups[t.status] = [t];
    });
    return groups;
  }, [filteredTasks]);

  const toggleGroup = (status: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const hasFilters = search.length > 0 || filterPerson.length > 0 || filterPhase.length > 0 || filterStatus.length > 0 || filterProject.length > 0 || myTasksOnly;

  const clearAll = () => {
    setSearch("");
    setFilterPerson([]);
    setFilterPhase([]);
    setFilterStatus([]);
    setFilterProject([]);
    setMyTasksOnly(false);
  };

  return (
    <div>
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="zoek taak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-44 pl-8 text-xs bg-secondary border-border"
          />
        </div>

        {/* My tasks toggle */}
        <button
          onClick={() => setMyTasksOnly(!myTasksOnly)}
          className={cn(
            "h-8 px-3 rounded-md text-xs border transition-all",
            myTasksOnly
              ? "bg-accent-yellow text-background border-accent-yellow"
              : "bg-secondary text-muted-foreground border-border hover:border-border-hover"
          )}
        >
          mijn taken
        </button>

        {/* Person filter */}
        <div className="flex items-center gap-1">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setFilterPerson((prev) =>
                  prev.includes(m.id) ? prev.filter((p) => p !== m.id) : [...prev, m.id]
                );
              }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all border-2",
                filterPerson.includes(m.id)
                  ? "bg-accent-yellow text-background border-accent-yellow"
                  : "bg-secondary text-muted-foreground border-transparent hover:border-border-hover"
              )}
              title={m.name}
            >
              {getInitials(m.name)}
            </button>
          ))}
        </div>

        {/* Phase filter */}
        {(["editing", "internal_review", "client_feedback", "grading", "delivery"] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              setFilterPhase((prev) =>
                prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
              );
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] border transition-all",
              filterPhase.includes(p)
                ? "border-current opacity-100"
                : "border-transparent opacity-40 hover:opacity-70"
            )}
            style={{ color: phaseColors[p], backgroundColor: `${phaseColors[p]}15` }}
          >
            {phaseLabels[p]}
          </button>
        ))}

        {/* Project filter */}
        {projects.map((proj) => (
          <button
            key={proj.id}
            onClick={() => {
              setFilterProject((prev) =>
                prev.includes(proj.id) ? prev.filter((x) => x !== proj.id) : [...prev, proj.id]
              );
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] border transition-all",
              filterProject.includes(proj.id)
                ? "bg-foreground/10 border-foreground/20 text-foreground"
                : "border-transparent text-muted-foreground opacity-50 hover:opacity-80"
            )}
          >
            {proj.name}
          </button>
        ))}

        {hasFilters && (
          <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X size={12} /> wissen
          </button>
        )}
      </div>

      {/* Task count */}
      <div className="text-xs text-muted-foreground mb-3">
        {filteredTasks.length} taken
      </div>

      {/* Grouped task list */}
      <div className="space-y-2">
        {statusOrder.map((status) => {
          const group = groupedTasks[status] ?? [];
          if (group.length === 0) return null;
          const isCollapsed = collapsedGroups.has(status);

          return (
            <div key={status} className="border border-border rounded-lg overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(status)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <span className={cn("text-sm font-semibold", statusGroupColors[status])}>
                  {statusGroupLabels[status] ?? status}
                </span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {group.length}
                </Badge>
              </button>

              {/* Task rows */}
              {!isCollapsed && (
                <div>
                  {/* Column headers */}
                  <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border bg-card">
                    <span className="flex-1">taak</span>
                    <span className="w-28">project</span>
                    <span className="w-24">video</span>
                    <span className="w-16 text-center">fase</span>
                    <span className="w-16 text-center">eigenaar</span>
                    <span className="w-24 text-center">periode</span>
                    <span className="w-16 text-right">uren</span>
                  </div>
                  {group.map((task) => (
                    <Link
                      key={task.id}
                      href={`/projects/${task.project_id}`}
                      className="flex items-center gap-2 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate">{task.name}</span>
                        {task.version_label && (
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {task.version_label}
                          </span>
                        )}
                      </div>
                      <span className="w-28 text-xs text-muted-foreground truncate">
                        {task.project_name}
                      </span>
                      <span className="w-24 text-xs text-muted-foreground truncate">
                        {task.video_name}
                      </span>
                      <div className="w-16 flex justify-center">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: phaseColors[task.phase] }}
                          title={phaseLabels[task.phase]}
                        />
                      </div>
                      <div className="w-16 flex justify-center">
                        {task.assigned_name ? (
                          <div
                            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold"
                            title={task.assigned_name}
                          >
                            {getInitials(task.assigned_name)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </div>
                      <span className="w-24 text-center text-[11px] font-mono text-muted-foreground">
                        {task.start_date
                          ? `${new Date(task.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`
                          : "—"}
                      </span>
                      <span className="w-16 text-right text-[11px] font-mono">
                        {task.budgeted_hours > 0 ? (
                          <span className={cn(
                            task.logged_hours > task.budgeted_hours ? "text-danger" : "text-muted-foreground"
                          )}>
                            {task.logged_hours}/{task.budgeted_hours}u
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
