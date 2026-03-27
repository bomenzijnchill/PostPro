"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadStepProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function UploadStep({ onFileSelect, isProcessing }: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
        dragActive
          ? "border-accent-yellow bg-accent-yellow/5"
          : "border-border hover:border-border-hover",
        isProcessing && "opacity-50 pointer-events-none"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent-yellow border-t-transparent mb-4" />
          <p className="text-sm text-muted-foreground">bestand verwerken...</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-secondary p-4 mb-4">
            <FileSpreadsheet size={32} className="text-accent-teal" />
          </div>
          <p className="text-sm font-medium mb-1">
            sleep een excel-bestand hierheen
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            of klik om te selecteren (.xlsx, .xls)
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm text-foreground hover:bg-secondary/80 transition-colors">
              <Upload size={14} />
              bestand kiezen
            </span>
          </label>
        </>
      )}
    </div>
  );
}
