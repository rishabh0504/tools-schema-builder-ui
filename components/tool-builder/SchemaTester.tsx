"use client";

import React, { useState } from "react";
import { ToolDefinition, SchemaProperty } from "@/lib/schema-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayIcon, CheckCircle2Icon, AlertCircleIcon, RotateCcwIcon } from "lucide-react";

interface SchemaTesterProps {
  tool: ToolDefinition;
}

export function SchemaTester({ tool }: SchemaTesterProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    outputPayload?: string;
  } | null>(null);

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRunValidation = () => {
    const errors: string[] = [];

    // Basic schema validator against properties
    for (const prop of tool.parameters) {
      const val = formData[prop.name];

      // Check required
      if (prop.required && (val === undefined || val === "" || val === null)) {
        errors.push(`Field '${prop.name}' is required.`);
        continue;
      }

      if (val !== undefined && val !== "" && val !== null) {
        if (prop.type === "number" || prop.type === "integer") {
          const num = Number(val);
          if (isNaN(num)) {
            errors.push(`Field '${prop.name}' must be a valid number.`);
          } else {
            if (prop.type === "integer" && !Number.isInteger(num)) {
              errors.push(`Field '${prop.name}' must be an integer.`);
            }
            if (prop.minimum !== undefined && num < prop.minimum) {
              errors.push(`Field '${prop.name}' minimum is ${prop.minimum}.`);
            }
            if (prop.maximum !== undefined && num > prop.maximum) {
              errors.push(`Field '${prop.name}' maximum is ${prop.maximum}.`);
            }
          }
        }

        if (prop.type === "string") {
          const str = String(val);
          if (prop.minLength !== undefined && str.length < prop.minLength) {
            errors.push(`Field '${prop.name}' minimum length is ${prop.minLength}.`);
          }
          if (prop.maxLength !== undefined && str.length > prop.maxLength) {
            errors.push(`Field '${prop.name}' maximum length is ${prop.maxLength}.`);
          }
          if (prop.pattern) {
            const reg = new RegExp(prop.pattern);
            if (!reg.test(str)) {
              errors.push(`Field '${prop.name}' does not match pattern /${prop.pattern}/.`);
            }
          }
        }

        if (prop.type === "enum") {
          if (prop.enumOptions && !prop.enumOptions.includes(String(val))) {
            errors.push(
              `Field '${prop.name}' value must be one of [${prop.enumOptions.join(", ")}].`
            );
          }
        }
      }
    }

    if (errors.length === 0) {
      setValidationResult({
        valid: true,
        errors: [],
        outputPayload: JSON.stringify(
          {
            tool_name: tool.name || "custom_tool",
            arguments: formData,
          },
          null,
          2
        ),
      });
    } else {
      setValidationResult({
        valid: false,
        errors,
      });
    }
  };

  const handleReset = () => {
    setFormData({});
    setValidationResult(null);
  };

  const renderInputField = (prop: SchemaProperty) => {
    const value = formData[prop.name] ?? prop.default ?? "";

    if (prop.type === "boolean") {
      return (
        <div className="flex items-center gap-2 mt-1">
          <Checkbox
            id={`test-${prop.id}`}
            checked={formData[prop.name] ?? Boolean(prop.default) ?? false}
            onCheckedChange={(checked) => handleFieldChange(prop.name, Boolean(checked))}
          />
          <label htmlFor={`test-${prop.id}`} className="text-xs font-mono select-none">
            {formData[prop.name] ? "true" : "false"}
          </label>
        </div>
      );
    }

    if (prop.type === "enum" && prop.enumOptions && prop.enumOptions.length > 0) {
      return (
        <Select
          value={String(value)}
          onValueChange={(val) => handleFieldChange(prop.name, val)}
        >
          <SelectTrigger size="sm" className="h-8 mt-1 font-mono text-xs bg-background">
            <SelectValue placeholder="Select option..." />
          </SelectTrigger>
          <SelectContent>
            {prop.enumOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="font-mono text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (prop.type === "number" || prop.type === "integer") {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) =>
            handleFieldChange(
              prop.name,
              e.target.value === "" ? undefined : Number(e.target.value)
            )
          }
          placeholder={`e.g. ${prop.minimum ?? 0}`}
          className="h-8 mt-1 font-mono text-xs bg-background text-foreground"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => handleFieldChange(prop.name, e.target.value)}
        placeholder={`Enter ${prop.name}...`}
        className="h-8 mt-1 text-xs bg-background text-foreground"
      />
    );
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 p-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Interactive Tool Sandbox
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Test tool input payload arguments against your schema definitions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 text-xs bg-background hover:bg-accent"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
            Reset
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleRunValidation}
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlayIcon className="h-3.5 w-3.5 fill-current" />
            Validate Arguments
          </Button>
        </div>
      </div>

      {/* Main Grid: Input Form vs Output Validation */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        {/* Form Inputs Area */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {tool.parameters.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No parameters defined yet. Add parameters in the visual builder to test inputs.
            </div>
          ) : (
            tool.parameters.map((prop) => (
              <div key={prop.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
                    {prop.name || "unnamed_field"}
                    {prop.required && (
                      <span className="text-[10px] text-destructive">*</span>
                    )}
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {prop.type}
                  </span>
                </div>
                {prop.description && (
                  <p className="text-[11px] text-muted-foreground">{prop.description}</p>
                )}
                {renderInputField(prop)}
              </div>
            ))
          )}
        </div>

        {/* Validation Result & JSON Payload */}
        <div className="p-4 overflow-y-auto flex flex-col bg-muted/10">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Execution Result
          </div>

          {validationResult === null ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              <PlayIcon className="h-6 w-6 mb-2 opacity-40" />
              <span>Fill in the fields on the left and click "Validate Arguments".</span>
            </div>
          ) : validationResult.valid ? (
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-foreground text-xs">
                <CheckCircle2Icon className="h-4 w-4 shrink-0 text-foreground" />
                <span className="font-medium">All schema constraints satisfied!</span>
              </div>

              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                  LLM Function Call Arguments Payload:
                </div>
                <div className="p-3 bg-card border border-border rounded-lg font-mono text-xs text-foreground overflow-auto">
                  <pre>{validationResult.outputPayload}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              <div className="flex items-start gap-2 p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-1">
                    Validation failed ({validationResult.errors.length} error
                    {validationResult.errors.length > 1 ? "s" : ""}):
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
