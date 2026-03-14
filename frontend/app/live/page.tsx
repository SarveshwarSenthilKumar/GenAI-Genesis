import { LiveMonitorDashboard } from "@/components/live-monitor-dashboard";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getLiveMonitorBootstrap } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  try {
    const initialData = await getLiveMonitorBootstrap();

    return (
      <main>
        <LiveMonitorDashboard initialData={initialData} />
      </main>
    );
  } catch {
    return (
      <ServiceUnavailable
        title="Live monitor unavailable"
        message="Sentinel could not load the live monitor right now. This usually means the API is not running yet, is still warming up, or the frontend cannot reach it."
      />
    );
  }
}
