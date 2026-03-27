"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("tasks")
        .select("*, videos(name), projects(name, client_name)")
        .eq("assigned_to", profile!.id)
        .in("status", ["todo", "in_progress", "review"])
        .lte("start_date", today)
        .order("start_date")
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
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
            <StatsCard
              label="actieve projecten"
              value={stats?.activeProjects ?? 0}
            />
            <StatsCard
              label="openstaande taken"
              value={stats?.openTasks ?? 0}
            />
            <StatsCard
              label="uren deze week"
              value={stats?.hoursThisWeek ?? 0}
              suffix="u"
            />
            <StatsCard
              label="budget health"
              value={`${stats?.budgetHealth ?? 0}%`}
              color={
                (stats?.budgetHealth ?? 0) > 80
                  ? "text-success"
                  : "text-warning"
              }
            />
          </>
        )}
      </div>

      {/* My tasks today */}
      {myTasks && myTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">mijn taken vandaag</h2>
          <div className="space-y-2">
            {myTasks.map((task: Record<string, unknown>) => (
              <Link
                key={task.id as string}
                href={`/projects/${task.project_id}`}
                className="flex items-center gap-4 rounded-lg bg-card border border-border p-3 hover:border-border-hover transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full phase-${task.phase}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.name as string}</p>
                  <p className="text-xs text-muted-foreground">
                    {(task.projects as Record<string, string>)?.name} · {(task.videos as Record<string, string>)?.name}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {task.version_label as string}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Project grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">projecten</h2>
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <p className="text-muted-foreground mb-4">
              nog geen projecten aangemaakt
            </p>
            <Link href="/projects/new">
              <Button className="bg-accent-yellow text-background hover:bg-accent-yellow/90">
                <Plus size={16} className="mr-2" />
                eerste project aanmaken
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
