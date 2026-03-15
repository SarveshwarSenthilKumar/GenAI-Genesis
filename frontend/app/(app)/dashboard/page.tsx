import { IncidentQueueWorkspace } from "@/components/incident-queue-workspace";
import { ServiceUnavailable } from "@/components/service-unavailable";
import { getIncidentQueue } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  try {
    const queue = await getIncidentQueue();

    return (
      <main>
        <IncidentQueueWorkspace initialQueue={queue} />
      </main>
    );
  } catch {
    return (
      <ServiceUnavailable
        title="Queue unavailable"
        message="Sentinel could not load the incident queue right now. This usually means the API is not running yet, is still warming up, or the frontend cannot reach it."
      />
    );
  }
}
