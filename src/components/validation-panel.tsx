"use client";

import React from "react";
import { ValidationError } from "../core/types";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

interface ValidationPanelProps {
  errors: ValidationError[];
  className?: string;
}

export function ValidationPanel({ errors, className = "" }: ValidationPanelProps) {
  if (errors.length === 0) {
    return (
      <div className={`flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-foreground text-xs ${className}`}>
        <CheckCircle2Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="font-medium">Valid JSON Schema (0 errors)</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs ${className}`}>
      <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="font-semibold">
          Schema Issues ({errors.length} error{errors.length > 1 ? "s" : ""})
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-destructive/90">
          {errors.map((err, i) => (
            <li key={i}>
              <strong className="font-mono">{err.path}:</strong> {err.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
