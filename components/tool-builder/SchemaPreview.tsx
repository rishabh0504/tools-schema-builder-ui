"use client";

import React, { useState } from "react";
import { ToolDefinition, ExportFormat } from "@/lib/schema-types";
import {
  generateOpenAISchema,
  generateAnthropicSchema,
  generateGeminiSchema,
  generateMcpSchema,
  generateZodSchema,
  generateJsonSchema,
  generateTypeScriptSchema,
} from "@/lib/generators";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CopyIcon, DownloadIcon, CodeIcon } from "lucide-react";

interface SchemaPreviewProps {
  tool: ToolDefinition;
}

export function SchemaPreview({ tool }: SchemaPreviewProps) {
  const [activeTab, setActiveTab] = useState<ExportFormat>("openai");
  const [copied, setCopied] = useState<boolean>(false);

  const getGeneratedCode = (format: ExportFormat): { code: string; language: string; filename: string } => {
    switch (format) {
      case "openai":
        return {
          code: generateOpenAISchema(tool),
          language: "json",
          filename: `${tool.name || "tool"}.openai.json`,
        };
      case "anthropic":
        return {
          code: generateAnthropicSchema(tool),
          language: "json",
          filename: `${tool.name || "tool"}.anthropic.json`,
        };
      case "gemini":
        return {
          code: generateGeminiSchema(tool),
          language: "json",
          filename: `${tool.name || "tool"}.gemini.json`,
        };
      case "mcp":
        return {
          code: generateMcpSchema(tool),
          language: "json",
          filename: `${tool.name || "tool"}.mcp.json`,
        };
      case "zod":
        return {
          code: generateZodSchema(tool),
          language: "typescript",
          filename: `${tool.name || "tool"}.schema.ts`,
        };
      case "json_schema":
        return {
          code: generateJsonSchema(tool),
          language: "json",
          filename: `${tool.name || "tool"}.schema.json`,
        };
      case "typescript":
        return {
          code: generateTypeScriptSchema(tool),
          language: "typescript",
          filename: `${tool.name || "tool"}.types.ts`,
        };
      default:
        return { code: "", language: "text", filename: "schema.txt" };
    }
  };

  const currentResult = getGeneratedCode(activeTab);

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
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 p-2.5">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as ExportFormat)}
            className="w-auto"
          >
            <TabsList className="bg-background h-8 p-0.5 border border-border">
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
              <TabsTrigger value="json_schema" className="text-xs px-2.5 h-7">
                JSON Schema
              </TabsTrigger>
              <TabsTrigger value="typescript" className="text-xs px-2.5 h-7">
                TS Types
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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

      {/* Code Container */}
      <div className="flex-1 overflow-auto p-4 bg-muted/10 font-mono text-xs text-foreground leading-relaxed selection:bg-primary/20">
        <pre className="whitespace-pre">{currentResult.code}</pre>
      </div>

      {/* Footer bar with meta stats */}
      <div className="border-t border-border bg-muted/30 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Format: <strong className="text-foreground uppercase">{activeTab}</strong></span>
          <span>•</span>
          <span>Parameters: <strong className="text-foreground">{tool.parameters.length}</strong></span>
        </div>
        <div className="font-mono text-[10px]">
          {currentResult.filename}
        </div>
      </div>
    </div>
  );
}
