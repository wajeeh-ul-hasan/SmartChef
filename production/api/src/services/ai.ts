import OpenAI from "openai";
import type { AssistantMessage, IngredientCandidate, InventoryItem, Recipe, UserProfile } from "../domain/types.js";
import { buildRecommendations } from "./recommendations.js";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const textModel = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const visionModel = process.env.OPENAI_VISION_MODEL ?? textModel;

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
      candidates.push({ displayName, quantity: "1 unit", category, confidence: 0.72, source });
    }
  }

  return candidates;
}

export async function parseVoiceInventory(transcript: string): Promise<IngredientCandidate[]> {
  if (!openai) return fallbackIngredientExtraction(transcript, "voice");

  const response = await openai.responses.create({
    model: textModel,
    input: [
      {
        role: "system",
        content: "Extract grocery inventory items. Return JSON array only with displayName, quantity, category, confidence."
      },
      { role: "user", content: transcript }
    ]
  });

  try {
    return JSON.parse(response.output_text) as IngredientCandidate[];
  } catch {
    return fallbackIngredientExtraction(transcript, "voice");
  }
}

export async function detectPhotoInventory(imageUrlOrBase64: string): Promise<IngredientCandidate[]> {
  if (!openai) {
    return [
      { displayName: "Tomatoes", quantity: "1 kg", category: "Vegetables", confidence: 0.82, source: "photo" },
      { displayName: "Garlic", quantity: "250 g", category: "Vegetables", confidence: 0.76, source: "photo" },
      { displayName: "Rice", quantity: "1 bag", category: "Grains", confidence: 0.7, source: "photo" }
    ];
  }

  const response = await openai.responses.create({
    model: visionModel,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Identify grocery ingredients in this image. Return JSON array only with displayName, quantity estimate, category, confidence from 0 to 1."
          },
          { type: "input_image", image_url: imageUrlOrBase64 }
        ]
      }
    ]
  });

  try {
    return JSON.parse(response.output_text) as IngredientCandidate[];
  } catch {
    return [];
  }
}

export async function generateRecipe(prompt: string, profile: UserProfile, inventory: InventoryItem[]): Promise<Recipe> {
  if (!openai) {
    return {
      id: `ai-${Date.now()}`,
      title: "SmartChef Pantry Skillet",
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

  if (!openai) {
    return {
      message: `I would start with ${recommendations.cookRightNow[0]?.title ?? recommendations.almostThere[0]?.title ?? "Egg Fried Rice"}. ${lastMessage.toLowerCase().includes("inventory") ? "I can also add ingredients after you confirm them." : "Tell me what ingredients you have and I will narrow it down."}`,
      actions: ["recommendMeals", "getInventory"]
    };
  }

  const response = await openai.responses.create({
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
  });

  return { message: response.output_text, actions: ["recommendMeals", "generateRecipe"] };
}
