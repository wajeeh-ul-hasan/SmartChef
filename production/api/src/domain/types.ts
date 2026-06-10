export type PlanId = "basic_monthly" | "pro_monthly" | "pro_yearly";
export type SubscriptionStatus = "trialing" | "basic_active" | "pro_active" | "expired" | "cancelled";
export type InventorySource = "starter_pack" | "manual" | "voice" | "photo" | "receipt" | "assistant";

export interface UserProfile {
  cuisines: string[];
  dietaryPreferences: string[];
  cookingSkill: "beginner" | "intermediate" | "advanced";
  lifestyles: string[];
  cookingTimePreference: string;
  householdSize: number;
}

export interface Subscription {
  status: SubscriptionStatus;
  planId: PlanId | null;
  trialStartedAt: string;
  trialEndsAt: string;
  store: "apple" | "google" | "revenuecat_test" | null;
  storeCustomerId?: string;
  storeSubscriptionId?: string;
}

export interface InventoryItem {
  id: string;
  displayName: string;
  quantity: string;
  category: string;
  source: InventorySource;
  confidence: number;
  expiresAt?: string;
  confirmed: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  photoUrl?: string;
  photoCredit?: string;
  cuisine: string;
  dietaryTags: string[];
  skillLevel: "beginner" | "intermediate" | "advanced";
  cookingTimeMinutes: number;
  ingredients: string[];
  instructions: string[];
  nutrition: string;
  equipment: string;
  aiGenerated?: boolean;
}

export interface RecommendationSection {
  cookRightNow: Recipe[];
  almostThere: Array<Recipe & { missingIngredients: string[] }>;
  creative: Recipe[];
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface IngredientCandidate {
  displayName: string;
  quantity: string;
  category: string;
  confidence: number;
  source: InventorySource;
}
