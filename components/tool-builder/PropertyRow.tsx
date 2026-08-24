"use client";

import React, { useState } from "react";
import { SchemaProperty, SchemaPropertyType } from "@/lib/schema-types";
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
import {
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  Settings2Icon,
  CopyIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { PropertyTree } from "./PropertyTree";

interface PropertyRowProps {
  property: SchemaProperty;
  onUpdate: (updated: SchemaProperty) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth?: number;
}

const PROPERTY_TYPES: { value: SchemaPropertyType; label: string }[] = [
  { value: "string", label: "string" },
  { value: "number", label: "number" },
  { value: "integer", label: "integer" },
  { value: "boolean", label: "boolean" },
  { value: "array", label: "array" },
  { value: "object", label: "object" },
  { value: "enum", label: "enum" },
];

export function PropertyRow({
  property,
  onUpdate,
  onDelete,
  onDuplicate,
  depth = 0,
}: PropertyRowProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [newEnumTag, setNewEnumTag] = useState("");

  const handleTypeChange = (newType: SchemaPropertyType) => {
    const updated: SchemaProperty = {
      ...property,
      type: newType,
    };

    if (newType === "enum" && (!updated.enumOptions || updated.enumOptions.length === 0)) {
      updated.enumOptions = ["option_1", "option_2"];
    }

    if (newType === "array") {
      updated.itemType = updated.itemType || "string";
      if (updated.itemType === "object" && !updated.itemProperties) {
        updated.itemProperties = [];
      }
    }

    if (newType === "object" && !updated.properties) {
      updated.properties = [];
    }

    onUpdate(updated);
  };

  const handleAddEnum = () => {
    if (!newEnumTag.trim()) return;
    const current = property.enumOptions || [];
    if (!current.includes(newEnumTag.trim())) {
      onUpdate({
        ...property,
        enumOptions: [...current, newEnumTag.trim()],
      });
    }
    setNewEnumTag("");
  };

  const handleRemoveEnum = (tag: string) => {
    onUpdate({
      ...property,
      enumOptions: (property.enumOptions || []).filter((t) => t !== tag),
    });
  };

  const hasNestedChildren =
    property.type === "object" ||
    (property.type === "array" && property.itemType === "object");

  return (
    <div className="group flex flex-col border border-border/80 bg-card rounded-lg transition-all duration-150 shadow-xs hover:border-border">
      {/* Main Row Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-2.5 sm:flex-nowrap">
        {/* Expand/Collapse Chevron for objects or arrays */}
        {hasNestedChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse nested properties" : "Expand nested properties"}
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

        {/* Property Name */}
        <div className="flex-1 min-w-[140px]">
          <Input
            value={property.name}
            onChange={(e) => onUpdate({ ...property, name: e.target.value })}
            placeholder="param_name"
            className="h-8 font-mono text-xs font-medium bg-background text-foreground"
          />
        </div>

        {/* Property Type Selector */}
        <div className="w-[120px] shrink-0">
          <Select
            value={property.type}
            onValueChange={(val) => handleTypeChange(val as SchemaPropertyType)}
          >
            <SelectTrigger size="sm" className="h-8 w-full font-mono text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* If Array: Item Type selector */}
        {property.type === "array" && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground font-mono">of</span>
            <Select
              value={property.itemType || "string"}
              onValueChange={(val) =>
                onUpdate({
                  ...property,
                  itemType: val as SchemaPropertyType,
                  itemProperties: val === "object" ? property.itemProperties || [] : undefined,
                })
              }
            >
              <SelectTrigger size="sm" className="h-8 w-[100px] font-mono text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string" className="font-mono text-xs">string</SelectItem>
                <SelectItem value="number" className="font-mono text-xs">number</SelectItem>
                <SelectItem value="integer" className="font-mono text-xs">integer</SelectItem>
                <SelectItem value="boolean" className="font-mono text-xs">boolean</SelectItem>
                <SelectItem value="enum" className="font-mono text-xs">enum</SelectItem>
                <SelectItem value="object" className="font-mono text-xs">object</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Property Description */}
        <div className="flex-2 min-w-[180px]">
          <Input
            value={property.description}
            onChange={(e) => onUpdate({ ...property, description: e.target.value })}
            placeholder="Field description for LLM..."
            className="h-8 text-xs bg-background text-foreground"
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center gap-1.5 px-1 shrink-0">
          <Checkbox
            id={`req-${property.id}`}
            checked={property.required}
            onCheckedChange={(checked) =>
              onUpdate({ ...property, required: Boolean(checked) })
            }
          />
          <label
            htmlFor={`req-${property.id}`}
            className="text-xs text-muted-foreground font-medium select-none cursor-pointer"
          >
            Req
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Advanced Constraints toggle */}
          <Button
            type="button"
            variant={showAdvanced ? "secondary" : "ghost"}
            size="icon-sm"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Constraints & Options"
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

      {/* Advanced Constraints Drawer */}
      {showAdvanced && (
        <div className="border-t border-border bg-muted/40 p-3 text-xs space-y-3 rounded-b-lg">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Default Value */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Default Value
              </label>
              <Input
                value={property.default !== undefined ? String(property.default) : ""}
                onChange={(e) =>
                  onUpdate({
                    ...property,
                    default:
                      property.type === "number" || property.type === "integer"
                        ? e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                        : property.type === "boolean"
                        ? e.target.value === "true"
                        : e.target.value,
                  })
                }
                placeholder={property.type === "boolean" ? "true / false" : "e.g. 10"}
                className="h-7 mt-1 text-xs bg-background"
              />
            </div>

            {/* Min / MinLength */}
            {(property.type === "number" || property.type === "integer") && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Minimum Value
                </label>
                <Input
                  type="number"
                  value={property.minimum ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      ...property,
                      minimum: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="e.g. 0"
                  className="h-7 mt-1 text-xs bg-background"
                />
              </div>
            )}

            {(property.type === "number" || property.type === "integer") && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Maximum Value
                </label>
                <Input
                  type="number"
                  value={property.maximum ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      ...property,
                      maximum: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  placeholder="e.g. 100"
                  className="h-7 mt-1 text-xs bg-background"
                />
              </div>
            )}

            {property.type === "string" && (
              <>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Min Length
                  </label>
                  <Input
                    type="number"
                    value={property.minLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        ...property,
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
                    value={property.maxLength ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        ...property,
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
                    value={property.pattern ?? ""}
                    onChange={(e) =>
                      onUpdate({
                        ...property,
                        pattern: e.target.value === "" ? undefined : e.target.value,
                      })
                    }
                    placeholder="^[a-zA-Z0-9_-]+$"
                    className="h-7 mt-1 font-mono text-xs bg-background"
                  />
                </div>
              </>
            )}
          </div>

          {/* Enum Values Manager */}
          {(property.type === "enum" || (property.type === "array" && property.itemType === "enum")) && (
            <div className="pt-2 border-t border-border/60">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                Allowed Enum Options
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {(property.type === "enum" ? property.enumOptions || [] : property.itemEnumOptions || []).map(
                  (opt) => (
                    <Badge
                      key={opt}
                      variant="secondary"
                      className="gap-1 font-mono text-xs py-0.5 px-2 bg-secondary text-secondary-foreground"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() =>
                          property.type === "enum"
                            ? handleRemoveEnum(opt)
                            : onUpdate({
                                ...property,
                                itemEnumOptions: (property.itemEnumOptions || []).filter((o) => o !== opt),
                              })
                        }
                        className="hover:text-destructive focus:outline-none"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                )}
              </div>
              <div className="flex items-center gap-1.5 max-w-sm">
                <Input
                  value={newEnumTag}
                  onChange={(e) => setNewEnumTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEnum();
                    }
                  }}
                  placeholder="Type choice and press Enter..."
                  className="h-7 text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEnum}
                  className="h-7 text-xs"
                >
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recursive Children (For Object or Array of Objects) */}
      {hasNestedChildren && isExpanded && (
        <div className="border-t border-border/80 bg-muted/20 p-3 rounded-b-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {property.type === "object"
                ? `Properties of '${property.name || "object"}'`
                : `Item Properties of '${property.name || "array"}'`}
            </span>
          </div>

          <PropertyTree
            properties={
              property.type === "object"
                ? property.properties || []
                : property.itemProperties || []
            }
            onChange={(newProps) => {
              if (property.type === "object") {
                onUpdate({ ...property, properties: newProps });
              } else {
                onUpdate({ ...property, itemProperties: newProps });
              }
            }}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}
