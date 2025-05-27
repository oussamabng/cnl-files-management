"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function Loading({
  variant = "spinner",
  size = "md",
  className,
  text,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-muted border-t-primary",
            sizeClasses[size]
          )}
        />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex space-x-1">
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
            )}
            style={{ animationDelay: "0ms" }}
          />
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
            )}
            style={{ animationDelay: "150ms" }}
          />
          <div
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
            )}
            style={{ animationDelay: "300ms" }}
          />
        </div>
        {text && (
          <span className="text-sm text-muted-foreground ml-2">{text}</span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div
          className={cn(
            "rounded-full bg-primary animate-pulse",
            sizeClasses[size]
          )}
        />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
    );
  }

  return null;
}

// Specialized loading components
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/6" />
          <div className="h-4 bg-muted animate-pulse rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
      <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
        <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
      </div>
    </div>
  );
}

export function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-muted animate-pulse rounded w-20" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-8 bg-muted animate-pulse rounded w-16" />
          <div className="h-3 bg-muted animate-pulse rounded w-24" />
        </div>
      ))}
    </div>
  );
}
