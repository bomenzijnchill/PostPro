"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/supabase/types";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  completed: "bg-accent-purple/10 text-accent-purple border-accent-purple/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  active: "actief",
  completed: "afgerond",
  archived: "gearchiveerd",
};

interface ProjectCardProps {
  project: Project;
  loggedHours?: number;
  videoCount?: number;
  openTaskCount?: number;
}

export function ProjectCard({
  project,
  loggedHours = 0,
  videoCount = 0,
  openTaskCount = 0,
}: ProjectCardProps) {
  const budgetHours = project.total_budget_hours ?? 0;
  const progress = budgetHours > 0 ? (loggedHours / budgetHours) * 100 : 0;
  const progressColor =
    progress > 95 ? "bg-danger" : progress > 80 ? "bg-warning" : "bg-accent-teal";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-card border-border hover:border-border-hover transition-colors cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-accent-yellow transition-colors">
                {project.name}
              </h3>
              {project.client_name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {project.client_name}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={cn("ml-2 shrink-0 text-xs", statusColors[project.status])}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>

          {budgetHours > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-mono">
                  {loggedHours}u / {budgetHours}u
                </span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", progressColor)}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{videoCount} video{videoCount !== 1 ? "'s" : ""}</span>
            <span>{openTaskCount} open</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
