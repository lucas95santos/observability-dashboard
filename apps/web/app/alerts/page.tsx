import { Shell } from "../../components/layout/shell";
import { AlertsPanel } from "../../components/alerts/alerts-panel";
import { getAlerts } from "../../lib/api";
import type { Alert } from "@repo/types";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  let initialAlerts: Alert[] = [];
  try {
    initialAlerts = await getAlerts(
      undefined,
      process.env.API_URL ?? "http://localhost:3001",
    );
  } catch {
    // render empty state if api unreachable
  }

  return (
    <Shell>
      <AlertsPanel initialAlerts={initialAlerts} />
    </Shell>
  );
}
