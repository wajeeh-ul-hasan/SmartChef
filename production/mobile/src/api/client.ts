import type { IngredientCandidate, InventoryItem, Plan, RecommendationSections, Recipe } from "../types/models";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const headers = { "Content-Type": "application/json", "x-user-id": "demo-user" };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<{ subscription: unknown; entitlements: { basic: boolean; pro: boolean } }>("/v1/me"),
  plans: () => request<{ plans: Plan[] }>("/v1/subscriptions/plans"),
  recommendations: () => request<{ date: string; sections: RecommendationSections }>("/v1/recommendations/today"),
  recipes: () => request<{ recipes: Recipe[] }>("/v1/recipes"),
  inventory: () => request<{ items: InventoryItem[] }>("/v1/inventory"),
  addInventoryItems: (items: Array<Partial<InventoryItem>>) =>
    request<{ items: InventoryItem[] }>("/v1/inventory/items", { method: "POST", body: JSON.stringify({ items }) }),
  parseVoice: (transcript: string) =>
    request<{ candidates: IngredientCandidate[]; requiresConfirmation: boolean }>("/v1/inventory/voice-parse", {
      method: "POST",
      body: JSON.stringify({ transcript })
    }),
  detectPhoto: (imageUrl: string) =>
    request<{ candidates: IngredientCandidate[]; requiresConfirmation: boolean }>("/v1/inventory/photo-detect", {
      method: "POST",
      body: JSON.stringify({ imageUrl })
    }),
  generateRecipe: (prompt: string) =>
    request<{ recipe: Recipe }>("/v1/recipes/generate", { method: "POST", body: JSON.stringify({ prompt }) }),
  assistant: (messages: Array<{ role: "user" | "assistant"; content: string }>) =>
    request<{ message: string; actions: string[] }>("/v1/assistant/chat", { method: "POST", body: JSON.stringify({ messages }) })
};
