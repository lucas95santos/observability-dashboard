import { Shell } from "../../../components/layout/shell";
import { ServiceMetricsView } from "../../../components/charts/service-metrics-view";
import { getMetrics } from "../../../lib/api";
import type { TimeSeriesPoint } from "@repo/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  let initialPoints: TimeSeriesPoint[] = [];
  try {
    const result = await getMetrics(
      id,
      undefined,
      undefined,
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    );
    initialPoints = result.points;
  } catch {
    // render with empty initial data; client will refetch
  }

  return (
    <Shell>
      <ServiceMetricsView serviceId={id} initialPoints={initialPoints} />
    </Shell>
  );
}
