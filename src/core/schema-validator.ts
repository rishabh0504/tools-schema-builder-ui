import { SchemaField, ValidationError } from "./types";

/**
 * Pure validator that checks schema fields for syntax/naming/constraint violations
 */
export function validateSchema(fields: SchemaField[], parentPath = ""): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const path = parentPath ? `${parentPath}.${field.name || `[${i}]`}` : (field.name || `[${i}]`);

    // 1. Missing field name
    if (!field.name.trim()) {
      errors.push({
        fieldId: field.id,
        path,
        message: "Field name is required.",
      });
    } else {
      // 2. Duplicate field name in same object scope
      if (seenNames.has(field.name.trim())) {
        errors.push({
          fieldId: field.id,
          path,
          message: `Duplicate field name "${field.name}" in the same object scope.`,
        });
      }
      seenNames.add(field.name.trim());
    }

    // 3. Enum constraint validations
    if (field.enum !== undefined) {
      if (!Array.isArray(field.enum) || field.enum.length === 0) {
        errors.push({
          fieldId: field.id,
          path,
          message: `Enum constraint on "${field.name || "field"}" must contain at least one value.`,
        });
      }
    }

    // 4. Numeric min/max bounds
    if (field.type === "number" || field.type === "integer") {
      if (
        field.minimum !== undefined &&
        field.maximum !== undefined &&
        field.minimum > field.maximum
      ) {
        errors.push({
          fieldId: field.id,
          path,
          message: `Minimum value (${field.minimum}) cannot be greater than maximum (${field.maximum}).`,
        });
      }
    }

    // 5. String length bounds
    if (field.type === "string") {
      if (
        field.minLength !== undefined &&
        field.maxLength !== undefined &&
        field.minLength > field.maxLength
      ) {
        errors.push({
          fieldId: field.id,
          path,
          message: `minLength (${field.minLength}) cannot be greater than maxLength (${field.maxLength}).`,
        });
      }
    }

    // 6. Object children recursive validation
    if (field.type === "object" && field.properties) {
      errors.push(...validateSchema(field.properties, path));
    }

    // 7. Array items validation
    if (field.type === "array" && field.items) {
      if (field.items.type === "object" && field.items.properties) {
        errors.push(...validateSchema(field.items.properties, `${path}[]`));
      }
    }
  }

  return errors;
}
