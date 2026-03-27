"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GanttView } from "@/components/project/gantt-view";
import { GanttFilters } from "@/components/project/gantt-filters";
import { TaskList } from "@/components/project/task-list";
import { TaskDetailSheet } from "@/components/project/task-detail-sheet";
import { cn } from "@/lib/utils";
import type {
  Project,
  VideoWithTasks,
  TaskWithAssignee,
  Profile,
} from "@/lib/supabase/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-accent-purple/10 text-accent-purple border-accent-purple/20",
  archived: "bg-muted text-muted-foreground border-border",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignee | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState({
    person: [] as string[],
    phase: [] as string[],
    status: [] as string[],
    search: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: async () => {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (projectError) throw projectError;

      const { data: videos, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");
      if (videosError) throw videosError;

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*, profiles:assigned_to(id, name, avatar_url)")
        .eq("project_id", projectId)
        .order("sort_order");
      if (tasksError) throw tasksError;

      const taskIds = tasks.map((t: { id: string }) => t.id);
      let timeEntries: Array<{ id: string; task_id: string; hours: number; logged_at: string; note: string | null; user_id: string; created_at: string }> = [];
      if (taskIds.length > 0) {
        const { data: entries } = await supabase
          .from("time_entries")
          .select("*")
          .in("task_id", taskIds)
          .order("logged_at", { ascending: false });
        timeEntries = entries ?? [];
      }

      const { data: members } = await supabase
        .from("profiles")
        .select("*");

      const videosWithTasks: VideoWithTasks[] = (videos ?? []).map((video: { id: string; project_id: string; name: string; format: string | null; sort_order: number; budget_hours: number | null; notes: string | null }) => {
        const videoTasks: TaskWithAssignee[] = (tasks ?? [])
          .filter((t: { video_id: string }) => t.video_id === video.id)
          .map((t: Record<string, unknown>) => {
            const taskEntries = timeEntries.filter((e) => e.task_id === (t.id as string));
            const loggedHours = taskEntries.reduce((sum, e) => sum + Number(e.hours), 0);
            return {
              ...t,
              assigned_profile: t.profiles as Profile | null,
              time_entries: taskEntries,
              logged_hours: loggedHours,
            } as TaskWithAssignee;
          });
        return { ...video, tasks: videoTasks };
      });

      return {
        project: project as Project,
        videos: videosWithTasks,
        members: (members ?? []) as Profile[],
      };
    },
  });

  const handleTaskClick = (task: TaskWithAssignee) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const handleFilterChange = useCallback((f: typeof filters) => {
    setFilters(f);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-muted-foreground">project niet gevonden.</p>
      </div>
    );
  }

  const { project, videos, members } = data;

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          terug naar dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.client_name && (
              <p className="text-muted-foreground mt-0.5">
                {project.client_name}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs", statusColors[project.status])}
          >
            {project.status === "active"
              ? "actief"
              : project.status === "completed"
              ? "afgerond"
              : "gearchiveerd"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gantt">
        <TabsList className="bg-secondary mb-4">
          <TabsTrigger value="gantt">gantt</TabsTrigger>
          <TabsTrigger value="taken">taken</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt">
          {videos.length > 0 ? (
            <>
              <GanttFilters members={members} onFilterChange={handleFilterChange} />
              <GanttView
                videos={videos}
                project={project}
                members={members}
                onTaskClick={handleTaskClick}
                filterPerson={filters.person}
                filterPhase={filters.phase}
                filterStatus={filters.status}
                filterSearch={filters.search}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
              <p>nog geen video&apos;s in dit project.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="taken">
          {videos.length > 0 ? (
            <TaskList videos={videos} onTaskClick={handleTaskClick} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-muted-foreground">
              <p>nog geen taken in dit project.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskDetailSheet
        task={selectedTask}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        members={members}
      />
    </div>
  );
}
