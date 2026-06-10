import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { recipes, starterPacks } from "./data/seed.js";
import type { InventoryItem } from "./domain/types.js";
import { detectPhotoInventory, generateRecipe, parseVoiceInventory, runAssistant } from "./services/ai.js";
import { buildRecommendations } from "./services/recommendations.js";
import { plans } from "./services/subscriptions.js";
import { demoUserId, ensureDatabaseReady, getAdminAnalytics, getInventory, getProfile, getSubscription, getUser, hasBasicAccess, hasProAccess, setProfile, setSubscription, upsertInventoryItems } from "./services/store.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

function userIdFromRequest(req: express.Request) {
  const userId = req.header("x-user-id");
  return !userId || userId === "demo-user" ? demoUserId : userId;
}

async function requireBasic(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    if (!(await hasBasicAccess(userIdFromRequest(req)))) return res.status(402).json({ error: "Basic or trial access required" });
    return next();
  } catch (error) {
    return next(error);
  }
}

async function requirePro(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    if (!(await hasProAccess(userIdFromRequest(req)))) return res.status(402).json({ error: "Pro trial or Pro subscription required" });
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "smartchef-api" });
});

app.get("/v1/me", async (req, res, next) => {
  const userId = userIdFromRequest(req);
  try {
    const [user, profile, subscription, basic, pro] = await Promise.all([
      getUser(userId),
      getProfile(userId),
      getSubscription(userId),
      hasBasicAccess(userId),
      hasProAccess(userId)
    ]);
    res.json({ user, profile, subscription, entitlements: { basic, pro } });
  } catch (error) {
    next(error);
  }
});

app.put("/v1/me/profile", async (req, res, next) => {
  const schema = z.object({
    cuisines: z.array(z.string()),
    dietaryPreferences: z.array(z.string()),
    cookingSkill: z.enum(["beginner", "intermediate", "advanced"]),
    lifestyles: z.array(z.string()),
    cookingTimePreference: z.string(),
    householdSize: z.number().int().positive().default(1)
  });
  try {
    const profile = schema.parse(req.body);
    res.json({ profile: await setProfile(userIdFromRequest(req), profile) });
  } catch (error) {
    next(error);
  }
});

app.get("/v1/subscriptions/plans", (_req, res) => {
  res.json({ plans });
});

app.post("/v1/webhooks/revenuecat", async (req, res, next) => {
  const userId = req.body?.app_user_id ?? demoUserId;
  const entitlement = req.body?.entitlement_id === "basic" ? "basic" : "pro";
  const planId = req.body?.product_id?.includes("basic") ? "basic_monthly" : req.body?.product_id?.includes("year") ? "pro_yearly" : "pro_monthly";
  try {
    const current = await getSubscription(userId);

    await setSubscription(userId, {
      status: entitlement === "basic" ? "basic_active" : "pro_active",
      planId,
      trialStartedAt: current?.trialStartedAt ?? new Date().toISOString(),
      trialEndsAt: current?.trialEndsAt ?? new Date().toISOString(),
      store: req.body?.store === "APP_STORE" ? "apple" : "google",
      storeCustomerId: userId,
      storeSubscriptionId: req.body?.transaction_id
    });

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

app.get("/v1/starter-packs", (req, res) => {
  const cuisine = String(req.query.cuisine ?? "Desi / Pakistani");
  res.json({ cuisine, items: starterPacks[cuisine as keyof typeof starterPacks] ?? starterPacks["Desi / Pakistani"] });
});

app.get("/v1/inventory", requirePro, async (req, res, next) => {
  try {
    res.json({ items: await getInventory(userIdFromRequest(req)) });
  } catch (error) {
    next(error);
  }
});

app.post("/v1/inventory/items", requirePro, async (req, res, next) => {
  const schema = z.object({
    items: z.array(z.object({
      displayName: z.string(),
      quantity: z.string(),
      category: z.string().default("Other"),
      source: z.enum(["starter_pack", "manual", "voice", "photo", "receipt", "assistant"]).default("manual"),
      confidence: z.number().min(0).max(1).default(1),
      confirmed: z.boolean().default(true)
    }))
  });
  try {
    const parsed = schema.parse(req.body);
    const items: InventoryItem[] = parsed.items.map(item => ({
      id: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      ...item
    }));
    res.json({ items: await upsertInventoryItems(userIdFromRequest(req), items) });
  } catch (error) {
    next(error);
  }
});

app.post("/v1/inventory/voice-parse", requirePro, async (req, res, next) => {
  try {
    const transcript = z.object({ transcript: z.string().min(1) }).parse(req.body).transcript;
    const candidates = await parseVoiceInventory(transcript);
    res.json({ candidates, requiresConfirmation: true });
  } catch (error) {
    next(error);
  }
});

app.post("/v1/inventory/photo-detect", requirePro, upload.single("photo"), async (req, res, next) => {
  try {
    const image = req.body?.imageUrl || (req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` : "");
    if (!image) return res.status(400).json({ error: "photo file or imageUrl is required" });
    const candidates = await detectPhotoInventory(image);
    res.json({ candidates, requiresConfirmation: true });
  } catch (error) {
    next(error);
  }
});

app.get("/v1/recipes", requireBasic, (_req, res) => {
  res.json({ recipes });
});

app.post("/v1/recipes/generate", requirePro, async (req, res, next) => {
  try {
    const prompt = z.object({ prompt: z.string().min(1) }).parse(req.body).prompt;
    const userId = userIdFromRequest(req);
    const [profile, inventory] = await Promise.all([getProfile(userId), getInventory(userId)]);
    const recipe = await generateRecipe(prompt, profile, inventory);
    res.json({ recipe });
  } catch (error) {
    next(error);
  }
});

app.get("/v1/recommendations/today", requireBasic, async (req, res, next) => {
  const userId = userIdFromRequest(req);
  try {
    const [profile, inventory] = await Promise.all([getProfile(userId), getInventory(userId)]);
    res.json({
      date: new Date().toISOString().slice(0, 10),
      sections: buildRecommendations(profile, inventory)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/v1/assistant/chat", requirePro, async (req, res, next) => {
  try {
    const messages = z.object({
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    }).parse(req.body).messages;
    const userId = userIdFromRequest(req);
    const [profile, inventory] = await Promise.all([getProfile(userId), getInventory(userId)]);
    const result = await runAssistant(messages, profile, inventory);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/v1/admin/analytics", async (_req, res, next) => {
  try {
    res.json(await getAdminAnalytics());
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.flatten() });
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 8080);
ensureDatabaseReady()
  .then(() => {
    app.listen(port, () => {
      console.log(`SmartChef API running on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error("Failed to initialize SmartChef database", error);
    process.exit(1);
  });
