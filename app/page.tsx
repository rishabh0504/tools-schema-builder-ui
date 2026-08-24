"use client";

import React, { useState, useEffect } from "react";
import { ToolSchemaBuilder } from "@/src/components/tool-schema-builder";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  SunIcon,
  MoonIcon,
  TerminalIcon,
  LayersIcon,
  SparklesIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [variant, setVariant] = useState<"default" | "card" | "ghost">("default");
  const [density, setDensity] = useState<"default" | "compact" | "comfortable">("default");

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="w-full max-w-[1700px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/60 font-semibold shadow-2xs">
              <TerminalIcon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold text-sm tracking-tight">
                  ToolSchema Builder
                </span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono">
                  v1.0.0
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Public reusable NPM package for visual AI agent tool & JSON Schema generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* CVA Variant Switcher Demo */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Variant:</span>
              <Select value={variant} onValueChange={(v: any) => setVariant(v)}>
                <SelectTrigger size="sm" className="h-7 w-24 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="text-xs">default</SelectItem>
                  <SelectItem value="card" className="text-xs">card</SelectItem>
                  <SelectItem value="ghost" className="text-xs">ghost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Density Switcher Demo */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Density:</span>
              <Select value={density} onValueChange={(d: any) => setDensity(d)}>
                <SelectTrigger size="sm" className="h-7 w-28 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact" className="text-xs">compact</SelectItem>
                  <SelectItem value="default" className="text-xs">default</SelectItem>
                  <SelectItem value="comfortable" className="text-xs">comfortable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setIsDark(!isDark)}
              className="h-8 w-8 text-foreground bg-background"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main App Playground Container */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 py-5">
        <div className="mb-4 space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight font-heading">
            AI Agent Tool Schema Designer
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visually construct nested parameters, validations, and enum choices for AI agent tools. 
            Instantly export structured outputs to any major LLM ecosystem or copy embeddable Zod validation schemas.
          </p>
        </div>

        {/* Public Reusable Component */}
        <ToolSchemaBuilder
          variant={variant}
          density={density}
          showPreview
          showValidation
          showMetadata
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-4 mt-8">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Built with strict Shadcn & Base UI tokens</span>
            <span>•</span>
            <span>Zero hardcoded colors</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">OpenAI • Anthropic • Gemini • MCP • Zod • JSON Schema</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
