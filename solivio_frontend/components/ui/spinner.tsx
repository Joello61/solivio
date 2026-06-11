import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
}

function Spinner({ className, size = "default" }: SpinnerProps) {
  return (
    <svg
      className={cn(
        "animate-spin text-current shrink-0",
        size === "xs" && "h-3 w-3",
        size === "sm" && "h-3.5 w-3.5",
        size === "default" && "h-4 w-4",
        size === "lg" && "h-5 w-5",
        size === "xl" && "h-7 w-7",
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export { Spinner };
