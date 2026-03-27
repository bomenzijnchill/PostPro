-- PostPro Planner — Initial Schema
-- Team5pm post-production planning tool

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid not null references organizations on delete cascade,
  name text not null,
  avatar_url text,
  role text not null default 'editor' check (role in ('admin', 'planner', 'editor', 'viewer')),
  hourly_rate numeric(10,2),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations on delete cascade,
  name text not null,
  client_name text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  start_date date,
  end_date date,
  total_budget_hours numeric(8,2),
  total_budget_euros numeric(10,2),
  color text,
  created_by uuid not null references profiles on delete set null,
  created_at timestamptz not null default now()
);

create table project_members (
  project_id uuid not null references projects on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  primary key (project_id, user_id)
);

create table videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  format text,
  sort_order int not null default 0,
  budget_hours numeric(8,2),
  notes text
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos on delete cascade,
  project_id uuid not null references projects on delete cascade,
  name text not null,
  phase text not null default 'editing' check (phase in ('editing', 'internal_review', 'client_feedback', 'grading', 'delivery')),
  assigned_to uuid references profiles on delete set null,
  start_date date,
  end_date date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done', 'blocked')),
  budgeted_hours numeric(6,2),
  sort_order int not null default 0,
  version_label text,
  review_link text,
  notes text,
  created_at timestamptz not null default now()
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  logged_at date not null default current_date,
  hours numeric(5,2) not null check (hours > 0),
  note text,
  created_at timestamptz not null default now()
);

create table feedback_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks on delete cascade,
  author_id uuid not null references profiles on delete cascade,
  content text not null,
  version text,
  created_at timestamptz not null default now()
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  token text unique not null,
  created_by uuid not null references profiles on delete cascade,
  expires_at timestamptz,
  show_hours boolean not null default true,
  show_budget boolean not null default false,
  show_owners boolean not null default true,
  show_internal_feedback boolean not null default false,
  is_active boolean not null default true,
  label text,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_profiles_org on profiles(org_id);
create index idx_projects_org on projects(org_id);
create index idx_projects_status on projects(status);
create index idx_videos_project on videos(project_id);
create index idx_tasks_project on tasks(project_id);
create index idx_tasks_video on tasks(video_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_tasks_status on tasks(status);
create index idx_time_entries_task on time_entries(task_id);
create index idx_time_entries_user on time_entries(user_id);
create index idx_time_entries_date on time_entries(logged_at);
create index idx_share_links_token on share_links(token);
create index idx_share_links_project on share_links(project_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table videos enable row level security;
alter table tasks enable row level security;
alter table time_entries enable row level security;
alter table feedback_entries enable row level security;
alter table share_links enable row level security;

-- Helper function: get user's org_id
create or replace function get_user_org_id()
returns uuid as $$
  select org_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper function: get user's role
create or replace function get_user_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Organizations: users can read their own org
create policy "Users can view own organization"
  on organizations for select
  using (id = get_user_org_id());

-- Profiles: users can read profiles in their org, update own
create policy "Users can view org profiles"
  on profiles for select
  using (org_id = get_user_org_id());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Projects: CRUD scoped to org
create policy "Users can view org projects"
  on projects for select
  using (org_id = get_user_org_id());

create policy "Admins and planners can create projects"
  on projects for insert
  with check (
    org_id = get_user_org_id()
    and get_user_role() in ('admin', 'planner')
  );

create policy "Admins and planners can update projects"
  on projects for update
  using (
    org_id = get_user_org_id()
    and get_user_role() in ('admin', 'planner')
  );

create policy "Admins can delete projects"
  on projects for delete
  using (
    org_id = get_user_org_id()
    and get_user_role() = 'admin'
  );

-- Project members
create policy "Users can view project members in org"
  on project_members for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and projects.org_id = get_user_org_id()
    )
  );

create policy "Admins and planners can manage project members"
  on project_members for all
  using (
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and projects.org_id = get_user_org_id()
    )
    and get_user_role() in ('admin', 'planner')
  );

-- Videos: access through project's org
create policy "Users can view org videos"
  on videos for select
  using (
    exists (
      select 1 from projects
      where projects.id = videos.project_id
      and projects.org_id = get_user_org_id()
    )
  );

create policy "Admins and planners can manage videos"
  on videos for all
  using (
    exists (
      select 1 from projects
      where projects.id = videos.project_id
      and projects.org_id = get_user_org_id()
    )
    and get_user_role() in ('admin', 'planner')
  );

-- Tasks: access through project's org
create policy "Users can view org tasks"
  on tasks for select
  using (
    exists (
      select 1 from projects
      where projects.id = tasks.project_id
      and projects.org_id = get_user_org_id()
    )
  );

create policy "Admins and planners can create tasks"
  on tasks for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = tasks.project_id
      and projects.org_id = get_user_org_id()
    )
    and get_user_role() in ('admin', 'planner')
  );

create policy "Admins planners and assigned editors can update tasks"
  on tasks for update
  using (
    exists (
      select 1 from projects
      where projects.id = tasks.project_id
      and projects.org_id = get_user_org_id()
    )
    and (
      get_user_role() in ('admin', 'planner')
      or (get_user_role() = 'editor' and tasks.assigned_to = auth.uid())
    )
  );

-- Time entries: users can insert their own, read within org
create policy "Users can view org time entries"
  on time_entries for select
  using (
    exists (
      select 1 from tasks
      join projects on projects.id = tasks.project_id
      where tasks.id = time_entries.task_id
      and projects.org_id = get_user_org_id()
    )
  );

create policy "Users can log own time"
  on time_entries for insert
  with check (user_id = auth.uid());

create policy "Users can update own time entries"
  on time_entries for update
  using (user_id = auth.uid());

create policy "Users can delete own time entries"
  on time_entries for delete
  using (user_id = auth.uid());

-- Feedback entries
create policy "Users can view org feedback"
  on feedback_entries for select
  using (
    exists (
      select 1 from tasks
      join projects on projects.id = tasks.project_id
      where tasks.id = feedback_entries.task_id
      and projects.org_id = get_user_org_id()
    )
  );

create policy "Users can create feedback"
  on feedback_entries for insert
  with check (author_id = auth.uid());

-- Share links: admin/planner can manage
create policy "Admins and planners can manage share links"
  on share_links for all
  using (
    exists (
      select 1 from projects
      where projects.id = share_links.project_id
      and projects.org_id = get_user_org_id()
    )
    and get_user_role() in ('admin', 'planner')
  );

-- Public access via token (for share pages)
create policy "Anyone can read active share links by token"
  on share_links for select
  using (
    is_active = true
    and (expires_at is null or expires_at > now())
  );

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, org_id, name, role)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'org_id')::uuid,
      (select id from organizations limit 1)
    ),
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'editor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
