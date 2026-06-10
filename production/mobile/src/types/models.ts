export type PlanId = "basic_monthly" | "pro_monthly" | "pro_yearly";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  entitlement: "basic" | "pro";
  badge?: string;
  features: string[];
}

export interface InventoryItem {
  id: string;
  displayName: string;
  quantity: string;
  category: string;
  source: string;
  confidence: number;
  confirmed: boolean;
  expiresAt?: string;
}

export interface IngredientCandidate {
  displayName: string;
  quantity: string;
  category: string;
  confidence: number;
  source: "voice" | "photo" | "receipt" | "assistant";
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  dietaryTags: string[];
  skillLevel: string;
  cookingTimeMinutes: number;
  ingredients: string[];
  instructions: string[];
  nutrition: string;
  equipment: string;
  aiGenerated?: boolean;
  missingIngredients?: string[];
}

export interface RecommendationSections {
  cookRightNow: Recipe[];
  almostThere: Recipe[];
  creative: Recipe[];
}
