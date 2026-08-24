"use client";

import React, { useState } from "react";
import { fromJSONSchema } from "../core/schema-transformer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { AlertCircleIcon, UploadIcon } from "lucide-react";
import { SchemaField } from "../core/types";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (imported: { title?: string; description?: string; strict?: boolean; fields: SchemaField[] }) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [inputCode, setInputCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    if (!inputCode.trim()) {
      setError("Please paste a valid JSON Schema or tool definition payload.");
      return;
    }

    try {
      const parsed = JSON.parse(inputCode);
      const result = fromJSONSchema(parsed);
      onImport(result);
      onOpenChange(false);
      setInputCode("");
    } catch (err: any) {
      setError(err.message || "Failed to parse JSON Schema. Verify valid JSON syntax.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-popover text-popover-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Import JSON Schema / Tool
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste a standard JSON Schema (Draft-07), OpenAI tool definition, or Claude/MCP input schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Textarea
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder={`{\n  "type": "object",\n  "properties": {\n    "city": { "type": "string" },\n    "units": { "type": "string", "enum": ["celsius", "fahrenheit"] }\n  },\n  "required": ["city"]\n}`}
            className="min-h-[220px] font-mono text-xs bg-background text-foreground"
          />

          {error && (
            <div className="flex items-center gap-2 p-2 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleImport}
            className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
