import type {
  ChatMessage,
  BehaviorProfile,
  DashboardSummary,
  GraphResponse,
  IncidentChatResponse,
  IncidentDetailResponse,
  IncidentPanelResponse,
  IncidentQueueResponse,
  LiveMonitorPayload,
  ScoredTransaction,
  TransactionChatResponse,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return getJson<DashboardSummary>("/api/dashboard/summary");
}

export function getIncidentQueue(): Promise<IncidentQueueResponse> {
  return getJson<IncidentQueueResponse>("/api/incidents/queue");
}

export function refreshIncidentQueue(batch = 4): Promise<IncidentQueueResponse> {
  return getJson<IncidentQueueResponse>(`/api/incidents/refresh?batch=${batch}`);
}

export function getIncidentPanel(id: string): Promise<IncidentPanelResponse> {
  return getJson<IncidentPanelResponse>(`/api/incidents/${id}/panel`);
}

export function getIncidentDetail(id: string): Promise<IncidentDetailResponse> {
  return getJson<IncidentDetailResponse>(`/api/incidents/${id}`);
}

export function getIncidentGraph(id: string): Promise<GraphResponse> {
  return getJson<GraphResponse>(`/api/incidents/${id}/graph`);
}

export function getCaseDetail(id: string): Promise<ScoredTransaction> {
  return getJson<ScoredTransaction>(`/api/transactions/${id}`);
}

export function getCaseGraph(id: string): Promise<GraphResponse> {
  return getJson<GraphResponse>(`/api/transactions/${id}/graph`);
}

export function getBehaviorProfile(userId: string): Promise<BehaviorProfile> {
  return getJson<BehaviorProfile>(`/api/users/${userId}/behavior-profile`);
}

export function getLiveMonitorBootstrap(): Promise<LiveMonitorPayload> {
  return getJson<LiveMonitorPayload>("/api/live/bootstrap");
}

export function getLiveMonitorStream(batch = 6): Promise<LiveMonitorPayload> {
  return getJson<LiveMonitorPayload>(`/api/live/stream?batch=${batch}`);
}

export async function postTransactionChat(
  transactionId: string,
  payload: { message: string; history: ChatMessage[] },
): Promise<TransactionChatResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/transactions/${transactionId}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(`Chat request failed for ${transactionId}: ${response.status}`);
  }

  return response.json() as Promise<TransactionChatResponse>;
}

export async function postIncidentChat(
  incidentId: string,
  payload: { message: string; history: ChatMessage[] },
): Promise<IncidentChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed for ${incidentId}: ${response.status}`);
  }

  return response.json() as Promise<IncidentChatResponse>;
}

export async function postUploadLive(
  transactionsFile: File,
  accountsFile?: File,
): Promise<LiveMonitorPayload> {
  const formData = new FormData();
  formData.append("transactions", transactionsFile);
  if (accountsFile) {
    formData.append("accounts", accountsFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/uploads/transactions/live`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json() as Promise<LiveMonitorPayload>;
}
