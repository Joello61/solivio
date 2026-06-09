import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:[background:linear-gradient(90deg,transparent_0%,oklch(from_var(--color-muted-foreground)_l_c_h/0.08)_50%,transparent_100%)]",
        "before:bg-[length:200%_100%]",
        "before:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
