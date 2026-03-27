"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProjectCard } from "@/components/dashboard/project-card";
import { TaskBoard } from "@/components/dashboard/task-board";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "goedenacht";
  if (hour < 12) return "goedemorgen";
  if (hour < 18) return "goedemiddag";
  return "goedenavond";
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { count: activeCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: openTaskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["todo", "in_progress"]);

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const { data: weekEntries } = await supabase
        .from("time_entries")
        .select("hours")
        .gte("logged_at", weekStartStr);

      const hoursThisWeek = weekEntries?.reduce((s, e) => s + Number(e.hours), 0) ?? 0;

      return {
        activeProjects: activeCount ?? 0,
        openTasks: openTaskCount ?? 0,
        hoursThisWeek,
        budgetHealth: 85,
      };
    },
  });

  // Fetch ALL tasks with project/video info for the task board
  const { data: allTasksData } = useQuery({
    queryKey: ["all-tasks-board"],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("*, profiles:assigned_to(id, name), videos(name), projects(name, client_name)")
        .order("sort_order");
      if (error) throw error;

      // Fetch time entries for all tasks
      const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);
      let timeEntries: Array<{ task_id: string; hours: number }> = [];
      if (taskIds.length > 0) {
        const { data: entries } = await supabase
          .from("time_entries")
          .select("task_id, hours")
          .in("task_id", taskIds);
        timeEntries = entries ?? [];
      }

      const hoursMap = new Map<string, number>();
      timeEntries.forEach((e) => {
        hoursMap.set(e.task_id, (hoursMap.get(e.task_id) ?? 0) + Number(e.hours));
      });

      return (tasks ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        project_id: t.project_id as string,
        project_name: (t.projects as Record<string, string>)?.name ?? "",
        client_name: (t.projects as Record<string, string>)?.client_name ?? "",
        video_name: (t.videos as Record<string, string>)?.name ?? "",
        phase: t.phase as string,
        status: t.status as string,
        assigned_to: (t.profiles as Record<string, string> | null)?.id ?? null,
        assigned_name: (t.profiles as Record<string, string> | null)?.name ?? null,
        start_date: t.start_date as string | null,
        end_date: t.end_date as string | null,
        budgeted_hours: Number(t.budgeted_hours ?? 0),
        logged_hours: hoursMap.get(t.id as string) ?? 0,
        version_label: t.version_label as string | null,
      }));
    },
  });

  // Fetch members for the task board filters
  const { data: members } = useQuery({
    queryKey: ["org-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeProjects = projects?.filter((p) => p.status === "active") ?? [];
  const completedProjects = projects?.filter((p) => p.status === "completed") ?? [];
  const archivedProjects = projects?.filter((p) => p.status === "archived") ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {profile?.name?.split(" ")[0] ?? "..."}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects/new">
            <Button className="bg-accent-yellow text-background hover:bg-accent-yellow/90">
              <Plus size={16} className="mr-2" />
              nieuw project
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button variant="outline">
              <FileSpreadsheet size={16} className="mr-2" />
              excel importeren
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : (
          <>
            <StatsCard label="actieve projecten" value={stats?.activeProjects ?? 0} />
            <StatsCard label="openstaande taken" value={stats?.openTasks ?? 0} />
            <StatsCard label="uren deze week" value={stats?.hoursThisWeek ?? 0} suffix="u" />
            <StatsCard
              label="budget health"
              value={`${stats?.budgetHealth ?? 0}%`}
              color={(stats?.budgetHealth ?? 0) > 80 ? "text-success" : "text-warning"}
            />
          </>
        )}
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="taken">
        <TabsList className="bg-secondary mb-6">
          <TabsTrigger value="taken">alle taken</TabsTrigger>
          <TabsTrigger value="projecten">projecten</TabsTrigger>
        </TabsList>

        {/* All tasks board */}
        <TabsContent value="taken">
          {allTasksData && members ? (
            <TaskBoard
              tasks={allTasksData}
              members={members}
              currentUserId={profile?.id}
            />
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projecten">
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {activeProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-success mb-3">
                    actieve projecten ({activeProjects.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
              {completedProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-accent-purple mb-3">
                    afgeronde projecten ({completedProjects.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
              {archivedProjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    gearchiveerde projecten ({archivedProjects.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {archivedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
              {(!projects || projects.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                  <p className="text-muted-foreground mb-4">nog geen projecten aangemaakt</p>
                  <Link href="/projects/new">
                    <Button className="bg-accent-yellow text-background hover:bg-accent-yellow/90">
                      <Plus size={16} className="mr-2" />
                      eerste project aanmaken
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
