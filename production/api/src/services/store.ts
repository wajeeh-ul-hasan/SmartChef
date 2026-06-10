import type { InventoryItem, Subscription, UserProfile } from "../domain/types.js";
import { defaultProfile, seedInventory } from "../data/seed.js";
import { query } from "./db.js";

export const demoUserId = "00000000-0000-0000-0000-000000000001";

const demoEmail = "demo@smartchef.app";
const demoName = "SmartChef Demo";

type InventoryRow = {
  id: string;
  display_name: string;
  quantity: string | number | null;
  unit: string | null;
  category: string | null;
  source: InventoryItem["source"];
  confidence: string | number;
  expires_at: Date | string | null;
  confirmed: boolean | null;
};

type ProfileRow = {
  cuisines: string[];
  dietary_preferences: string[];
  cooking_skill: UserProfile["cookingSkill"];
  lifestyles: string[];
  cooking_time_preference: string;
  household_size: number;
};

type SubscriptionRow = {
  status: Subscription["status"];
  plan: Subscription["planId"];
  trial_started_at: Date | string | null;
  trial_ends_at: Date | string | null;
  store: Subscription["store"];
  store_customer_id: string | null;
  store_subscription_id: string | null;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function splitQuantity(quantity: string) {
  const match = quantity.trim().match(/^(\d+(?:\.\d+)?)(?:\s+(.+))?$/);
  if (!match) return { amount: null, unit: quantity || "unit" };
  return { amount: Number(match[1]), unit: match[2] || "unit" };
}

function mapInventory(row: InventoryRow): InventoryItem {
  const quantity = [row.quantity, row.unit].filter(Boolean).join(" ").trim() || "1 unit";
  return {
    id: row.id,
    displayName: row.display_name,
    quantity,
    category: row.category ?? "Other",
    source: row.source,
    confidence: Number(row.confidence),
    expiresAt: toIso(row.expires_at),
    confirmed: row.confirmed ?? true
  };
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    cuisines: row.cuisines,
    dietaryPreferences: row.dietary_preferences,
    cookingSkill: row.cooking_skill,
    lifestyles: row.lifestyles,
    cookingTimePreference: row.cooking_time_preference,
    householdSize: row.household_size
  };
}

function mapSubscription(row: SubscriptionRow): Subscription {
  return {
    status: row.status,
    planId: row.plan,
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    store: row.store,
    storeCustomerId: row.store_customer_id ?? undefined,
    storeSubscriptionId: row.store_subscription_id ?? undefined
  };
}

export async function ensureDatabaseReady() {
  await query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google', 'apple')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      cuisines TEXT[] NOT NULL DEFAULT '{}',
      dietary_preferences TEXT[] NOT NULL DEFAULT '{}',
      cooking_skill TEXT NOT NULL CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
      lifestyles TEXT[] NOT NULL DEFAULT '{}',
      cooking_time_preference TEXT NOT NULL,
      budget_preference_cents INT,
      household_size INT NOT NULL DEFAULT 1,
      quick_meals_enabled BOOLEAN NOT NULL DEFAULT false
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('trialing', 'basic_active', 'pro_active', 'expired', 'cancelled')),
      plan TEXT CHECK (plan IN ('basic_monthly', 'pro_monthly', 'pro_yearly')),
      trial_started_at TIMESTAMPTZ,
      trial_ends_at TIMESTAMPTZ,
      billing_started_at TIMESTAMPTZ,
      store TEXT CHECK (store IN ('apple', 'google', 'revenuecat_test')),
      store_customer_id TEXT,
      store_subscription_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      canonical_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      aliases TEXT[] NOT NULL DEFAULT '{}',
      default_expiry_days INT,
      halal_safe BOOLEAN DEFAULT true,
      vegan_safe BOOLEAN DEFAULT false,
      vegetarian_safe BOOLEAN DEFAULT false
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_inventory_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ingredient_id UUID REFERENCES ingredients(id),
      display_name TEXT NOT NULL,
      quantity NUMERIC,
      unit TEXT,
      category TEXT DEFAULT 'Other',
      source TEXT NOT NULL CHECK (source IN ('starter_pack', 'manual', 'voice', 'photo', 'receipt', 'assistant')),
      confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000,
      confirmed BOOLEAN NOT NULL DEFAULT true,
      added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ,
      consumed_at TIMESTAMPTZ
    )
  `);
  await query("ALTER TABLE user_inventory_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other'");
  await query("ALTER TABLE user_inventory_items ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT true");
  await query("ALTER TABLE user_inventory_items DROP CONSTRAINT IF EXISTS user_inventory_items_source_check");
  await query("ALTER TABLE user_inventory_items ADD CONSTRAINT user_inventory_items_source_check CHECK (source IN ('starter_pack', 'manual', 'voice', 'photo', 'receipt', 'assistant'))");
  await query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS store TEXT");
  await query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS store_customer_id TEXT");
  await query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS store_subscription_id TEXT");
  await query("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
  await query("ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check");
  await query("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('trialing', 'basic_active', 'pro_active', 'expired', 'cancelled'))");
  await query("ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check");
  await query("ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('basic_monthly', 'pro_monthly', 'pro_yearly'))");

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(Date.now() + 7 * 86400000);

  await query(
    `INSERT INTO users (id, email, full_name, auth_provider)
     VALUES ($1, $2, $3, 'email')
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = now()`,
    [demoUserId, demoEmail, demoName]
  );

  await query(
    `INSERT INTO user_profiles (user_id, cuisines, dietary_preferences, cooking_skill, lifestyles, cooking_time_preference, household_size, quick_meals_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (user_id) DO NOTHING`,
    [
      demoUserId,
      defaultProfile.cuisines,
      defaultProfile.dietaryPreferences,
      defaultProfile.cookingSkill,
      defaultProfile.lifestyles,
      defaultProfile.cookingTimePreference,
      defaultProfile.householdSize
    ]
  );

  await query(
    `INSERT INTO subscriptions (user_id, status, plan, trial_started_at, trial_ends_at, store, store_customer_id, store_subscription_id)
     VALUES ($1, 'trialing', 'pro_monthly', $2, $3, 'revenuecat_test', $4, 'trial')
     ON CONFLICT DO NOTHING`,
    [demoUserId, trialStartedAt, trialEndsAt, demoUserId]
  );

  const inventoryCount = await query<{ count: string }>("SELECT count(*) FROM user_inventory_items WHERE user_id = $1", [demoUserId]);
  if (Number(inventoryCount.rows[0]?.count ?? 0) === 0) {
    await upsertInventoryItems(demoUserId, seedInventory);
  }
}

export async function getUser(userId = demoUserId) {
  const result = await query<{ id: string; email: string; full_name: string }>(
    "SELECT id, email, full_name FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0] ?? { id: demoUserId, email: demoEmail, full_name: demoName };
}

export async function getInventory(userId = demoUserId) {
  const result = await query<InventoryRow>(
    `SELECT id, display_name, quantity, unit, category, source, confidence, expires_at, confirmed
     FROM user_inventory_items
     WHERE user_id = $1 AND consumed_at IS NULL
     ORDER BY added_at DESC`,
    [userId]
  );
  return result.rows.map(mapInventory);
}

export async function getProfile(userId = demoUserId) {
  const result = await query<ProfileRow>(
    `SELECT cuisines, dietary_preferences, cooking_skill, lifestyles, cooking_time_preference, household_size
     FROM user_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] ? mapProfile(result.rows[0]) : defaultProfile;
}

export async function setProfile(userId: string, profile: UserProfile) {
  await query(
    `INSERT INTO user_profiles (user_id, cuisines, dietary_preferences, cooking_skill, lifestyles, cooking_time_preference, household_size, quick_meals_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     ON CONFLICT (user_id) DO UPDATE SET
       cuisines = EXCLUDED.cuisines,
       dietary_preferences = EXCLUDED.dietary_preferences,
       cooking_skill = EXCLUDED.cooking_skill,
       lifestyles = EXCLUDED.lifestyles,
       cooking_time_preference = EXCLUDED.cooking_time_preference,
       household_size = EXCLUDED.household_size,
       quick_meals_enabled = EXCLUDED.quick_meals_enabled`,
    [
      userId,
      profile.cuisines,
      profile.dietaryPreferences,
      profile.cookingSkill,
      profile.lifestyles,
      profile.cookingTimePreference,
      profile.householdSize
    ]
  );
  return profile;
}

export async function upsertInventoryItems(userId: string, items: InventoryItem[]) {
  for (const item of items) {
    const { amount, unit } = splitQuantity(item.quantity);
    await query(
      `INSERT INTO user_inventory_items (id, user_id, display_name, quantity, unit, source, confidence, expires_at, category, confirmed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         quantity = EXCLUDED.quantity,
         unit = EXCLUDED.unit,
         source = EXCLUDED.source,
         confidence = EXCLUDED.confidence,
         expires_at = EXCLUDED.expires_at,
         category = EXCLUDED.category,
         confirmed = EXCLUDED.confirmed`,
      [
        item.id,
        userId,
        item.displayName,
        amount,
        unit,
        item.source,
        item.confidence,
        item.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        item.category,
        item.confirmed
      ]
    );
  }
  return getInventory(userId);
}

export async function getSubscription(userId = demoUserId) {
  const result = await query<SubscriptionRow>(
    `SELECT status, plan, trial_started_at, trial_ends_at, store, store_customer_id, store_subscription_id
     FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ? mapSubscription(result.rows[0]) : undefined;
}

export async function setSubscription(userId: string, subscription: Subscription) {
  await query(
    `INSERT INTO subscriptions (user_id, status, plan, trial_started_at, trial_ends_at, store, store_customer_id, store_subscription_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      userId,
      subscription.status,
      subscription.planId,
      subscription.trialStartedAt || new Date().toISOString(),
      subscription.trialEndsAt || new Date().toISOString(),
      subscription.store,
      subscription.storeCustomerId,
      subscription.storeSubscriptionId
    ]
  );
  return subscription;
}

export async function hasProAccess(userId = demoUserId) {
  const subscription = await getSubscription(userId);
  if (!subscription) return false;
  if (subscription.status === "pro_active") return true;
  if (subscription.status !== "trialing") return false;
  return Date.now() < Date.parse(subscription.trialEndsAt);
}

export async function hasBasicAccess(userId = demoUserId) {
  const subscription = await getSubscription(userId);
  return (await hasProAccess(userId)) || subscription?.status === "basic_active";
}

export async function getAdminAnalytics() {
  const [users, trialing, inventoryItems] = await Promise.all([
    query<{ count: string }>("SELECT count(*) FROM users"),
    query<{ count: string }>("SELECT count(*) FROM subscriptions WHERE status = 'trialing'"),
    query<{ count: string }>("SELECT count(*) FROM user_inventory_items WHERE consumed_at IS NULL")
  ]);

  return {
    users: Number(users.rows[0]?.count ?? 0),
    trialing: Number(trialing.rows[0]?.count ?? 0),
    inventoryItems: Number(inventoryItems.rows[0]?.count ?? 0),
    feedbackNotes: 0
  };
}
