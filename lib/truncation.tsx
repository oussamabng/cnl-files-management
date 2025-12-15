import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { cn } from "./utils";
import React from "react";
type TruncatedTextProps = {
  text?: string | null;
  fallback?: React.ReactNode;
  maxLines?: number;
  tooltip?: "auto" | "always" | "never";
  tooltipTitle?: React.ReactNode;
  className?: string;
};
export function TruncatedText({
  text,
  fallback = (
    <span className="text-muted-foreground italic">Aucune description</span>
  ),
  maxLines = 2,
  tooltip = "auto",
  tooltipTitle,
  className,
}: TruncatedTextProps) {
  const value = (text ?? "").trim();
  const ref = React.useRef<HTMLParagraphElement | null>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  const clampStyle = React.useMemo<React.CSSProperties>(() => {
    if (maxLines <= 1) {
      return {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      };
    }
    return {
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: maxLines,
      overflow: "hidden",
    };
  }, [maxLines]);

  React.useLayoutEffect(() => {
    if (!value) {
      setIsTruncated(false);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const check = () => {
      const truncated =
        maxLines <= 1
          ? el.scrollWidth > el.clientWidth + 1
          : el.scrollHeight > el.clientHeight + 1;

      setIsTruncated(truncated);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => ro.disconnect();
  }, [value, maxLines]);

  if (!value) return <>{fallback}</>;

  const content = (
    <p
      ref={ref}
      className={cn(
        "text-sm",
        maxLines <= 1 ? "" : "whitespace-normal wrap-anywhere",
        className
      )}
      style={clampStyle}
      title={tooltip === "never" ? undefined : value}
    >
      {value}
    </p>
  );

  const showTooltip =
    tooltip === "always" || (tooltip === "auto" && isTruncated);

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-130">
          {tooltipTitle ? <p className="font-medium">{tooltipTitle}</p> : null}
          <p className="text-sm whitespace-normal wrap-anywhere">{value}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
