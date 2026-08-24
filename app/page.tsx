"use client";

import { ToolSchemaBuilder } from "@/components/tool-builder/ToolSchemaBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoonIcon,
  SunIcon,
  TerminalIcon
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isDark, setIsDark] = useState(true);

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
      {/* Main Container */}
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

        {/* The Embeddable ToolSchemaBuilder Component */}
        <ToolSchemaBuilder />
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
            <span className="font-mono text-[11px]">OpenAI • Anthropic • Gemini • MCP • Zod</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
