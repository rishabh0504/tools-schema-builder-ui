import { SchemaField, SchemaFieldType, JSONSchemaObject } from "./types";

export function createField(
  name = "",
  type: SchemaFieldType = "string",
  overrides: Partial<SchemaField> = {}
): SchemaField {
  return {
    id: "f_" + Math.random().toString(36).substring(2, 9),
    name,
    type,
    required: true,
    ...overrides,
  };
}

export const DEFAULT_WEATHER_SCHEMA: SchemaField[] = [
  createField("city", "string", {
    description: "The city for which weather should be retrieved",
    required: true,
    minLength: 1,
  }),
  createField("units", "string", {
    description: "Temperature measurement units",
    required: false,
    enum: ["celsius", "fahrenheit"],
    default: "celsius",
  }),
];
