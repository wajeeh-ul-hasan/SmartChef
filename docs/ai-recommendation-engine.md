# AI Recommendation Engine Architecture

## Inputs
- User profile: cuisines, diet, skill level, lifestyles, time preference, household size, budget.
- Inventory: ingredient names, quantities, categories, expiry dates, confidence, source.
- History: viewed, cooked, liked, disliked, saved, shared recipes.
- Subscription entitlement: free trial, Premium, expired.
- Context: day of week, meal slot, local seasonal ingredients, budget mode.

## Pipeline
```mermaid
flowchart LR
  A["Profile + Inventory"] --> B["Eligibility Filters"]
  B --> C["Inventory Match Scoring"]
  C --> D["Waste Priority Boost"]
  D --> E["Lifestyle / Time Ranking"]
  E --> F["Diversity and Novelty Layer"]
  F --> G["LLM Explanation and Creative Generation"]
  G --> H["Safety, Diet, and Cost Validation"]
  H --> I["Recommendation Sections"]
```

## Ranking Formula
```text
score =
  0.30 inventory_match
+ 0.18 expiry_priority
+ 0.16 preference_fit
+ 0.12 cooking_time_fit
+ 0.10 dietary_fit
+ 0.08 budget_fit
+ 0.06 novelty_or_diversity
- 0.20 disliked_similarity_penalty
```

## Categories
- Cook Right Now: all required ingredients are present or substitutions are available.
- Almost There: recipe needs 1-3 missing ingredients, surfaced with a shopping-list action.
- Creative AI Suggestions: generated or remixed ideas that use the user's current inventory in surprising combinations.

## Quick Meals Mode
Enabled when lifestyle includes International Student, Bachelor / Living Alone, Working Professional, or cooking time is under 20 minutes.

Ranking boosts:
- Under 10-20 minutes.
- One-pot, microwave, air fryer, or dorm-friendly method.
- Low ingredient count.
- Low estimated cost per serving.
- Minimal cleanup.
- High protein when relevant.

## AI Components
- Voice inventory parser: speech-to-text followed by structured extraction to ingredients, quantities, units, and confidence.
- Vision inventory parser: image recognition for grocery items, estimated quantities, category, and confirmation queue.
- Receipt parser: OCR plus grocery normalization and quantity extraction.
- Recipe generator: creates name, ingredients, instructions, nutrition facts, cooking time, difficulty, and cost.
- Explanation generator: produces concise "why this recipe" text.

## Guardrails
- Enforce dietary restrictions after generation.
- Validate recipe ingredients against known food taxonomy.
- Block unsafe cooking instructions.
- Require confidence thresholds for automatic inventory insertions.
- Prefer confirmation for low-confidence photo and receipt detections.
- Never recommend non-halal items when Halal is selected.
