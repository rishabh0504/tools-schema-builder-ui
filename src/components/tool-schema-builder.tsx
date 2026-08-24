"use client";

import React, { forwardRef, useState } from "react";
import { SchemaField, JSONSchemaObject, ValidationError } from "../core/types";
import { useSchemaBuilder, UseSchemaBuilderProps } from "../hooks/use-schema-builder";
import { builderVariants, BuilderVariantProps, ToolSchemaBuilderClassNames } from "../styles/variants";
import { SchemaFieldList } from "./schema-field-list";
import { SchemaPreview } from "./schema-preview";
import { ValidationPanel } from "./validation-panel";
import { ImportDialog } from "./import-dialog";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Badge } from "@/src/components/ui/badge";
import {
  WrenchIcon,
  LayersIcon,
  UploadIcon,
  RotateCcwIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface ToolSchemaBuilderProps extends UseSchemaBuilderProps, BuilderVariantProps {
  name?: string;
  onNameChange?: (name: string) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  strict?: boolean;
  onStrictChange?: (strict: boolean) => void;

  showPreview?: boolean;
  showValidation?: boolean;
  showMetadata?: boolean;

  className?: string;
  classNames?: ToolSchemaBuilderClassNames;
}

export const ToolSchemaBuilder = forwardRef<HTMLDivElement, ToolSchemaBuilderProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onFieldAdd,
      onFieldRemove,
      onFieldUpdate,
      onValidationChange,
      name: externalName,
      onNameChange,
      description: externalDescription,
      onDescriptionChange,
      strict: externalStrict = true,
      onStrictChange,
      variant = "default",
      density = "default",
      showPreview = true,
      showValidation = true,
      showMetadata = true,
      className,
      classNames,
      ...props
    },
    ref
  ) => {
    // Uncontrolled fallback for metadata
    const [internalName, setInternalName] = useState<string>("custom_tool");
    const [internalDescription, setInternalDescription] = useState<string>(
      "Explain the purpose and execution details of this tool."
    );
    const [internalStrict, setInternalStrict] = useState<boolean>(externalStrict);
    const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

    const name = externalName !== undefined ? externalName : internalName;
    const description = externalDescription !== undefined ? externalDescription : internalDescription;
    const strict = externalStrict !== undefined ? externalStrict : internalStrict;

    const handleNameChange = (val: string) => {
      if (onNameChange) onNameChange(val);
      else setInternalName(val);
    };

    const handleDescriptionChange = (val: string) => {
      if (onDescriptionChange) onDescriptionChange(val);
      else setInternalDescription(val);
    };

    const handleStrictChange = (val: boolean) => {
      if (onStrictChange) onStrictChange(val);
      else setInternalStrict(val);
    };

    // Headless logic engine
    const {
      fields,
      jsonSchema,
      errors,
      isValid,
      addField,
      removeField,
      duplicateField,
      importSchema,
      reset,
      setFields,
    } = useSchemaBuilder({
      value,
      defaultValue,
      onChange,
      onFieldAdd,
      onFieldRemove,
      onFieldUpdate,
      onValidationChange,
      strict,
    });

    const errorFieldIds = new Set(errors.map((e) => e.fieldId));

    return (
      <div
        ref={ref}
        className={cn(builderVariants({ variant, density }), classNames?.root, className)}
        {...props}
      >
        {/* Main Grid: Builder vs Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start p-4">
          {/* Builder Left Panel */}
          <div className={cn(showPreview ? "lg:col-span-6 xl:col-span-7" : "lg:col-span-12", "flex flex-col gap-4")}>
            {/* Tool Metadata Card */}
            {showMetadata && (
              <div className="p-4 rounded-xl border border-border bg-card/60 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Tool Definition
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="builder-strict"
                        checked={strict}
                        onCheckedChange={(c) => handleStrictChange(Boolean(c))}
                      />
                      <label
                        htmlFor="builder-strict"
                        className="text-xs text-muted-foreground font-medium select-none cursor-pointer"
                        title="Strict structured schema validation"
                      >
                        Strict
                      </label>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportOpen(true)}
                      className="h-7 gap-1 text-xs bg-background hover:bg-accent"
                    >
                      <UploadIcon className="h-3 w-3" />
                      Import
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={reset}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcwIcon className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Tool Name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. get_weather"
                      className="h-8 mt-1 font-mono text-xs bg-background text-foreground"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Prompt Description Context
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Instruct the model when and how to call this tool..."
                      className="min-h-[50px] mt-1 text-xs bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Validation Notification */}
            {showValidation && errors.length > 0 && (
              <ValidationPanel errors={errors} className={classNames?.validation} />
            )}

            {/* Fields Parameters List */}
            <div className={cn("p-4 rounded-xl border border-border bg-card/60 shadow-2xs space-y-3", classNames?.fieldList)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayersIcon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-heading text-sm font-semibold text-foreground">
                    Parameter Fields
                  </h4>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {fields.length} {fields.length === 1 ? "field" : "fields"}
                  </Badge>
                </div>
              </div>

              <SchemaFieldList
                fields={fields}
                onChange={setFields}
                errorFieldIds={errorFieldIds}
                className={classNames?.field}
              />
            </div>
          </div>

          {/* Schema Preview Right Panel */}
          {showPreview && (
            <div className="lg:col-span-6 xl:col-span-5 h-[calc(100vh-140px)] min-h-[640px] sticky top-20">
              <SchemaPreview
                toolName={name}
                toolDescription={description}
                strict={strict}
                schema={jsonSchema}
                className={classNames?.preview}
              />
            </div>
          )}
        </div>

        {/* Import Modal */}
        <ImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={(imported) => {
            if (imported.title) handleNameChange(imported.title);
            if (imported.description) handleDescriptionChange(imported.description);
            if (imported.strict !== undefined) handleStrictChange(imported.strict);
            setFields(imported.fields);
          }}
        />
      </div>
    );
  }
);

ToolSchemaBuilder.displayName = "ToolSchemaBuilder";
