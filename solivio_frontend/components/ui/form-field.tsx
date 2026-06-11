import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium text-foreground",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField };
