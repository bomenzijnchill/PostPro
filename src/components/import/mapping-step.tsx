"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { phaseLabels, phaseColors } from "@/lib/utils/gantt";
import type { DetectionResult, ParsedVideo } from "@/lib/excel/types";
import { Check, AlertCircle } from "lucide-react";

interface MappingStepProps {
  detection: DetectionResult;
  onConfirm: (data: {
    projectName: string;
    teamMembers: string[];
    videos: ParsedVideo[];
  }) => void;
  onBack: () => void;
}

export function MappingStep({ detection, onConfirm, onBack }: MappingStepProps) {
  const [projectName, setProjectName] = useState(detection.projectName ?? "");
  const [teamMembers] = useState(detection.teamMembers);
  const [videos, setVideos] = useState(detection.videos);

  const totalTasks = videos.reduce((sum, v) => sum + v.tasks.length, 0);

  const updateTaskPhase = (
    videoIdx: number,
    taskIdx: number,
    phase: string
  ) => {
    const updated = [...videos];
    updated[videoIdx] = {
      ...updated[videoIdx],
      tasks: updated[videoIdx].tasks.map((t, i) =>
        i === taskIdx ? { ...t, phase } : t
      ),
    };
    setVideos(updated);
  };

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
          detection.confidence > 0.5
            ? "bg-success/10 text-success"
            : "bg-warning/10 text-warning"
        }`}
      >
        {detection.confidence > 0.5 ? (
          <Check size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        {detection.confidence > 0.5
          ? "we herkennen de structuur van dit bestand."
          : "we konden niet alle velden automatisch herkennen. controleer de mapping hieronder."}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">projectnaam</Label>
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="bijv. EWC Batch 3"
          className="bg-secondary"
        />
        {detection.projectName && (
          <p className="text-xs text-muted-foreground">
            automatisch herkend uit het bestand
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          teamleden ({teamMembers.length} herkend)
        </Label>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map((name) => (
            <Badge key={name} variant="outline" className="text-xs">
              {name}
            </Badge>
          ))}
          {teamMembers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              geen teamleden herkend
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">
          {videos.length} video&apos;s met {totalTasks} taken
        </Label>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {videos.map((video, vi) => (
            <div
              key={vi}
              className="rounded-md border border-border overflow-hidden"
            >
              <div className="bg-secondary/50 px-3 py-2 text-xs font-semibold">
                {video.name}
              </div>
              <div className="divide-y divide-border">
                {video.tasks.map((task, ti) => (
                  <div
                    key={ti}
                    className="flex items-center gap-3 px-3 py-2 text-xs"
                  >
                    <span className="flex-1 truncate">{task.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {task.owner}
                    </span>
                    <Select
                      value={task.phase}
                      onValueChange={(v: string | null) => v && updateTaskPhase(vi, ti, v)}
                    >
                      <SelectTrigger className="w-36 h-7 text-[10px] bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(phaseLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: phaseColors[key] ?? "#525252",
                                }}
                              />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {task.hours > 0 && (
                      <span className="font-mono text-muted-foreground shrink-0">
                        {task.hours}u
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          terug
        </Button>
        <Button
          onClick={() => onConfirm({ projectName, teamMembers, videos })}
          disabled={!projectName}
          className="bg-accent-yellow text-background hover:bg-accent-yellow/90"
        >
          importeer planning
        </Button>
      </div>
    </div>
  );
}
