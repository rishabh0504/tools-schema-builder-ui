"use client";

import React from "react";
import { SchemaField } from "../core/types";
import { SchemaFieldItem } from "./schema-field";
import { Button } from "@/src/components/ui/button";
import { PlusIcon } from "lucide-react";
import { createField } from "../core/defaults";

interface SchemaFieldListProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  depth?: number;
  className?: string;
  errorFieldIds?: Set<string>;
}

export function SchemaFieldList({
  fields,
  onChange,
  depth = 0,
  className = "",
  errorFieldIds = new Set(),
}: SchemaFieldListProps) {
  const handleAddField = () => {
    onChange([...fields, createField()]);
  };

  const handleUpdateField = (index: number, updated: Partial<SchemaField>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const handleDeleteField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleDuplicateField = (index: number) => {
    const original = fields[index];
    const duplicated: SchemaField = JSON.parse(JSON.stringify(original));
    duplicated.id = "f_" + Math.random().toString(36).substring(2, 9);
    duplicated.name = `${original.name}_copy`;

    const next = [...fields];
    next.splice(index + 1, 0, duplicated);
    onChange(next);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-background/40 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {depth === 0
              ? "No parameters defined yet. Add fields to define your tool arguments."
              : "No child properties in this object."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddField}
            className="gap-1.5 text-xs bg-background hover:bg-accent text-foreground"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Property
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <SchemaFieldItem
              key={field.id || idx}
              field={field}
              onUpdate={(updated) => handleUpdateField(idx, updated)}
              onDelete={() => handleDeleteField(idx)}
              onDuplicate={() => handleDuplicateField(idx)}
              depth={depth}
              hasError={errorFieldIds.has(field.id)}
            />
          ))}

          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddField}
              className="w-full border-dashed gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-background hover:bg-muted"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Property
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
