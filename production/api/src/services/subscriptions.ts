import type { PlanId, Subscription } from "../domain/types.js";

export const plans = [
  {
    id: "basic_monthly" as PlanId,
    name: "Basic",
    price: "$0.99/month",
    entitlement: "basic",
    features: ["Daily recommendations", "Recipe ingredients", "Cooking instructions", "No inventory access after trial"]
  },
  {
    id: "pro_monthly" as PlanId,
    name: "Pro Monthly",
    price: "$4.99/month",
    entitlement: "pro",
    features: ["Everything in Basic", "Inventory", "Photo inventory", "Voice inventory", "Ingredient-based suggestions"]
  },
  {
    id: "pro_yearly" as PlanId,
    name: "Pro Yearly",
    price: "$39.99/year",
    entitlement: "pro",
    badge: "Best value",
    features: ["Everything in Pro Monthly", "Yearly savings", "Ingredient-based suggestions", "Photo and voice inventory"]
  }
];

export function buildTrialSubscription(userId: string): Subscription {
  const trialStartedAt = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 7 * 86400000).toISOString();

  return {
    status: "trialing",
    planId: "pro_monthly",
    trialStartedAt,
    trialEndsAt,
    store: "revenuecat_test",
    storeCustomerId: userId,
    storeSubscriptionId: "trial"
  };
}

export function mapRevenueCatEntitlement(entitlement: "basic" | "pro", planId: PlanId): Subscription["status"] {
  if (entitlement === "pro") return "pro_active";
  return planId === "basic_monthly" ? "basic_active" : "pro_active";
}
