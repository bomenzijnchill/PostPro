"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface TimeEntryFormProps {
  taskId: string;
  onClose: () => void;
}

export function TimeEntryForm({ taskId, onClose }: TimeEntryFormProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [loggedAt, setLoggedAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const logTime = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("time_entries").insert({
        task_id: taskId,
        user_id: user.id,
        hours: Number(hours),
        logged_at: loggedAt,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onClose();
    },
  });

  return (
    <div className="rounded-md border border-border bg-secondary/50 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">uren</Label>
          <Input
            type="number"
            step="0.25"
            min="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="2"
            className="bg-background font-mono"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">datum</Label>
          <Input
            type="date"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">notitie (optioneel)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="waar heb je aan gewerkt?"
          className="bg-background"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => logTime.mutate()}
          disabled={!hours || Number(hours) <= 0 || logTime.isPending}
          className="bg-accent-yellow text-background hover:bg-accent-yellow/90"
        >
          {logTime.isPending ? "opslaan..." : "opslaan"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          annuleren
        </Button>
      </div>
    </div>
  );
}
