CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google', 'apple')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cuisines TEXT[] NOT NULL DEFAULT '{}',
  dietary_preferences TEXT[] NOT NULL DEFAULT '{}',
  cooking_skill TEXT NOT NULL CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
  lifestyles TEXT[] NOT NULL DEFAULT '{}',
  cooking_time_preference TEXT NOT NULL,
  budget_preference_cents INT,
  household_size INT NOT NULL DEFAULT 1,
  quick_meals_enabled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  plan TEXT CHECK (plan IN ('monthly', 'annual')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  billing_started_at TIMESTAMPTZ,
  external_customer_id TEXT,
  external_subscription_id TEXT
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  default_expiry_days INT,
  halal_safe BOOLEAN DEFAULT true,
  vegan_safe BOOLEAN DEFAULT false,
  vegetarian_safe BOOLEAN DEFAULT false
);

CREATE TABLE user_inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  display_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  source TEXT NOT NULL CHECK (source IN ('starter_pack', 'manual', 'voice', 'photo', 'receipt')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  cuisine TEXT,
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  skill_level TEXT NOT NULL,
  cooking_time_minutes INT NOT NULL,
  estimated_cost_cents INT,
  nutrition JSONB NOT NULL DEFAULT '{}',
  instructions JSONB NOT NULL DEFAULT '[]',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE recipe_ingredients (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity NUMERIC,
  unit TEXT,
  optional BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recommendation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('daily', 'quick_meals', 'weekly_plan', 'creative')),
  model TEXT NOT NULL,
  input_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES recommendation_runs(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  category TEXT NOT NULL CHECK (category IN ('cook_now', 'almost_there', 'creative')),
  rank INT NOT NULL,
  missing_ingredients JSONB NOT NULL DEFAULT '[]',
  explanation TEXT,
  score NUMERIC(6,4) NOT NULL
);

CREATE TABLE user_recipe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('viewed', 'saved', 'liked', 'disliked', 'cooked', 'shared', 'photo_uploaded')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  budget_estimate_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  display_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  estimated_cost_cents INT,
  checked BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE weekly_meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  week_start DATE NOT NULL,
  meals JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_user_expiry ON user_inventory_items(user_id, expires_at);
CREATE INDEX idx_recipe_cuisine_time ON recipes(cuisine, cooking_time_minutes);
CREATE INDEX idx_events_user_type ON user_recipe_events(user_id, event_type, created_at);
