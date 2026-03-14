import { LiveMonitorDashboard } from "@/components/live-monitor-dashboard";
import { getLiveMonitorBootstrap } from "@/lib/api";

export default async function LiveMonitorPage() {
  const initialData = await getLiveMonitorBootstrap();

  return (
    <main>
      <LiveMonitorDashboard initialData={initialData} />
    </main>
  );
}
