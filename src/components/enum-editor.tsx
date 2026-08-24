"use client";

import React, { useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { XIcon, PlusIcon } from "lucide-react";

interface EnumEditorProps {
  values?: Array<string | number>;
  onChange: (values: Array<string | number>) => void;
  type?: "string" | "number" | "integer";
  className?: string;
}

export function EnumEditor({
  values = [],
  onChange,
  type = "string",
  className = "",
}: EnumEditorProps) {
  const [inputVal, setInputVal] = useState("");

  const handleAdd = () => {
    if (!inputVal.trim()) return;
    const val = type === "number" || type === "integer" ? Number(inputVal) : inputVal.trim();
    if (!values.includes(val)) {
      onChange([...values, val]);
    }
    setInputVal("");
  };

  const handleRemove = (val: string | number) => {
    onChange(values.filter((v) => v !== val));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">
          Allowed Enum Values ({values.length})
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-1.5 rounded-lg border border-border/80 bg-background/50">
        {values.length === 0 ? (
          <span className="text-[11px] text-muted-foreground italic px-1">
            No enum values defined. Add allowed choices below.
          </span>
        ) : (
          values.map((v) => (
            <Badge
              key={String(v)}
              variant="secondary"
              className="gap-1 font-mono text-xs py-0.5 px-2 bg-secondary text-secondary-foreground"
            >
              {String(v)}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                className="hover:text-destructive focus:outline-none transition-colors"
                aria-label={`Remove enum option ${v}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          type={type === "number" || type === "integer" ? "number" : "text"}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add allowed choice (Enter)..."
          className="h-7 text-xs bg-background"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-7 text-xs shrink-0"
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
