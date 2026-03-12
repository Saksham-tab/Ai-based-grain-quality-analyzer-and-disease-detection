import { cn } from "@/lib/utils";

type AiLoadingProps = {
  className?: string;
  lines?: number;
};

export function AiLoading({ className, lines = 3 }: AiLoadingProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <div className="ai-loading-shimmer h-4 w-28 rounded-full" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "ai-loading-shimmer h-3 rounded-full",
            i === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
