"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { phaseColors, phaseLabels, statusLabels } from "@/lib/utils/gantt";
import type { Profile } from "@/lib/supabase/types";
import { Search, X } from "lucide-react";

interface GanttFiltersProps {
  members: Profile[];
  onFilterChange: (filters: {
    person: string[];
    phase: string[];
    status: string[];
    search: string;
  }) => void;
}

const phases = ["editing", "internal_review", "client_feedback", "grading", "delivery"] as const;
const statuses = ["todo", "in_progress", "review", "done", "blocked"] as const;

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function GanttFilters({ members, onFilterChange }: GanttFiltersProps) {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const emit = (
    persons = selectedPersons,
    phasesVal = selectedPhases,
    statusesVal = selectedStatuses,
    searchVal = search
  ) => {
    onFilterChange({ person: persons, phase: phasesVal, status: statusesVal, search: searchVal });
  };

  const togglePerson = (id: string) => {
    const next = selectedPersons.includes(id)
      ? selectedPersons.filter((p) => p !== id)
      : [...selectedPersons, id];
    setSelectedPersons(next);
    emit(next);
  };

  const togglePhase = (p: string) => {
    const next = selectedPhases.includes(p)
      ? selectedPhases.filter((x) => x !== p)
      : [...selectedPhases, p];
    setSelectedPhases(next);
    emit(undefined, next);
  };

  const toggleStatus = (s: string) => {
    const next = selectedStatuses.includes(s)
      ? selectedStatuses.filter((x) => x !== s)
      : [...selectedStatuses, s];
    setSelectedStatuses(next);
    emit(undefined, undefined, next);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    emit(undefined, undefined, undefined, val);
  };

  const hasFilters = selectedPersons.length > 0 || selectedPhases.length > 0 || selectedStatuses.length > 0 || search.length > 0;

  const clearAll = () => {
    setSelectedPersons([]);
    setSelectedPhases([]);
    setSelectedStatuses([]);
    setSearch("");
    onFilterChange({ person: [], phase: [], status: [], search: "" });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-card border border-border rounded-lg">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="zoek taak..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 w-40 pl-8 text-xs bg-secondary border-border"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Person filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">team</span>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => togglePerson(m.id)}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all border-2",
              selectedPersons.includes(m.id)
                ? "bg-accent-yellow text-background border-accent-yellow"
                : "bg-secondary text-muted-foreground border-transparent hover:border-border-hover"
            )}
            title={m.name}
          >
            {getInitials(m.name)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Phase filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">fase</span>
        {phases.map((p) => (
          <button
            key={p}
            onClick={() => togglePhase(p)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] border transition-all",
              selectedPhases.includes(p)
                ? "border-current opacity-100"
                : "border-transparent opacity-50 hover:opacity-80"
            )}
            style={{ color: phaseColors[p], backgroundColor: `${phaseColors[p]}15` }}
          >
            {phaseLabels[p]}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Status filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">status</span>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] border transition-all",
              selectedStatuses.includes(s)
                ? "bg-foreground/10 border-foreground/20 text-foreground"
                : "border-transparent text-muted-foreground opacity-60 hover:opacity-100"
            )}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
          wissen
        </button>
      )}
    </div>
  );
}
