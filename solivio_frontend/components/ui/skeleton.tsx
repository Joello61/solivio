import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted",
        "before:absolute before:inset-0",
        "before:[background:linear-gradient(90deg,transparent_25%,color-mix(in_oklch,var(--card)_50%,transparent)_50%,transparent_75%)]",
        "before:bg-[length:200%_100%]",
        "before:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
