import { cva, type VariantProps } from "class-variance-authority";

export const builderVariants = cva("w-full transition-colors", {
  variants: {
    variant: {
      default: "border border-border rounded-xl bg-card text-card-foreground shadow-2xs",
      card: "border border-border rounded-2xl bg-card text-card-foreground shadow-sm",
      ghost: "border-0 bg-transparent text-foreground shadow-none",
    },
    density: {
      compact: "text-xs [&_input]:h-7 [&_button]:h-7 [&_.row-pad]:p-2",
      default: "text-sm [&_input]:h-8 [&_button]:h-8 [&_.row-pad]:p-2.5",
      comfortable: "text-base [&_input]:h-9 [&_button]:h-9 [&_.row-pad]:p-3.5",
    },
  },
  defaultVariants: {
    variant: "default",
    density: "default",
  },
});

export type BuilderVariantProps = VariantProps<typeof builderVariants>;

export interface ToolSchemaBuilderClassNames {
  root?: string;
  toolbar?: string;
  fieldList?: string;
  field?: string;
  fieldHeader?: string;
  preview?: string;
  validation?: string;
}
