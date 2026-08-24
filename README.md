# Tool Schema Builder (`tool-schema-builder`)

A headless-ready, beautifully themed **AI Tool & JSON Schema Visual Builder** built for the **shadcn/ui** and Tailwind CSS ecosystem.

Build, edit, validate, and export structured outputs for **OpenAI, Anthropic Claude, Google Gemini, Model Context Protocol (MCP), and Zod**.

---

## ⚡️ Key Architectural Features

- **100% Native Shadcn/UI Theming**: Inherits your host application's CSS variables, border-radius, typography, and dark mode automatically. Zero hardcoded colors.
- **Dual Subpath Exports**:
  - `tool-schema-builder` & `tool-schema-builder/react`: React components and hooks with `"use client"`.
  - `tool-schema-builder/core`: Pure TypeScript schema transformer, validator, adapters, and types (**zero React/DOM dependencies, 100% server/edge/Node compatible**).
- **Strict JSON Schema Alignment**: `enum` is modeled as a constraint on `string`, `number`, and `integer` fields rather than a synthetic type.
- **Recursive Nested Support**: Deeply nested `object` children and `array` item schemas (primitives, enums, or nested objects).
- **Multi-Format Exporters**: Real-time icon-only tabs for standard JSON Schema (Draft-07), OpenAI Function Calling, Anthropic Claude Tool Use, Google Gemini, MCP, and TypeScript Zod schemas.
- **Bidirectional Schema Importer**: Reverse-reconstruct the visual builder by pasting existing JSON Schemas or AI tool configurations.

---

## 📦 Installation

```bash
pnpm add tool-schema-builder
# or
npm install tool-schema-builder
```

---

## 🎨 Tailwind CSS Integration

To ensure Tailwind scans the semantic classes inside the compiled package:

### For Tailwind CSS v4 (`app/globals.css`)
```css
@import "tailwindcss";
@source "../node_modules/tool-schema-builder/dist";
```

### For Tailwind CSS v3 (`tailwind.config.js`)
```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/tool-schema-builder/dist/**/*.{js,mjs,cjs}",
  ],
};
```

---

## 🚀 Usage Guide

### 1. React UI Usage (Client Component)

```tsx
"use client";

import { ToolSchemaBuilder } from "tool-schema-builder";
import { useState } from "react";

export function ToolEditor() {
  const [schema, setSchema] = useState({
    type: "object",
    properties: {
      location: { type: "string", description: "City or postal code" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  });

  return (
    <ToolSchemaBuilder
      value={schema}
      onChange={(nextJsonSchema) => setSchema(nextJsonSchema)}
      variant="card" // "default" | "card" | "ghost"
      density="default" // "compact" | "default" | "comfortable"
      showPreview
      showValidation
    />
  );
}
```

### 2. Pure Core Usage (Server / Node / Edge / API Routes)

```ts
import {
  toJSONSchema,
  fromJSONSchema,
  validateSchema,
  toOpenAITool,
  toAnthropicTool,
  toMCPTool,
  toZodCode,
} from "tool-schema-builder/core";

// 1. Convert SchemaField[] to JSON Schema Draft-07
const jsonSchema = toJSONSchema(fields, { strict: true });

// 2. Validate field constraints and duplicate names
const errors = validateSchema(fields);

// 3. Parse JSON Schema or OpenAI function definition into UI fields
const { fields: parsedFields } = fromJSONSchema(jsonSchema);

// 4. Generate vendor-specific tool format
const openAITool = toOpenAITool("search_kb", jsonSchema);
```

### 3. Headless State Hook (`useSchemaBuilder`)

```tsx
import { useSchemaBuilder } from "tool-schema-builder/react";

export function CustomBuilder() {
  const {
    fields,
    jsonSchema,
    errors,
    isValid,
    addField,
    removeField,
    updateField,
  } = useSchemaBuilder({
    onChange: (json) => console.log("Updated schema:", json),
  });

  return (
    <div>
      <button onClick={() => addField({ name: "query", type: "string" })}>
        Add Parameter
      </button>
      <pre>{JSON.stringify(jsonSchema, null, 2)}</pre>
    </div>
  );
}
```

---

## 📄 License

MIT © [Rishabh](https://github.com/rishabh0504)
