import type { InventoryItem, Recipe, RecommendationSection, UserProfile } from "../domain/types.js";
import { recipes } from "../data/seed.js";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function inventoryNames(inventory: InventoryItem[]) {
  return new Set(inventory.filter(item => item.confirmed).map(item => normalize(item.displayName)));
}

function missingIngredients(recipe: Recipe, inventory: InventoryItem[]) {
  const names = inventoryNames(inventory);
  return recipe.ingredients.filter(ingredient => !names.has(normalize(ingredient)));
}

function dietaryAllowed(recipe: Recipe, profile: UserProfile) {
  const selected = profile.dietaryPreferences.map(normalize);
  if (selected.includes("halal") && !recipe.dietaryTags.includes("halal")) return false;
  if (selected.includes("vegetarian") && !recipe.dietaryTags.includes("vegetarian")) return false;
  if (selected.includes("vegan") && !recipe.dietaryTags.includes("vegan")) return false;
  return true;
}

function quickMode(profile: UserProfile) {
  return profile.lifestyles.some(lifestyle =>
    ["International Student", "Bachelor / Living Alone", "Working Professional", "Student"].includes(lifestyle)
  ) || profile.cookingTimePreference.includes("10");
}

function score(recipe: Recipe, inventory: InventoryItem[], profile: UserProfile) {
  const missing = missingIngredients(recipe, inventory).length;
  const inventoryScore = Math.max(0, 1 - missing / Math.max(recipe.ingredients.length, 1));
  const cuisineScore = profile.cuisines.includes(recipe.cuisine) ? 0.2 : 0;
  const quickScore = quickMode(profile) && recipe.cookingTimeMinutes <= 20 ? 0.2 : 0;
  const wasteScore = recipe.ingredients.some(ingredient =>
    inventory.some(item => normalize(item.displayName) === normalize(ingredient) && item.expiresAt && Date.parse(item.expiresAt) - Date.now() < 3 * 86400000)
  ) ? 0.2 : 0;
  return inventoryScore + cuisineScore + quickScore + wasteScore;
}

export function buildRecommendations(profile: UserProfile, inventory: InventoryItem[]): RecommendationSection {
  const eligible = recipes
    .filter(recipe => dietaryAllowed(recipe, profile))
    .sort((a, b) => score(b, inventory, profile) - score(a, inventory, profile));

  return {
    cookRightNow: eligible.filter(recipe => missingIngredients(recipe, inventory).length === 0).slice(0, 4),
    almostThere: eligible
      .map(recipe => ({ ...recipe, missingIngredients: missingIngredients(recipe, inventory) }))
      .filter(recipe => recipe.missingIngredients.length > 0 && recipe.missingIngredients.length <= 3)
      .slice(0, 4),
    creative: eligible.filter(recipe => recipe.aiGenerated || recipe.cuisine === "Fusion").slice(0, 4)
  };
}
