import React, { useEffect, useMemo, useState } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { api } from "./src/api/client";
import { colors, shadow } from "./src/theme/theme";
import type { IngredientCandidate, InventoryItem, Plan, RecommendationSections, Recipe } from "./src/types/models";

type Tab = "today" | "inventory" | "assistant" | "plans" | "settings";

const emptySections: RecommendationSections = { cookRightNow: [], almostThere: [], creative: [] };
const heroPhoto = "https://commons.wikimedia.org/wiki/Special:FilePath/Hyderabadi_Chicken_Biryani.jpg";

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("pro_monthly");
  const [sections, setSections] = useState<RecommendationSections>(emptySections);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantReply, setAssistantReply] = useState("Ask me what to cook, what to buy, or how to use ingredients before they expire.");
  const [voiceText, setVoiceText] = useState("I have 2 onions, half kilo chicken and 1 kg rice.");
  const [candidates, setCandidates] = useState<IngredientCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [planResult, recommendationResult] = await Promise.all([api.plans(), api.recommendations()]);
    setPlans(planResult.plans);
    setSections(recommendationResult.sections);
    try {
      const inventoryResult = await api.inventory();
      setInventory(inventoryResult.items);
    } catch {
      setInventory([]);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const activeRecipes = useMemo(() => {
    return [...sections.cookRightNow, ...sections.almostThere, ...sections.creative];
  }, [sections]);

  async function parseVoice() {
    setLoading(true);
    try {
      const result = await api.parseVoice(voiceText);
      setCandidates(result.candidates);
    } finally {
      setLoading(false);
    }
  }

  async function simulatePhoto() {
    setLoading(true);
    try {
      const result = await api.detectPhoto("https://commons.wikimedia.org/wiki/Special:FilePath/Tomatoes_plain_and_sliced.jpg");
      setCandidates(result.candidates);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCandidates() {
    await api.addInventoryItems(candidates.map(candidate => ({ ...candidate, confirmed: true })));
    setCandidates([]);
    await refresh();
  }

  async function askAssistant() {
    if (!assistantInput.trim()) return;
    setLoading(true);
    try {
      const result = await api.assistant([{ role: "user", content: assistantInput }]);
      setAssistantReply(result.message);
      setAssistantInput("");
    } finally {
      setLoading(false);
    }
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.screen}>
          <Image source={{ uri: heroPhoto }} style={styles.onboardingImage} />
          <Text style={styles.eyebrow}>SmartChef AI</Text>
          <Text style={styles.heroTitle}>Never wonder what to cook again.</Text>
          <Text style={styles.body}>Get a 7-day Pro trial with recipes, inventory, photo recognition, voice inventory, AI meal ideas, and shopping lists unlocked.</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Choose what you would keep after trial</Text>
            {plans.map(plan => (
              <TouchableOpacity key={plan.id} style={[styles.planCard, selectedPlan === plan.id && styles.selected]} onPress={() => setSelectedPlan(plan.id)}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{plan.name}</Text>
                  <Text style={styles.price}>{plan.price}</Text>
                </View>
                <Text style={styles.muted}>{plan.features.join(" · ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setOnboarded(true)}>
            <Text style={styles.primaryText}>Start 7-day Pro trial</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.appbar}>
        <View>
          <Text style={styles.eyebrow}>7-day Pro trial active</Text>
          <Text style={styles.title}>SmartChef</Text>
        </View>
      </View>
      <View style={styles.tabs}>
        {(["today", "inventory", "assistant", "plans", "settings"] as Tab[]).map(item => (
          <TouchableOpacity key={item} style={[styles.tab, tab === item && styles.activeTab]} onPress={() => setTab(item)}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "today" && (
          <>
            <RecipeSection title="Cook Right Now" recipes={sections.cookRightNow} onOpen={setRecipe} />
            <RecipeSection title="Almost There" recipes={sections.almostThere} onOpen={setRecipe} />
            <RecipeSection title="Creative AI Suggestions" recipes={sections.creative} onOpen={setRecipe} />
          </>
        )}
        {tab === "inventory" && (
          <>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Voice inventory</Text>
              <TextInput style={styles.input} value={voiceText} onChangeText={setVoiceText} multiline />
              <TouchableOpacity style={styles.primaryButton} onPress={parseVoice}>
                <Text style={styles.primaryText}>{loading ? "Extracting..." : "Extract ingredients"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={simulatePhoto}>
                <Text style={styles.secondaryText}>Simulate photo recognition</Text>
              </TouchableOpacity>
            </View>
            {candidates.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Confirm detected ingredients</Text>
                {candidates.map(candidate => (
                  <Text key={`${candidate.displayName}-${candidate.source}`} style={styles.body}>{candidate.displayName} · {candidate.quantity} · {Math.round(candidate.confidence * 100)}%</Text>
                ))}
                <TouchableOpacity style={styles.primaryButton} onPress={confirmCandidates}>
                  <Text style={styles.primaryText}>Add confirmed ingredients</Text>
                </TouchableOpacity>
              </View>
            )}
            {inventory.map(item => (
              <View key={item.id} style={styles.rowCard}>
                <View>
                  <Text style={styles.cardTitle}>{item.displayName}</Text>
                  <Text style={styles.muted}>{item.quantity} · {item.category}</Text>
                </View>
                <Text style={styles.badge}>{item.source}</Text>
              </View>
            ))}
          </>
        )}
        {tab === "assistant" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ask SmartChef</Text>
            <Text style={styles.body}>{assistantReply}</Text>
            <TextInput style={styles.input} placeholder="What can I cook with chicken and rice?" value={assistantInput} onChangeText={setAssistantInput} />
            <TouchableOpacity style={styles.primaryButton} onPress={askAssistant}>
              <Text style={styles.primaryText}>{loading ? "Thinking..." : "Ask assistant"}</Text>
            </TouchableOpacity>
          </View>
        )}
        {tab === "plans" && (
          <>
            <Text style={styles.sectionTitle}>Plans after trial</Text>
            {plans.map(plan => (
              <TouchableOpacity key={plan.id} style={[styles.planCard, selectedPlan === plan.id && styles.selected]} onPress={() => setSelectedPlan(plan.id)}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{plan.name}</Text>
                  <Text style={styles.price}>{plan.price}</Text>
                </View>
                <Text style={styles.muted}>{plan.features.join(" · ")}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.muted}>RevenueCat will power purchases, restore purchases, and entitlement checks in production.</Text>
          </>
        )}
        {tab === "settings" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.body}>Account, privacy policy, terms, restore purchases, support, and delete account belong here for store review.</Text>
          </View>
        )}
      </ScrollView>
      {recipe && <RecipeModal recipe={recipe} onClose={() => setRecipe(null)} />}
    </SafeAreaView>
  );
}

function RecipeSection({ title, recipes, onOpen }: { title: string; recipes: Recipe[]; onOpen: (recipe: Recipe) => void }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {recipes.map(recipe => (
        <TouchableOpacity key={`${title}-${recipe.id}`} style={styles.recipeCard} onPress={() => onOpen(recipe)}>
          {recipe.photoUrl ? <Image source={{ uri: recipe.photoUrl }} style={styles.recipeImage} /> : <View style={styles.recipeImageFallback} />}
          <View style={styles.recipeCopy}>
            <Text style={styles.cardTitle}>{recipe.title}</Text>
            <Text style={styles.muted}>{recipe.cookingTimeMinutes} min · {recipe.skillLevel} · {recipe.ingredients.length} ingredients</Text>
            {recipe.missingIngredients?.length ? <Text style={styles.warning}>Missing: {recipe.missingIngredients.join(", ")}</Text> : null}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <View style={styles.modalOverlay}>
      <ScrollView style={styles.modal}>
        {recipe.photoUrl ? <Image source={{ uri: recipe.photoUrl }} style={styles.modalImage} /> : null}
        <Text style={styles.eyebrow}>Recipe</Text>
        <Text style={styles.heroTitle}>{recipe.title}</Text>
        <Text style={styles.body}>{recipe.cookingTimeMinutes} min · {recipe.equipment}</Text>
        {recipe.photoCredit ? <Text style={styles.photoCredit}>{recipe.photoCredit}</Text> : null}
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map(item => <Text key={item} style={styles.body}>- {item}</Text>)}
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((step, index) => <Text key={step} style={styles.body}>{index + 1}. {step}</Text>)}
        <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
          <Text style={styles.primaryText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { padding: 22, gap: 18 },
  content: { padding: 16, gap: 14, paddingBottom: 80 },
  appbar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  tabs: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  tab: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.surface },
  activeTab: { backgroundColor: colors.brand },
  tabText: { color: colors.muted, textTransform: "capitalize", fontWeight: "700", fontSize: 12 },
  activeTabText: { color: "#fff" },
  eyebrow: { color: colors.brandDark, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  heroTitle: { color: colors.ink, fontSize: 34, lineHeight: 38, fontWeight: "900" },
  title: { color: colors.ink, fontSize: 28, fontWeight: "900" },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 8 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  warning: { color: colors.accent, fontSize: 13, fontWeight: "800", marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 12, ...shadow },
  onboardingImage: { width: "100%", height: 210, borderRadius: 18, backgroundColor: colors.line },
  recipeCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 10, marginBottom: 10, flexDirection: "row", gap: 12, alignItems: "center", ...shadow },
  recipeImage: { width: 92, height: 92, borderRadius: 10, backgroundColor: colors.line },
  recipeImageFallback: { width: 92, height: 92, borderRadius: 10, backgroundColor: "#eaf6ef" },
  recipeCopy: { flex: 1 },
  rowCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", ...shadow },
  planCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  selected: { borderColor: colors.brand, backgroundColor: "#ecfff6" },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  price: { color: colors.brandDark, fontSize: 16, fontWeight: "900" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  primaryButton: { backgroundColor: colors.brand, padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondaryButton: { backgroundColor: "#eaf6ef", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 6 },
  secondaryText: { color: colors.brandDark, fontWeight: "900" },
  input: { backgroundColor: "#f6f1e8", minHeight: 48, borderRadius: 12, padding: 12, color: colors.ink },
  badge: { backgroundColor: "#eaf6ef", color: colors.brandDark, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "900" },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,28,22,0.45)", padding: 16, justifyContent: "center" },
  modal: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, maxHeight: "88%" },
  modalImage: { width: "100%", height: 220, borderRadius: 16, marginBottom: 14, backgroundColor: colors.line },
  photoCredit: { color: colors.muted, fontSize: 11, marginBottom: 8 }
});
