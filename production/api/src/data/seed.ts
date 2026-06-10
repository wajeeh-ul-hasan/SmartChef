import type { InventoryItem, Recipe, UserProfile } from "../domain/types.js";

const photoBase = "https://commons.wikimedia.org/wiki/Special:FilePath/";

export const defaultProfile: UserProfile = {
  cuisines: ["Desi / Pakistani", "Indian", "Italian", "Chinese"],
  dietaryPreferences: ["Halal"],
  cookingSkill: "beginner",
  lifestyles: ["International Student"],
  cookingTimePreference: "10-20 Minutes",
  householdSize: 1
};

export const starterPacks = {
  "Desi / Pakistani": [
    ["Onions", "2 kg", "Vegetables"],
    ["Tomatoes", "1 kg", "Vegetables"],
    ["Garlic", "250 g", "Vegetables"],
    ["Ginger", "250 g", "Vegetables"],
    ["Green Chillies", "150 g", "Vegetables"],
    ["Coriander", "1 bunch", "Herbs"],
    ["Turmeric", "200 g", "Spices"],
    ["Red Chilli Powder", "200 g", "Spices"],
    ["Garam Masala", "150 g", "Spices"],
    ["Cumin", "200 g", "Spices"],
    ["Cooking Oil", "2 L", "Pantry"],
    ["Rice", "5 kg", "Grains"],
    ["Flour", "5 kg", "Grains"],
    ["Chicken", "2 kg", "Protein"]
  ],
  Italian: [
    ["Pasta", "1 kg", "Grains"],
    ["Olive Oil", "750 ml", "Pantry"],
    ["Garlic", "250 g", "Vegetables"],
    ["Parmesan", "200 g", "Dairy"],
    ["Tomatoes", "1 kg", "Vegetables"],
    ["Basil", "1 bunch", "Herbs"],
    ["Mozzarella", "300 g", "Dairy"]
  ],
  Chinese: [
    ["Soy Sauce", "500 ml", "Condiments"],
    ["Garlic", "250 g", "Vegetables"],
    ["Ginger", "250 g", "Vegetables"],
    ["Spring Onion", "2 bunches", "Vegetables"],
    ["Rice", "5 kg", "Grains"],
    ["Corn Flour", "500 g", "Pantry"],
    ["Vinegar", "500 ml", "Condiments"]
  ]
} as const;

export const seedInventory: InventoryItem[] = [
  {
    id: "inv_spinach",
    displayName: "Spinach",
    quantity: "300 g",
    category: "Vegetables",
    source: "manual",
    confidence: 1,
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    confirmed: true
  },
  {
    id: "inv_eggs",
    displayName: "Eggs",
    quantity: "6",
    category: "Protein",
    source: "manual",
    confidence: 1,
    expiresAt: new Date(Date.now() + 8 * 86400000).toISOString(),
    confirmed: true
  },
  {
    id: "inv_potatoes",
    displayName: "Potatoes",
    quantity: "1 kg",
    category: "Vegetables",
    source: "manual",
    confidence: 1,
    expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    confirmed: true
  }
];

export const recipes: Recipe[] = [
  {
    id: "egg-fried-rice",
    title: "Egg Fried Rice",
    photoUrl: `${photoBase}Egg_fried_rice.jpg`,
    photoCredit: "Photo: ProjectManhattan / Wikimedia Commons",
    cuisine: "Chinese",
    dietaryTags: ["halal", "quick"],
    skillLevel: "beginner",
    cookingTimeMinutes: 15,
    ingredients: ["Rice", "Eggs", "Soy Sauce", "Spring Onion"],
    instructions: [
      "Heat oil in a pan on medium-high heat.",
      "Scramble the eggs until just set.",
      "Add cooked rice and break up clumps.",
      "Stir in soy sauce and pepper for 2-3 minutes.",
      "Finish with sliced spring onion."
    ],
    nutrition: "Approx. 430 calories, 18g protein",
    equipment: "Pan or wok"
  },
  {
    id: "omelette-paratha-roll",
    title: "Omelette Paratha Roll",
    photoUrl: `${photoBase}Denver_omelette.jpg`,
    photoCredit: "Photo: Ruth Hartnup / Wikimedia Commons",
    cuisine: "Desi / Pakistani",
    dietaryTags: ["halal", "quick"],
    skillLevel: "beginner",
    cookingTimeMinutes: 12,
    ingredients: ["Eggs", "Flour", "Onions", "Green Chillies"],
    instructions: [
      "Beat eggs with onion, green chilli, coriander, and salt.",
      "Cook the omelette in a lightly oiled pan.",
      "Warm the paratha or roti.",
      "Place the omelette on the paratha and roll tightly.",
      "Toast for 1 minute on each side."
    ],
    nutrition: "Approx. 480 calories, 22g protein",
    equipment: "Pan"
  },
  {
    id: "karahi-chicken",
    title: "Karahi Chicken",
    photoUrl: `${photoBase}Chicken_Karahi.JPG`,
    photoCredit: "Photo: Miansari66 / Wikimedia Commons",
    cuisine: "Desi / Pakistani",
    dietaryTags: ["halal", "high protein"],
    skillLevel: "intermediate",
    cookingTimeMinutes: 35,
    ingredients: ["Chicken", "Tomatoes", "Ginger", "Garlic"],
    instructions: [
      "Sear chicken in oil until lightly browned.",
      "Add ginger and garlic, then cook for 1 minute.",
      "Add tomatoes, spices, and salt.",
      "Simmer uncovered until the sauce thickens.",
      "Finish with coriander and serve with roti or rice."
    ],
    nutrition: "Approx. 430 calories per serving, 42g protein",
    equipment: "Deep pan"
  },
  {
    id: "spinach-pasta-korma",
    title: "Spinach Pasta Korma",
    photoUrl: `${photoBase}Aglio_e_olio.jpg`,
    photoCredit: "Photo: Jbarta / Wikimedia Commons",
    cuisine: "Fusion",
    dietaryTags: ["halal", "use soon"],
    skillLevel: "beginner",
    cookingTimeMinutes: 24,
    ingredients: ["Spinach", "Pasta", "Garlic", "Yogurt"],
    instructions: [
      "Boil pasta until just tender.",
      "Cook garlic and spinach until wilted.",
      "Add yogurt, cumin, salt, and pepper on low heat.",
      "Add pasta and a splash of pasta water.",
      "Toss until creamy."
    ],
    nutrition: "Approx. 470 calories, 17g protein",
    equipment: "Pot and pan",
    aiGenerated: true
  }
];
