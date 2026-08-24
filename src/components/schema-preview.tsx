"use client";

import React, { useState } from "react";
import { JSONSchemaObject } from "../core/types";
import {
  toOpenAITool,
  toAnthropicTool,
  toGeminiTool,
  toMCPTool,
  toZodCode,
} from "../core/adapters";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";

export type ExportAdapterFormat =
  | "json_schema"
  | "openai"
  | "anthropic"
  | "gemini"
  | "mcp"
  | "zod";

interface SchemaPreviewProps {
  toolName?: string;
  toolDescription?: string;
  strict?: boolean;
  schema: JSONSchemaObject;
  className?: string;
}

export function SchemaPreview({
  toolName = "custom_tool",
  toolDescription = "",
  strict = false,
  schema,
  className = "",
}: SchemaPreviewProps) {
  const [activeFormat, setActiveFormat] = useState<ExportAdapterFormat>("json_schema");
  const [copied, setCopied] = useState<boolean>(false);

  const getCodePayload = (
    format: ExportAdapterFormat
  ): { code: string; language: string; filename: string } => {
    switch (format) {
      case "json_schema":
        return {
          code: JSON.stringify(schema, null, 2),
          language: "json",
          filename: `${toolName}.schema.json`,
        };
      case "openai":
        return {
          code: JSON.stringify(
            toOpenAITool(toolName, schema, { description: toolDescription, strict }),
            null,
            2
          ),
          language: "json",
          filename: `${toolName}.openai.json`,
        };
      case "anthropic":
        return {
          code: JSON.stringify(
            toAnthropicTool(toolName, schema, { description: toolDescription }),
            null,
            2
          ),
          language: "json",
          filename: `${toolName}.anthropic.json`,
        };
      case "gemini":
        return {
          code: JSON.stringify(
            toGeminiTool(toolName, schema, { description: toolDescription }),
            null,
            2
          ),
          language: "json",
          filename: `${toolName}.gemini.json`,
        };
      case "mcp":
        return {
          code: JSON.stringify(
            toMCPTool(toolName, schema, { description: toolDescription }),
            null,
            2
          ),
          language: "json",
          filename: `${toolName}.mcp.json`,
        };
      case "zod":
        return {
          code: toZodCode(toolName, schema),
          language: "typescript",
          filename: `${toolName}.schema.ts`,
        };
      default:
        return { code: "", language: "json", filename: "schema.json" };
    }
  };

  const currentResult = getCodePayload(activeFormat);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentResult.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentResult.code], {
      type: currentResult.language === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-2xs ${className}`}
    >
      {/* Top Header with Format Tabs and Icon-Only Actions */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 p-2.5">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Tabs
            value={activeFormat}
            onValueChange={(val) => setActiveFormat(val as ExportAdapterFormat)}
            className="w-auto"
          >
            <TabsList className="bg-background h-8 p-0.5 border border-border">
              <TabsTrigger value="json_schema" className="text-xs px-2.5 h-7">
                JSON Schema
              </TabsTrigger>
              <TabsTrigger value="openai" className="text-xs px-2.5 h-7">
                OpenAI
              </TabsTrigger>
              <TabsTrigger value="anthropic" className="text-xs px-2.5 h-7">
                Claude
              </TabsTrigger>
              <TabsTrigger value="gemini" className="text-xs px-2.5 h-7">
                Gemini
              </TabsTrigger>
              <TabsTrigger value="mcp" className="text-xs px-2.5 h-7">
                MCP
              </TabsTrigger>
              <TabsTrigger value="zod" className="text-xs px-2.5 h-7">
                Zod
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Icon-Only Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleCopy}
            className="h-8 w-8 bg-background hover:bg-accent text-foreground"
            title={copied ? "Copied to clipboard!" : "Copy code"}
            aria-label={copied ? "Copied to clipboard" : "Copy code"}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-foreground" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleDownload}
            className="h-8 w-8 bg-background hover:bg-accent text-foreground"
            title={`Download ${currentResult.filename}`}
            aria-label="Download schema file"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-muted/10 font-mono text-xs text-foreground leading-relaxed selection:bg-primary/20">
        <pre className="whitespace-pre">{currentResult.code}</pre>
      </div>

      {/* Footer Meta */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Adapter: <strong className="text-foreground uppercase">{activeFormat}</strong>
          </span>
        </div>
        <div className="font-mono text-[10px]">{currentResult.filename}</div>
      </div>
    </div>
  );
}
