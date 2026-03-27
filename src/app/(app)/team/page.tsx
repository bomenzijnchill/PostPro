"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const roleLabels: Record<string, string> = {
  admin: "admin",
  planner: "planner",
  editor: "editor",
  viewer: "viewer",
};

const roleColors: Record<string, string> = {
  admin: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20",
  planner: "bg-accent-purple/10 text-accent-purple border-accent-purple/20",
  editor: "bg-accent-teal/10 text-accent-teal border-accent-teal/20",
  viewer: "bg-muted text-muted-foreground border-border",
};

export default function TeamPage() {
  const supabase = createClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">team</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 rounded-lg bg-card border border-border p-4"
            >
              <Avatar>
                <AvatarFallback className="bg-accent-purple/20 text-accent-purple">
                  {member.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
              </div>
              <Badge
                variant="outline"
                className={roleColors[member.role] ?? ""}
              >
                {roleLabels[member.role] ?? member.role}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">geen teamleden gevonden.</p>
      )}
    </div>
  );
}
