import { Skeleton } from "../ui/skeleton";

interface ChartSkeletonProps {
  height?: number;
  title?: string;
}

export function ChartSkeleton({ height = 200, title }: ChartSkeletonProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
        background: "var(--bg-surface)",
        borderRadius: "0.5rem",
        border: "1px solid var(--border)",
      }}
    >
      {title && <Skeleton width="40%" height="1rem" />}
      <Skeleton width="100%" height={height} borderRadius="0.375rem" />
    </div>
  );
}
