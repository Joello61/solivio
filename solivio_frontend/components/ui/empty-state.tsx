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

/* Etat vide : dit ce qu'il n'y a pas, et propose quoi faire. */
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
        <Icon
          aria-hidden="true"
          className={cn("mb-4 text-muted-foreground", size === "default" ? "size-8" : "size-6")}
        />
      )}
      <h3
        className={cn(
          "font-display font-bold text-foreground",
          size === "default" ? "text-xl" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-base leading-snug text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link href={action.href} className={buttonVariants()}>
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={buttonVariants()}>
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
