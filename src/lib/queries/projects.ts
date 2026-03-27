import { createClient } from "@/lib/supabase/client";
import type { Project, Task, Profile } from "@/lib/supabase/types";

const supabase = createClient();

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function getProjectStats() {
  const { data: projects } = await supabase
    .from("projects")
    .select("id, status, total_budget_hours")
    .eq("status", "active");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status, start_date, end_date, assigned_to");

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("hours, logged_at, user_id");

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const activeProjectCount = projects?.length ?? 0;

  const openTasks =
    tasks?.filter(
      (t) =>
        (t.status === "todo" || t.status === "in_progress") &&
        t.start_date &&
        t.start_date <= weekEndStr
    ).length ?? 0;

  const hoursThisWeek =
    timeEntries
      ?.filter((e) => e.logged_at >= weekStartStr && e.logged_at <= weekEndStr)
      .reduce((sum, e) => sum + Number(e.hours), 0) ?? 0;

  return {
    activeProjectCount,
    openTasks,
    hoursThisWeek,
    budgetHealth: activeProjectCount > 0 ? 85 : 0,
  };
}

export async function getMyTasks(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      videos!inner(name),
      projects!inner(name, client_name)
    `)
    .eq("assigned_to", userId)
    .in("status", ["todo", "in_progress", "review"])
    .lte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function createProject(project: {
  name: string;
  client_name: string;
  start_date?: string;
  end_date?: string;
  total_budget_hours?: number;
  total_budget_euros?: number;
  color?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
      org_id: profile.org_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function getOrgMembers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as Profile[];
}
