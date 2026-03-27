export type UserRole = "admin" | "planner" | "editor" | "viewer";
export type ProjectStatus = "active" | "completed" | "archived";
export type TaskPhase = "editing" | "internal_review" | "client_feedback" | "grading" | "delivery";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type ProjectMemberRole = "owner" | "editor" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  hourly_rate: number | null;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  client_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  total_budget_hours: number | null;
  total_budget_euros: number | null;
  color: string | null;
  created_by: string;
  created_at: string;
}

export interface Video {
  id: string;
  project_id: string;
  name: string;
  format: string | null;
  sort_order: number;
  budget_hours: number | null;
  notes: string | null;
}

export interface Task {
  id: string;
  video_id: string;
  project_id: string;
  name: string;
  phase: TaskPhase;
  assigned_to: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TaskStatus;
  budgeted_hours: number | null;
  sort_order: number;
  version_label: string | null;
  review_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  logged_at: string;
  hours: number;
  note: string | null;
  created_at: string;
}

export interface FeedbackEntry {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  version: string | null;
  created_at: string;
}

export interface ShareLink {
  id: string;
  project_id: string;
  token: string;
  created_by: string;
  expires_at: string | null;
  show_hours: boolean;
  show_budget: boolean;
  show_owners: boolean;
  show_internal_feedback: boolean;
  is_active: boolean;
  label: string | null;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
}

// Extended types with relations
export interface TaskWithAssignee extends Task {
  assigned_profile?: Profile | null;
  time_entries?: TimeEntry[];
  logged_hours?: number;
}

export interface VideoWithTasks extends Video {
  tasks: TaskWithAssignee[];
}

export interface ProjectWithDetails extends Project {
  videos?: VideoWithTasks[];
  members?: (ProjectMember & { profile: Profile })[];
  total_logged_hours?: number;
  open_task_count?: number;
}

// Database type for Supabase client (simplified)
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Omit<Organization, "id" | "created_at">; Update: Partial<Omit<Organization, "id">> };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Omit<Profile, "id">> };
      projects: { Row: Project; Insert: Omit<Project, "id" | "created_at">; Update: Partial<Omit<Project, "id">> };
      videos: { Row: Video; Insert: Omit<Video, "id">; Update: Partial<Omit<Video, "id">> };
      tasks: { Row: Task; Insert: Omit<Task, "id" | "created_at">; Update: Partial<Omit<Task, "id">> };
      time_entries: { Row: TimeEntry; Insert: Omit<TimeEntry, "id" | "created_at">; Update: Partial<Omit<TimeEntry, "id">> };
      feedback_entries: { Row: FeedbackEntry; Insert: Omit<FeedbackEntry, "id" | "created_at">; Update: Partial<Omit<FeedbackEntry, "id">> };
      share_links: { Row: ShareLink; Insert: Omit<ShareLink, "id" | "created_at">; Update: Partial<Omit<ShareLink, "id">> };
      project_members: { Row: ProjectMember; Insert: ProjectMember; Update: Partial<ProjectMember> };
    };
  };
}
