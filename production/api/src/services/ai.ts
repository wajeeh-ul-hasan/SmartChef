import OpenAI from "openai";
import type { AssistantMessage, IngredientCandidate, InventoryItem, Recipe, UserProfile } from "../domain/types.js";
import { buildRecommendations } from "./recommendations.js";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const textModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const visionModel = process.env.OPENAI_VISION_MODEL ?? textModel;
const aiTimeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 12000);

type AiTextResponse = { output_text: string };

function asTextResponse<T>(promise: Promise<T>) {
  return promise as Promise<AiTextResponse>;
}

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>(resolve => {
        timer = setTimeout(() => resolve(fallback), aiTimeoutMs);
      })
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function quantityFor(text: string, ingredient: string) {
  const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(kg|kilo|kilos|g|gram|grams|lb|lbs|pound|pounds|cup|cups|bottle|bottles|bag|bags|piece|pieces)?\\s+${escaped}s?`, "i"),
    new RegExp(`${escaped}s?\\s*(\\d+(?:\\.\\d+)?)\\s*(kg|kilo|kilos|g|gram|grams|lb|lbs|pound|pounds|cup|cups|bottle|bottles|bag|bags|piece|pieces)?`, "i"),
    new RegExp(`half\\s+(?:a\\s+)?(kg|kilo)\\s+${escaped}s?`, "i")
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    if (match[0].toLowerCase().startsWith("half")) return "0.5 kg";
    const amount = match[1];
    const rawUnit = match[2] ?? "unit";
    const unit = rawUnit.replace(/^kilos?$/i, "kg").replace(/^grams?$/i, "g").replace(/^pounds?$/i, "lb");
    return `${amount} ${unit}`;
  }

  return "1 unit";
}

function fallbackIngredientExtraction(text: string, source: IngredientCandidate["source"]): IngredientCandidate[] {
  const lower = text.toLowerCase();
  const candidates: IngredientCandidate[] = [];
  const known = [
    ["onion", "Onions", "Vegetables"],
    ["chicken", "Chicken", "Protein"],
    ["rice", "Rice", "Grains"],
    ["egg", "Eggs", "Protein"],
    ["tomato", "Tomatoes", "Vegetables"],
    ["potato", "Potatoes", "Vegetables"],
    ["spinach", "Spinach", "Vegetables"],
    ["yogurt", "Yogurt", "Dairy"]
  ];

  for (const [needle, displayName, category] of known) {
    if (lower.includes(needle)) {
      candidates.push({ displayName, quantity: quantityFor(text, needle), category, confidence: 0.72, source });
    }
  }

  return candidates;
}

export async function parseVoiceInventory(transcript: string): Promise<IngredientCandidate[]> {
  const fallback = fallbackIngredientExtraction(transcript, "voice");
  if (!openai) return fallback;

  try {
    const response = await withTimeout(asTextResponse(openai.responses.create({
      model: textModel,
      input: [
        {
          role: "system",
          content: "Extract grocery inventory items. Return JSON array only with displayName, quantity, category, confidence."
        },
        { role: "user", content: transcript }
      ]
    })), { output_text: JSON.stringify(fallback) });

    return JSON.parse(response.output_text) as IngredientCandidate[];
  } catch {
    return fallback;
  }
}

export async function detectPhotoInventory(imageUrlOrBase64: string): Promise<IngredientCandidate[]> {
  const fallback = [
    { displayName: "Tomatoes", quantity: "1 kg", category: "Vegetables", confidence: 0.82, source: "photo" },
    { displayName: "Garlic", quantity: "250 g", category: "Vegetables", confidence: 0.76, source: "photo" },
    { displayName: "Rice", quantity: "1 bag", category: "Grains", confidence: 0.7, source: "photo" }
  ] satisfies IngredientCandidate[];

  if (!openai) {
    return fallback;
  }

  try {
    const response = await withTimeout(asTextResponse(openai.responses.create({
      model: visionModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Identify grocery ingredients in this image. Return JSON array only with displayName, quantity estimate, category, confidence from 0 to 1."
            },
            { type: "input_image", image_url: imageUrlOrBase64, detail: "auto" }
          ]
        }
      ]
    })), { output_text: JSON.stringify(fallback) });

    return JSON.parse(response.output_text) as IngredientCandidate[];
  } catch {
    return fallback;
  }
}

export async function generateRecipe(prompt: string, profile: UserProfile, inventory: InventoryItem[]): Promise<Recipe> {
  if (!openai) {
    return {
      id: `ai-${Date.now()}`,
      title: "SmartChef Pantry Skillet",
      photoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Boneless_chicken_karahi_with_naan.jpg",
      photoCredit: "Photo: Wikimedia Commons",
      cuisine: profile.cuisines[0] ?? "Fusion",
      dietaryTags: profile.dietaryPreferences.map(item => item.toLowerCase()),
      skillLevel: profile.cookingSkill,
      cookingTimeMinutes: 20,
      ingredients: inventory.slice(0, 5).map(item => item.displayName),
      instructions: [
        "Prep all available ingredients into bite-sized pieces.",
        "Heat oil in a pan and cook aromatics first.",
        "Add protein or vegetables and cook until tender.",
        "Season to taste and simmer briefly.",
        "Serve hot with rice, bread, or pasta."
      ],
      nutrition: "Nutrition estimate depends on final quantities.",
      equipment: "Pan",
      aiGenerated: true
    };
  }

  const response = await openai.responses.create({
    model: textModel,
    input: [
      {
        role: "system",
        content: "Create safe, practical home recipes. Respect dietary restrictions. Return JSON with title, cuisine, dietaryTags, skillLevel, cookingTimeMinutes, ingredients, instructions, nutrition, equipment."
      },
      {
        role: "user",
        content: JSON.stringify({ prompt, profile, inventory })
      }
    ]
  });

  const generated = JSON.parse(response.output_text);
  return { id: `ai-${Date.now()}`, aiGenerated: true, ...generated };
}

export async function runAssistant(messages: AssistantMessage[], profile: UserProfile, inventory: InventoryItem[]) {
  const lastMessage = messages.at(-1)?.content ?? "";
  const recommendations = buildRecommendations(profile, inventory);
  const fallbackMessage = lastMessage.toLowerCase().includes("rice")
    ? "To cook plain rice: rinse 1 cup rice until the water is mostly clear, add 2 cups water and a pinch of salt, bring to a boil, cover, then simmer on low for 12-15 minutes. Turn off the heat and let it rest covered for 5 minutes before fluffing."
    : `For "${lastMessage}", I would start with ${recommendations.cookRightNow[0]?.title ?? recommendations.almostThere[0]?.title ?? "Egg Fried Rice"}. If you want, add your ingredients in Inventory and I will narrow the suggestion to what you already have.`;
  const fallback = {
    message: fallbackMessage,
    actions: ["recommendMeals", "getInventory"]
  };

  if (!openai) {
    return fallback;
  }

  const response = await withTimeout(asTextResponse(openai.responses.create({
      model: textModel,
      input: [
        {
          role: "system",
          content: "You are SmartChef, a concise cooking assistant. Suggest meals, substitutions, inventory actions, and shopping lists. Never claim inventory was changed unless the user confirms."
        },
        {
          role: "user",
          content: JSON.stringify({ messages, profile, inventory, recommendations })
        }
      ]
    })),
    { output_text: fallback.message }
  );

  return {
    message: response.output_text,
    actions: response.output_text === fallback.message ? fallback.actions : ["recommendMeals", "generateRecipe"]
  };
}
