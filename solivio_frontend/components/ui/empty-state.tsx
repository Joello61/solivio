import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
  size?: "sm" | "default";
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "default" ? "py-16 px-6" : "py-8 px-4",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-muted mb-4",
            size === "default" ? "h-16 w-16" : "h-12 w-12",
          )}
        >
          <Icon
            className={cn(
              "text-muted-foreground/60",
              size === "default" ? "h-8 w-8" : "h-6 w-6",
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-foreground",
          size === "default" ? "text-base" : "text-sm",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-xs",
            size === "default" ? "text-sm" : "text-xs",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a href={action.href}>
              <Button size="sm">{action.label}</Button>
            </a>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
