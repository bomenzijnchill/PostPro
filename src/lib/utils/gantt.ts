import type { Task } from "@/lib/supabase/types";

export interface DayColumn {
  date: Date;
  dateStr: string;
  label: string;
  isWeekend: boolean;
  isToday: boolean;
}

export function calculateDateRange(tasks: Task[]): { start: Date; end: Date } {
  const dates = tasks
    .flatMap((t) => [t.start_date, t.end_date])
    .filter((d): d is string => d !== null)
    .map((d) => new Date(d));

  if (dates.length === 0) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    const end = new Date(now);
    end.setDate(now.getDate() + 21);
    return { start, end };
  }

  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Add padding: 3 days before, 7 days after
  min.setDate(min.getDate() - 3);
  max.setDate(max.getDate() + 7);

  return { start: min, end: max };
}

export function getDayColumns(start: Date, end: Date): DayColumn[] {
  const columns: DayColumn[] = [];
  const today = new Date().toISOString().split("T")[0];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const day = current.getDay();
    columns.push({
      date: new Date(current),
      dateStr,
      label: current.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
      isWeekend: day === 0 || day === 6,
      isToday: dateStr === today,
    });
    current.setDate(current.getDate() + 1);
  }

  return columns;
}

export function getTaskPosition(
  task: Task,
  rangeStart: Date,
  dayWidth: number
): { left: number; width: number } | null {
  if (!task.start_date || !task.end_date) return null;

  const taskStart = new Date(task.start_date);
  const taskEnd = new Date(task.end_date);

  const startDiff = Math.floor(
    (taskStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration =
    Math.floor(
      (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  return {
    left: startDiff * dayWidth,
    width: Math.max(duration * dayWidth - 2, dayWidth - 2),
  };
}

export const phaseColors: Record<string, string> = {
  editing: "#8b5cf6",
  internal_review: "#f5c518",
  client_feedback: "#f97316",
  grading: "#14b8a6",
  delivery: "#525252",
};

export const phaseLabels: Record<string, string> = {
  editing: "editing",
  internal_review: "interne review",
  client_feedback: "klant feedback",
  grading: "grading",
  delivery: "delivery",
};

export const statusLabels: Record<string, string> = {
  todo: "to do",
  in_progress: "bezig",
  review: "review",
  done: "klaar",
  blocked: "geblokkeerd",
};
