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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-base font-semibold text-foreground",
            required && "after:content-['*'] after:ml-0.5 after:text-muted-foreground"
          )}
        >
          {label}
        </Label>
      )}
      {children}
      {hint && !error && (
        <p className="text-sm text-muted-foreground leading-snug">{hint}</p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive font-semibold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FormField };
