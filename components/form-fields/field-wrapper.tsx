import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FieldWrapperProps {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FieldWrapper({
  label,
  description,
  htmlFor,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </Label>
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {children}
    </div>
  );
}

