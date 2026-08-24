"use client";

import React, { useState } from "react";
import { ToolDefinition, SchemaProperty } from "@/lib/schema-types";
import { PRESET_TEMPLATES } from "@/lib/presets";
import { PropertyTree } from "./PropertyTree";
import { SchemaPreview } from "./SchemaPreview";
import { SchemaTester } from "./SchemaTester";
import { ImportModal } from "./ImportModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WrenchIcon,
  UploadIcon,
  SparklesIcon,
  CodeIcon,
  PlayIcon,
  RotateCcwIcon,
  PlusIcon,
  LayersIcon,
} from "lucide-react";

const INITIAL_TOOL: ToolDefinition = {
  id: "tool_1",
  name: "search_knowledge_base",
  description: "Searches internal documents and vector database for context.",
  strict: true,
  parameters: [
    {
      id: "p_1",
      name: "query",
      type: "string",
      description: "Semantic query to search across the knowledge base.",
      required: true,
      minLength: 3,
    },
    {
      id: "p_2",
      name: "top_k",
      type: "integer",
      description: "Number of relevant chunks to retrieve.",
      required: false,
      default: 5,
      minimum: 1,
      maximum: 50,
    },
    {
      id: "p_3",
      name: "category",
      type: "enum",
      description: "Category bucket to limit document searching.",
      required: false,
      enumOptions: ["all", "engineering", "legal", "customer_support"],
      default: "all",
    },
    {
      id: "p_4",
      name: "include_metadata",
      type: "boolean",
      description: "Whether to return raw metadata and timestamps.",
      required: false,
      default: true,
    },
  ],
};

interface ToolSchemaBuilderProps {
  initialTool?: ToolDefinition;
  onChange?: (tool: ToolDefinition) => void;
  className?: string;
}

export function ToolSchemaBuilder({
  initialTool = INITIAL_TOOL,
  onChange,
  className = "",
}: ToolSchemaBuilderProps) {
  const [tool, setTool] = useState<ToolDefinition>(initialTool);
  const [rightViewMode, setRightViewMode] = useState<"code" | "test">("code");
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  const updateTool = (updated: ToolDefinition) => {
    setTool(updated);
    if (onChange) onChange(updated);
  };

  const handleApplyPreset = (presetKey: string | null) => {
    if (!presetKey) return;
    const preset = PRESET_TEMPLATES[presetKey];
    if (preset) {
      const cloned: ToolDefinition = JSON.parse(JSON.stringify(preset));
      cloned.id = Math.random().toString(36).substring(2, 9);
      updateTool(cloned);
    }
  };

  const handleClear = () => {
    updateTool({
      id: Math.random().toString(36).substring(2, 9),
      name: "new_tool",
      description: "",
      strict: true,
      parameters: [],
    });
  };

  return (
    <div className={`flex flex-col gap-5 w-full ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Preset:</span>
            <Select onValueChange={handleApplyPreset}>
              <SelectTrigger size="sm" className="h-8 w-[190px] text-xs bg-background">
                <SelectValue placeholder="Load a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_search">Web Search Tool</SelectItem>
                <SelectItem value="sql_database_query">SQL DB Query</SelectItem>
                <SelectItem value="github_issue_creator">GitHub Issue Creator</SelectItem>
                <SelectItem value="invoice_generator">Invoice (Nested Array/Obj)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="h-8 gap-1.5 text-xs bg-background hover:bg-accent"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Import Existing Schema
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Code Exporter vs Sandbox Tester */}
          <Tabs
            value={rightViewMode}
            onValueChange={(val) => setRightViewMode(val as "code" | "test")}
          >
            <TabsList className="bg-background h-8 p-0.5 border border-border">
              <TabsTrigger value="code" className="gap-1.5 text-xs px-3 h-7">
                <CodeIcon className="h-3.5 w-3.5" />
                Code Exporter
              </TabsTrigger>
              <TabsTrigger value="test" className="gap-1.5 text-xs px-3 h-7">
                <PlayIcon className="h-3.5 w-3.5" />
                Live Tester
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split: Builder Left, Preview/Tester Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Tool Config & Property Tree (7 cols on xl, 6 on lg) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4">
          {/* Tool Metadata Card */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-heading text-sm font-semibold text-foreground">
                  Tool Function Configuration
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="strict-toggle"
                  checked={tool.strict}
                  onCheckedChange={(checked) =>
                    updateTool({ ...tool, strict: Boolean(checked) })
                  }
                />
                <label
                  htmlFor="strict-toggle"
                  className="text-xs text-muted-foreground font-medium select-none cursor-pointer"
                  title="Enforces strict structured output schema validation"
                >
                  Strict Mode
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Function Name
                </label>
                <Input
                  value={tool.name}
                  onChange={(e) => updateTool({ ...tool, name: e.target.value })}
                  placeholder="e.g. search_database"
                  className="h-8 mt-1 font-mono text-xs bg-background text-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Tool Purpose Description (Prompt Context)
                </label>
                <Textarea
                  value={tool.description}
                  onChange={(e) => updateTool({ ...tool, description: e.target.value })}
                  placeholder="Explain when and how the LLM should invoke this tool..."
                  className="min-h-[50px] mt-1 text-xs bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Parameters & Arguments Schema Tree */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayersIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Parameter Properties
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tool.parameters.length} {tool.parameters.length === 1 ? "field" : "fields"}
                </Badge>
              </div>
            </div>

            <PropertyTree
              properties={tool.parameters}
              onChange={(newProps) => updateTool({ ...tool, parameters: newProps })}
            />
          </div>
        </div>

        {/* Right Column: Code Exporter or Live Tester (5 cols on xl, 6 on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 h-[calc(100vh-140px)] min-h-[640px] sticky top-20">
          {rightViewMode === "code" ? (
            <SchemaPreview tool={tool} />
          ) : (
            <SchemaTester tool={tool} />
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(importedTool) => updateTool(importedTool)}
      />
    </div>
  );
}
