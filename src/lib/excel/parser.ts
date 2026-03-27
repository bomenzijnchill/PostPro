import * as XLSX from "xlsx";
import type { ExcelPreview, DetectionResult, ParsedVideo, ParsedTask } from "./types";

export function parseExcelFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellStyles: true });
        resolve(workbook);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function getExcelPreview(workbook: XLSX.WorkBook): ExcelPreview {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    defval: null,
  });

  const headers = (jsonData[0] ?? []).map((h) => String(h ?? ""));
  const rows = jsonData.slice(0, 50); // Preview first 50 rows

  return {
    sheetNames: workbook.SheetNames,
    headers,
    rows,
    totalRows: jsonData.length,
  };
}

export function detectStructure(workbook: XLSX.WorkBook): DetectionResult {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  });
  const rawData = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  let projectName: string | null = null;
  const teamMembers: string[] = [];
  let dateRow: number | null = null;
  const dateColumns: { col: number; date: string }[] = [];
  const videos: ParsedVideo[] = [];

  // Detect project name: first non-empty cell in first few rows with substantial text
  for (let r = 0; r < Math.min(5, jsonData.length); r++) {
    const row = jsonData[r];
    if (!row) continue;
    for (const cell of row) {
      if (
        cell &&
        typeof cell === "string" &&
        cell.length > 3 &&
        !cell.match(/^\d/)
      ) {
        projectName = cell.trim();
        break;
      }
    }
    if (projectName) break;
  }

  // Detect date row: row with many date-like values
  for (let r = 0; r < Math.min(15, rawData.length); r++) {
    const row = rawData[r];
    if (!row) continue;
    let dateCount = 0;
    const tempDateCols: { col: number; date: string }[] = [];

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell === null || cell === undefined) continue;

      // Check if it's a date serial number (Excel dates are typically > 40000)
      if (typeof cell === "number" && cell > 40000 && cell < 50000) {
        const date = excelDateToISO(cell);
        if (date) {
          dateCount++;
          tempDateCols.push({ col: c, date });
        }
      }
      // Check for date strings
      const strCell = String(cell);
      if (strCell.match(/\d{1,2}[\s/-](jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)/i)) {
        dateCount++;
        tempDateCols.push({ col: c, date: strCell });
      }
    }

    if (dateCount >= 5) {
      dateRow = r;
      dateColumns.push(...tempDateCols);
      break;
    }
  }

  // Detect videos and tasks
  let currentVideo: ParsedVideo | null = null;

  for (let r = (dateRow ?? 5) + 1; r < jsonData.length; r++) {
    const row = jsonData[r];
    if (!row || row.every((c) => c === null || c === "")) continue;

    const firstCell = String(row[0] ?? "").trim();
    const secondCell = String(row[1] ?? "").trim();

    // Count numeric values in date columns
    let numericCount = 0;
    for (const dc of dateColumns) {
      const val = row[dc.col];
      if (val !== null && val !== "" && !isNaN(Number(val))) {
        numericCount++;
      }
    }

    // If first cell looks like a video name (no numbers in date columns, short text)
    if (
      firstCell &&
      firstCell.length > 0 &&
      numericCount === 0 &&
      (firstCell.toLowerCase().startsWith("video") ||
        firstCell.match(/^\d{1,2}['"'']/) ||
        (firstCell.length < 30 && !secondCell))
    ) {
      currentVideo = { name: firstCell, tasks: [] };
      videos.push(currentVideo);
      continue;
    }

    // Otherwise it might be a task row
    if (currentVideo && firstCell) {
      const owner = secondCell || "";
      if (owner) {
        // Add to team members
        const names = owner.split(/[&,]/).map((n) => n.trim()).filter(Boolean);
        for (const name of names) {
          if (!teamMembers.includes(name)) teamMembers.push(name);
        }
      }

      // Detect start/end dates based on which date columns have values
      let startDate: string | null = null;
      let endDate: string | null = null;
      let totalHours = 0;

      for (const dc of dateColumns) {
        const val = row[dc.col];
        if (val !== null && val !== "" && !isNaN(Number(val))) {
          if (!startDate) startDate = dc.date;
          endDate = dc.date;
          totalHours += Number(val);
        }
      }

      // Detect phase from cell color (would need cellStyles)
      const phase = guessPhase(firstCell);

      const task: ParsedTask = {
        name: firstCell,
        owner: owner || "",
        phase,
        startDate,
        endDate,
        hours: totalHours,
        color: null,
      };

      currentVideo.tasks.push(task);
    }
  }

  // If no videos detected, create a default one
  if (videos.length === 0 && jsonData.length > 5) {
    videos.push({ name: "Video 1", tasks: [] });
  }

  return {
    projectName,
    teamMembers,
    dateRow,
    dateColumns,
    videos,
    confidence: dateRow !== null ? 0.7 : 0.3,
  };
}

function guessPhase(taskName: string): string {
  const lower = taskName.toLowerCase();
  if (lower.includes("feedback") || lower.includes("review")) {
    if (lower.includes("client") || lower.includes("klant")) {
      return "client_feedback";
    }
    return "internal_review";
  }
  if (lower.includes("grading") || lower.includes("color") || lower.includes("kleur")) {
    return "grading";
  }
  if (lower.includes("deliver") || lower.includes("oplevering") || lower.includes("final")) {
    return "delivery";
  }
  return "editing";
}

function excelDateToISO(serial: number): string | null {
  try {
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}
