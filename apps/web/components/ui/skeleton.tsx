import { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  borderRadius = "0.375rem",
  style,
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "var(--bg-elevated)",
        backgroundImage:
          "linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
        ...style,
      }}
    />
  );
}
