"use client";

import React, { useState } from "react";
import { ToolDefinition } from "@/lib/schema-types";
import { importToolSchema } from "@/lib/importer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, UploadIcon } from "lucide-react";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (tool: ToolDefinition) => void;
}

export function ImportModal({ open, onOpenChange, onImport }: ImportModalProps) {
  const [inputCode, setInputCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    if (!inputCode.trim()) {
      setError("Please paste a valid JSON schema or tool definition.");
      return;
    }

    try {
      const tool = importToolSchema(inputCode);
      onImport(tool);
      onOpenChange(false);
      setInputCode("");
    } catch (err: any) {
      setError(err.message || "Failed to parse schema. Make sure the JSON is well-formed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-popover text-popover-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Import Existing Tool Schema
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste an OpenAI tool definition, Anthropic tool definition, Model Context Protocol (MCP) schema, standard JSON Schema, or sample JSON object.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Textarea
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder={`{\n  "type": "function",\n  "function": {\n    "name": "get_weather",\n    "parameters": { ... }\n  }\n}`}
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
            Import Schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
