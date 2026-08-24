"use client";

import React from "react";
import { SchemaProperty } from "@/lib/schema-types";
import { PropertyRow } from "./PropertyRow";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface PropertyTreeProps {
  properties: SchemaProperty[];
  onChange: (properties: SchemaProperty[]) => void;
  depth?: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function PropertyTree({
  properties,
  onChange,
  depth = 0,
}: PropertyTreeProps) {
  const handleAddProperty = () => {
    const newProp: SchemaProperty = {
      id: generateId(),
      name: "",
      type: "string",
      description: "",
      required: true,
    };
    onChange([...properties, newProp]);
  };

  const handleUpdateProperty = (index: number, updated: SchemaProperty) => {
    const next = [...properties];
    next[index] = updated;
    onChange(next);
  };

  const handleDeleteProperty = (index: number) => {
    const next = properties.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleDuplicateProperty = (index: number) => {
    const original = properties[index];
    const duplicated: SchemaProperty = JSON.parse(JSON.stringify(original));
    duplicated.id = generateId();
    duplicated.name = `${original.name}_copy`;

    const next = [...properties];
    next.splice(index + 1, 0, duplicated);
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-background/50 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {depth === 0
              ? "No parameters defined yet. Add fields to define your tool arguments."
              : "No child properties in this object."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddProperty}
            className="gap-1.5 text-xs bg-background hover:bg-accent text-foreground"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Property
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {properties.map((prop, idx) => (
            <PropertyRow
              key={prop.id || idx}
              property={prop}
              onUpdate={(updated) => handleUpdateProperty(idx, updated)}
              onDelete={() => handleDeleteProperty(idx)}
              onDuplicate={() => handleDuplicateProperty(idx)}
              depth={depth}
            />
          ))}

          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProperty}
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
