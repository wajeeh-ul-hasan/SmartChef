import type { InventoryItem, Subscription, UserProfile } from "../domain/types.js";
import { defaultProfile, seedInventory } from "../data/seed.js";

const trialStartedAt = new Date().toISOString();
const trialEndsAt = new Date(Date.now() + 7 * 86400000).toISOString();

export const demoUserId = "demo-user";

export const store = {
  users: new Map<string, { id: string; email: string; fullName: string }>([
    [demoUserId, { id: demoUserId, email: "demo@smartchef.app", fullName: "SmartChef Demo" }]
  ]),
  profiles: new Map<string, UserProfile>([[demoUserId, defaultProfile]]),
  subscriptions: new Map<string, Subscription>([
    [
      demoUserId,
      {
        status: "trialing",
        planId: "pro_monthly",
        trialStartedAt,
        trialEndsAt,
        store: "revenuecat_test",
        storeCustomerId: demoUserId,
        storeSubscriptionId: "trial"
      }
    ]
  ]),
  inventory: new Map<string, InventoryItem[]>([[demoUserId, seedInventory]]),
  feedback: [] as Array<Record<string, unknown>>
};

export function getInventory(userId = demoUserId) {
  return store.inventory.get(userId) ?? [];
}

export function getProfile(userId = demoUserId) {
  return store.profiles.get(userId) ?? store.profiles.get(demoUserId)!;
}

export function upsertInventoryItems(userId: string, items: InventoryItem[]) {
  const current = getInventory(userId);
  const next = [...current];

  for (const item of items) {
    const existing = next.find(existingItem => existingItem.displayName.toLowerCase() === item.displayName.toLowerCase());
    if (existing) Object.assign(existing, item, { id: existing.id });
    else next.push(item);
  }

  store.inventory.set(userId, next);
  return next;
}

export function getSubscription(userId = demoUserId) {
  return store.subscriptions.get(userId);
}

export function hasProAccess(userId = demoUserId) {
  const subscription = getSubscription(userId);
  if (!subscription) return false;
  if (subscription.status === "pro_active") return true;
  if (subscription.status !== "trialing") return false;
  return Date.now() < Date.parse(subscription.trialEndsAt);
}

export function hasBasicAccess(userId = demoUserId) {
  const subscription = getSubscription(userId);
  return hasProAccess(userId) || subscription?.status === "basic_active";
}
