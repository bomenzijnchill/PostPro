export interface ParsedProject {
  name: string;
  teamMembers: string[];
  videos: ParsedVideo[];
}

export interface ParsedVideo {
  name: string;
  tasks: ParsedTask[];
}

export interface ParsedTask {
  name: string;
  owner: string;
  phase: string;
  startDate: string | null;
  endDate: string | null;
  hours: number;
  color: string | null;
}

export interface ExcelPreview {
  sheetNames: string[];
  headers: string[];
  rows: (string | number | null)[][];
  totalRows: number;
}

export interface DetectionResult {
  projectName: string | null;
  teamMembers: string[];
  dateRow: number | null;
  dateColumns: { col: number; date: string }[];
  videos: ParsedVideo[];
  confidence: number;
}
