"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { UploadStep } from "@/components/import/upload-step";
import { MappingStep } from "@/components/import/mapping-step";
import { parseExcelFile, detectStructure } from "@/lib/excel/parser";
import type { DetectionResult, ParsedVideo } from "@/lib/excel/types";
import { Plus, FileSpreadsheet, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

type Step = "choose" | "manual" | "upload" | "mapping" | "success";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("choose");
  const [processing, setProcessing] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Manual form state
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetHours, setBudgetHours] = useState("");

  const createProjectMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      client_name: string;
      start_date?: string;
      end_date?: string;
      total_budget_hours?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          ...data,
          org_id: profile.org_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: (project) => {
      router.push(`/projects/${project.id}`);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: {
      projectName: string;
      teamMembers: string[];
      videos: ParsedVideo[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: data.projectName,
          client_name: "",
          org_id: profile.org_id,
          created_by: user.id,
        })
        .select()
        .single();
      if (projectError) throw projectError;

      // Create videos and tasks
      for (let vi = 0; vi < data.videos.length; vi++) {
        const video = data.videos[vi];
        const { data: createdVideo, error: videoError } = await supabase
          .from("videos")
          .insert({
            project_id: project.id,
            name: video.name,
            sort_order: vi,
          })
          .select()
          .single();
        if (videoError) throw videoError;

        // Create tasks for this video
        const tasks = video.tasks.map((task, ti) => ({
          video_id: createdVideo.id,
          project_id: project.id,
          name: task.name,
          phase: task.phase,
          start_date: task.startDate,
          end_date: task.endDate,
          budgeted_hours: task.hours > 0 ? task.hours : null,
          sort_order: ti,
          status: "todo" as const,
        }));

        if (tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from("tasks")
            .insert(tasks);
          if (tasksError) throw tasksError;
        }
      }

      return project;
    },
    onSuccess: (project) => {
      setCreatedProjectId(project.id);
      setStep("success");
    },
  });

  const handleFileSelect = async (file: File) => {
    setProcessing(true);
    try {
      const workbook = await parseExcelFile(file);
      const result = detectStructure(workbook);
      setDetection(result);
      setStep("mapping");
    } catch (err) {
      console.error("Excel parsing error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate({
      name,
      client_name: clientName,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      total_budget_hours: budgetHours ? Number(budgetHours) : undefined,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        terug naar dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">nieuw project</h1>

      {/* Step: Choose */}
      {step === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-accent-yellow/50 transition-colors"
            onClick={() => setStep("manual")}
          >
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="rounded-full bg-accent-yellow/10 p-4 mb-4">
                <Plus size={24} className="text-accent-yellow" />
              </div>
              <h3 className="font-semibold mb-1">nieuw project starten</h3>
              <p className="text-xs text-muted-foreground">
                maak handmatig een project aan
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:border-accent-teal/50 transition-colors"
            onClick={() => setStep("upload")}
          >
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="rounded-full bg-accent-teal/10 p-4 mb-4">
                <FileSpreadsheet size={24} className="text-accent-teal" />
              </div>
              <h3 className="font-semibold mb-1">excel importeren</h3>
              <p className="text-xs text-muted-foreground">
                importeer een bestaande planning
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Manual form */}
      {step === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>projectnaam</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Brand Video Q1"
              required
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label>klantnaam</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="bijv. Arcade"
              className="bg-secondary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>startdatum</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label>einddatum</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>budget uren (optioneel)</Label>
            <Input
              type="number"
              value={budgetHours}
              onChange={(e) => setBudgetHours(e.target.value)}
              placeholder="bijv. 40"
              className="bg-secondary font-mono"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("choose")}>
              terug
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="bg-accent-yellow text-background hover:bg-accent-yellow/90"
            >
              {createProjectMutation.isPending
                ? "aanmaken..."
                : "project aanmaken"}
            </Button>
          </div>
        </form>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <UploadStep onFileSelect={handleFileSelect} isProcessing={processing} />
          <Button variant="outline" onClick={() => setStep("choose")}>
            terug
          </Button>
        </div>
      )}

      {/* Step: Mapping */}
      {step === "mapping" && detection && (
        <MappingStep
          detection={detection}
          onConfirm={(data) => importMutation.mutate(data)}
          onBack={() => setStep("upload")}
        />
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center text-center py-12">
          <div className="rounded-full bg-success/10 p-4 mb-4">
            <Check size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold mb-2">planning geïmporteerd!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            je project is aangemaakt met alle herkende video&apos;s en taken.
          </p>
          <Button
            onClick={() => router.push(`/projects/${createdProjectId}`)}
            className="bg-accent-yellow text-background hover:bg-accent-yellow/90"
          >
            bekijk project
          </Button>
        </div>
      )}
    </div>
  );
}
