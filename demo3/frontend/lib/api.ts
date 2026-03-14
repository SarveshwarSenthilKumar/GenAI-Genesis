import type {
  ChatMessage,
  BehaviorProfile,
  DashboardSummary,
  GraphResponse,
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

export function getCaseDetail(id: string): Promise<ScoredTransaction> {
  return getJson<ScoredTransaction>(`/api/transactions/${id}`);
}

export function getCaseGraph(id: string): Promise<GraphResponse> {
  return getJson<GraphResponse>(`/api/transactions/${id}/graph`);
}

export function getBehaviorProfile(userId: string): Promise<BehaviorProfile> {
  return getJson<BehaviorProfile>(`/api/users/${userId}/behavior-profile`);
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

