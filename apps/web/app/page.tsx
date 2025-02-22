import { Shell } from "../components/layout/shell";
import { RealtimeDashboard } from "../components/dashboard/realtime-dashboard";
import { getServices } from "../lib/api";
import type { ServiceMetrics } from "@repo/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialServices: ServiceMetrics[] = [];
  try {
    initialServices = await getServices(
      process.env.API_URL ?? "http://localhost:3001",
    );
  } catch {
    // mock-api may not be running in build/test; render empty state
  }

  return (
    <Shell>
      <RealtimeDashboard initialServices={initialServices} />
    </Shell>
  );
}
