"use client";

import React, { useState } from "react";
import { SchemaField, SchemaFieldType } from "../core/types";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  Trash2Icon,
  Settings2Icon,
  ListFilterIcon,
} from "lucide-react";
import { EnumEditor } from "./enum-editor";
import { SchemaFieldList } from "./schema-field-list";
import { createField } from "../core/defaults";

interface SchemaFieldProps {
  field: SchemaField;
  onUpdate: (updated: Partial<SchemaField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
  className?: string;
  hasError?: boolean;
}

const FIELD_TYPES: { value: SchemaFieldType; label: string }[] = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "integer", label: "integer" },
  { value: "boolean", label: "boolean" },
  { value: "object", label: "object" },
  { value: "array", label: "array" },
  { value: "null", label: "null" },
];

export function SchemaFieldItem({
  field,
  onUpdate,
  onDelete,
  onDuplicate,
  depth = 0,
  className = "",
  hasError = false,
}: SchemaFieldProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const handleTypeChange = (newType: SchemaFieldType) => {
    const update: Partial<SchemaField> = { type: newType };

    if (newType === "object" && !field.properties) {
      update.properties = [];
    }

    if (newType === "array" && !field.items) {
      update.items = createField("item", "string");
    }

    // Reset enum if switching away from string/number/integer
    if (newType !== "string" && newType !== "number" && newType !== "integer") {
      update.enum = undefined;
    }

    onUpdate(update);
  };

  const isContainer =
    field.type === "object" ||
    (field.type === "array" && field.items?.type === "object");

  return (
    <div
      className={`group flex flex-col border rounded-lg transition-all duration-150 shadow-2xs ${
        hasError
          ? "border-destructive/80 bg-destructive/5"
          : "border-border/80 bg-card hover:border-border"
      } ${className}`}
    >
      {/* Primary Row Controls */}
      <div className="row-pad flex flex-wrap items-center gap-2 p-2.5 sm:flex-nowrap">
        {/* Collapse chevron for nested objects/arrays */}
        {isContainer ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse child properties" : "Expand child properties"}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-7 shrink-0" />
        )}

        {/* Field Name */}
        <div className="flex-1 min-w-[130px]">
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="param_name"
            className="h-8 font-mono text-xs font-medium bg-background text-foreground"
          />
        </div>

        {/* Type Selector */}
        <div className="w-[110px] shrink-0">
          <Select
            value={field.type}
            onValueChange={(val) => handleTypeChange(val as SchemaFieldType)}
          >
            <SelectTrigger size="sm" className="h-8 w-full font-mono text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Array Item Type Selector (if type === 'array') */}
        {field.type === "array" && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground font-mono">of</span>
            <Select
              value={field.items?.type || "string"}
              onValueChange={(val) => {
                const itemType = val as SchemaFieldType;
                onUpdate({
                  items: createField("item", itemType, {
                    properties: itemType === "object" ? [] : undefined,
                  }),
                });
              }}
            >
              <SelectTrigger size="sm" className="h-8 w-[95px] font-mono text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string" className="font-mono text-xs">string</SelectItem>
                <SelectItem value="number" className="font-mono text-xs">number</SelectItem>
                <SelectItem value="integer" className="font-mono text-xs">integer</SelectItem>
                <SelectItem value="boolean" className="font-mono text-xs">boolean</SelectItem>
                <SelectItem value="object" className="font-mono text-xs">object</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description Input */}
        <div className="flex-2 min-w-[170px]">
          <Input
            value={field.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Field description for LLM..."
            className="h-8 text-xs bg-background text-foreground"
          />
        </div>

        {/* Required Checkbox */}
        <div className="flex items-center gap-1.5 px-1 shrink-0">
          <Checkbox
            id={`req-${field.id}`}
            checked={field.required ?? false}
            onCheckedChange={(checked) => onUpdate({ required: Boolean(checked) })}
          />
          <label
            htmlFor={`req-${field.id}`}
            className="text-xs text-muted-foreground font-medium select-none cursor-pointer"
          >
            Req
          </label>
        </div>

        {/* Row Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Enum constraint fast toggle */}
          {(field.type === "string" || field.type === "number" || field.type === "integer") && (
            <Button
              type="button"
              variant={field.enum && field.enum.length > 0 ? "secondary" : "ghost"}
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (!field.enum) {
                  onUpdate({ enum: ["option_1", "option_2"] });
                  setShowSettings(true);
                } else {
                  setShowSettings(!showSettings);
                }
              }}
              title="Enum Choices"
            >
              <ListFilterIcon className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Advanced Constraints */}
          <Button
            type="button"
            variant={showSettings ? "secondary" : "ghost"}
            size="icon-sm"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowSettings(!showSettings)}
            title="Constraints & Defaults"
          >
            <Settings2Icon className="h-3.5 w-3.5" />
          </Button>

          {/* Duplicate */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onDuplicate}
            title="Duplicate Field"
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </Button>

          {/* Delete */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete Field"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showSettings && (
        <div className="border-t border-border bg-muted/30 p-3 text-xs space-y-3 rounded-b-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Default Value */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Default Value
              </label>
              <Input
                value={field.default !== undefined ? String(field.default) : ""}
                onChange={(e) =>
                  onUpdate({
                    default:
                      field.type === "number" || field.type === "integer"
                        ? e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                        : field.type === "boolean"
                        ? e.target.value === "true"
                        : e.target.value,
                  })
                }
                placeholder={field.type === "boolean" ? "true / false" : "e.g. default_value"}
                className="h-7 mt-1 text-xs bg-background"
              />
            </div>

            {/* Min / Max constraints */}
            {(field.type === "number" || field.type === "integer") && (
              <>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Minimum
                  </label>
                  <Input
                    type="number"
                    value={field.minimum ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        minimum: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="Min value"
                    className="h-7 mt-1 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Maximum
                  </label>
                  <Input
                    type="number"
                    value={field.maximum ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        maximum: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="Max value"
                    className="h-7 mt-1 text-xs bg-background"
                  />
                </div>
              </>
            )}

            {field.type === "string" && (
              <>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Min Length
                  </label>
                  <Input
                    type="number"
                    value={field.minLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        minLength: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 1"
                    className="h-7 mt-1 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Max Length
                  </label>
                  <Input
                    type="number"
                    value={field.maxLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        maxLength: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 255"
                    className="h-7 mt-1 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Regex Pattern
                  </label>
                  <Input
                    value={field.pattern ?? ""}
                    onChange={(e) => onUpdate({ pattern: e.target.value || undefined })}
                    placeholder="^[a-zA-Z0-9]+$"
                    className="h-7 mt-1 font-mono text-xs bg-background"
                  />
                </div>
              </>
            )}
          </div>

          {/* Enum constraint manager */}
          {(field.type === "string" || field.type === "number" || field.type === "integer") && (
            <div className="pt-2 border-t border-border/60">
              <EnumEditor
                values={field.enum}
                type={field.type as any}
                onChange={(values) => onUpdate({ enum: values.length > 0 ? values : undefined })}
              />
            </div>
          )}
        </div>
      )}

      {/* Recursive Child Properties (For Object or Array of Objects) */}
      {isContainer && isExpanded && (
        <div className="border-t border-border/80 bg-muted/15 p-3 rounded-b-lg space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {field.type === "object"
              ? `Object Properties ('${field.name || "unnamed"}')`
              : `Array Object Item Properties ('${field.name || "unnamed"}')`}
          </div>

          <SchemaFieldList
            fields={
              field.type === "object"
                ? field.properties || []
                : field.items?.properties || []
            }
            onChange={(newProps) => {
              if (field.type === "object") {
                onUpdate({ properties: newProps });
              } else if (field.items) {
                onUpdate({ items: { ...field.items, properties: newProps } });
              }
            }}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}
