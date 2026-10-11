import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
        size === "default" ? "py-20 px-8" : "py-10 px-6",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl mb-5",
            "bg-primary/10 border border-primary/20",
            "",
            size === "default" ? "h-16 w-16" : "h-12 w-12",
          )}
        >
          <Icon
            className={cn(
              "text-primary",
              size === "default" ? "h-7 w-7" : "h-5 w-5",
            )}
          />
        </div>
      )}
      <h3
        className={cn(
          "font-display font-semibold text-foreground",
          size === "default" ? "text-lg" : "text-base",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-2 max-w-sm leading-relaxed",
            size === "default" ? "text-sm" : "text-xs",
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className={buttonVariants({ size: "default" })}>
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className={buttonVariants({ size: "default" })}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
