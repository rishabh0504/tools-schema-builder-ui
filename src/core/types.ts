/**
 * Standard JSON Schema primitive and structural types
 * Note: 'enum' is a constraint, not a standalone type.
 */
export type SchemaFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  description?: string;
  required?: boolean;
  default?: unknown;

  // Enum constraint (valid on string, number, integer)
  enum?: Array<string | number>;

  // Numeric constraints
  minimum?: number;
  maximum?: number;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Object child properties (recursive)
  properties?: SchemaField[];

  // Array item definition (recursive SchemaField)
  items?: SchemaField;
}

export interface JSONSchemaObject {
  $schema?: string;
  type: "object";
  title?: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ValidationError {
  fieldId: string;
  path: string;
  message: string;
}

export interface ToolDefinitionMeta {
  name: string;
  description?: string;
  strict?: boolean;
}
