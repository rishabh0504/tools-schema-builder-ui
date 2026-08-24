import { useState, useCallback, useMemo } from "react";
import { SchemaField, JSONSchemaObject, ValidationError } from "../core/types";
import { toJSONSchema, fromJSONSchema } from "../core/schema-transformer";
import { validateSchema } from "../core/schema-validator";
import { createField, DEFAULT_WEATHER_SCHEMA } from "../core/defaults";

export interface UseSchemaBuilderProps {
  value?: SchemaField[] | JSONSchemaObject;
  defaultValue?: SchemaField[] | JSONSchemaObject;
  onChange?: (schema: JSONSchemaObject, fields: SchemaField[]) => void;
  onFieldAdd?: (field: SchemaField) => void;
  onFieldRemove?: (fieldId: string) => void;
  onFieldUpdate?: (field: SchemaField) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
  strict?: boolean;
}

export function useSchemaBuilder({
  value,
  defaultValue,
  onChange,
  onFieldAdd,
  onFieldRemove,
  onFieldUpdate,
  onValidationChange,
  strict = false,
}: UseSchemaBuilderProps = {}) {
  // Normalize initial value
  const initialFields = useMemo(() => {
    const target = value || defaultValue;
    if (!target) return DEFAULT_WEATHER_SCHEMA;
    if (Array.isArray(target)) return target;
    return fromJSONSchema(target).fields;
  }, []);

  const [internalFields, setInternalFields] = useState<SchemaField[]>(initialFields);

  // Controlled vs Uncontrolled resolution
  const fields = useMemo(() => {
    if (value) {
      if (Array.isArray(value)) return value;
      return fromJSONSchema(value).fields;
    }
    return internalFields;
  }, [value, internalFields]);

  // Derived JSON Schema
  const jsonSchema = useMemo(() => {
    return toJSONSchema(fields, { strict, includeSchemaDraft: true });
  }, [fields, strict]);

  // Validation
  const errors = useMemo(() => {
    const errs = validateSchema(fields);
    if (onValidationChange) onValidationChange(errs);
    return errs;
  }, [fields, onValidationChange]);

  // Notify parent of state change
  const triggerChange = useCallback(
    (newFields: SchemaField[]) => {
      if (!value) {
        setInternalFields(newFields);
      }
      if (onChange) {
        const nextJsonSchema = toJSONSchema(newFields, { strict, includeSchemaDraft: true });
        onChange(nextJsonSchema, newFields);
      }
    },
    [value, onChange, strict]
  );

  const addField = useCallback(
    (overrides: Partial<SchemaField> = {}) => {
      const field = createField("", "string", overrides);
      const next = [...fields, field];
      triggerChange(next);
      if (onFieldAdd) onFieldAdd(field);
      return field;
    },
    [fields, triggerChange, onFieldAdd]
  );

  const updateField = useCallback(
    (id: string, updated: Partial<SchemaField>) => {
      function updateInTree(list: SchemaField[]): SchemaField[] {
        return list.map((f) => {
          if (f.id === id) {
            const nextField = { ...f, ...updated };
            if (onFieldUpdate) onFieldUpdate(nextField);
            return nextField;
          }
          if (f.properties) {
            return { ...f, properties: updateInTree(f.properties) };
          }
          if (f.items && f.items.id === id) {
            const nextItem = { ...f.items, ...updated };
            if (onFieldUpdate) onFieldUpdate(nextItem);
            return { ...f, items: nextItem };
          }
          return f;
        });
      }

      const next = updateInTree(fields);
      triggerChange(next);
    },
    [fields, triggerChange, onFieldUpdate]
  );

  const removeField = useCallback(
    (id: string) => {
      function removeFromTree(list: SchemaField[]): SchemaField[] {
        return list
          .filter((f) => f.id !== id)
          .map((f) => ({
            ...f,
            properties: f.properties ? removeFromTree(f.properties) : undefined,
          }));
      }

      const next = removeFromTree(fields);
      triggerChange(next);
      if (onFieldRemove) onFieldRemove(id);
    },
    [fields, triggerChange, onFieldRemove]
  );

  const duplicateField = useCallback(
    (id: string) => {
      const index = fields.findIndex((f) => f.id === id);
      if (index === -1) return;

      const original = fields[index];
      const duplicated: SchemaField = JSON.parse(JSON.stringify(original));
      duplicated.id = "f_" + Math.random().toString(36).substring(2, 9);
      duplicated.name = `${original.name}_copy`;

      const next = [...fields];
      next.splice(index + 1, 0, duplicated);
      triggerChange(next);
    },
    [fields, triggerChange]
  );

  const importSchema = useCallback(
    (schemaObject: Record<string, any>) => {
      const { fields: parsedFields } = fromJSONSchema(schemaObject);
      triggerChange(parsedFields);
    },
    [triggerChange]
  );

  const reset = useCallback(() => {
    triggerChange([]);
  }, [triggerChange]);

  return {
    fields,
    jsonSchema,
    errors,
    isValid: errors.length === 0,
    addField,
    updateField,
    removeField,
    duplicateField,
    importSchema,
    reset,
    setFields: triggerChange,
  };
}
