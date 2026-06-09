const starterPacks = {
  "Desi / Pakistani": [
    ["Onions", "2 kg"], ["Tomatoes", "1 kg"], ["Garlic", "250 g"], ["Ginger", "250 g"],
    ["Green Chillies", "150 g"], ["Coriander", "1 bunch"], ["Turmeric", "200 g"],
    ["Red Chilli Powder", "200 g"], ["Garam Masala", "150 g"], ["Cumin", "200 g"],
    ["Cooking Oil", "2 L"], ["Rice", "5 kg"], ["Flour", "5 kg"], ["Chicken", "2 kg"]
  ],
  Italian: [["Pasta", "1 kg"], ["Olive Oil", "750 ml"], ["Garlic", "250 g"], ["Parmesan", "200 g"], ["Tomatoes", "1 kg"], ["Basil", "1 bunch"], ["Mozzarella", "300 g"]],
  Chinese: [["Soy Sauce", "500 ml"], ["Garlic", "250 g"], ["Ginger", "250 g"], ["Spring Onion", "2 bunches"], ["Rice", "5 kg"], ["Corn Flour", "500 g"], ["Vinegar", "500 ml"]]
};

const recipes = {
  quick: [
    ["Egg Fried Rice", "15 min", "$1.70", "Beginner", ["Rice", "Eggs", "Soy Sauce", "Spring Onion"]],
    ["Chicken Wrap", "18 min", "$2.10", "Beginner", ["Chicken", "Flour", "Onions", "Tomatoes"]],
    ["Garlic Butter Pasta", "17 min", "$1.90", "Beginner", ["Pasta", "Garlic", "Butter", "Parmesan"]],
    ["High Protein Omelette", "9 min", "$1.30", "Beginner", ["Eggs", "Onions", "Tomatoes"]]
  ],
  desi: [
    ["Omelette Paratha Roll", "12 min", "$1.40", "Beginner", ["Eggs", "Flour", "Onions", "Green Chillies"]],
    ["Chicken Biryani", "40 min", "$2.60", "Intermediate", ["Chicken", "Rice", "Tomatoes", "Garam Masala"]],
    ["Karahi Chicken", "35 min", "$2.80", "Intermediate", ["Chicken", "Tomatoes", "Ginger", "Garlic"]],
    ["Masala Fries", "16 min", "$0.90", "Beginner", ["Potatoes", "Red Chilli Powder", "Cumin"]]
  ],
  creative: [
    ["Turkish Yogurt Chicken Bake", "38 min", "$2.70", "Intermediate", ["Chicken", "Yogurt", "Potatoes"]],
    ["Creamy Desi Chicken Casserole", "32 min", "$2.45", "Beginner", ["Chicken", "Yogurt", "Rice"]],
    ["Spinach Pasta Korma", "24 min", "$1.95", "Beginner", ["Spinach", "Pasta", "Garlic"]]
  ]
};

const planModes = ["Budget", "Healthy", "Family", "High Protein", "Weight Loss", "Student", "Bachelor"];
const defaultFeedback = [
  {
    rating: 4,
    problem: "I never know what to cook after work.",
    feature: "Cook Right Now section",
    pay: "If the app gives me quick meals from food I already have."
  }
];

stateSafeDefaults();

function stateSafeDefaults() {
  const raw = JSON.parse(localStorage.getItem("smartchef-state") || "null");
  if (!raw) return;
  if (!raw.feedback) raw.feedback = defaultFeedback;
  localStorage.setItem("smartchef-state", JSON.stringify(raw));
}

const onboardingSteps = [
  {
    key: "welcome",
    render: () => `
      <div class="onboarding-hero">
        <div class="welcome-art" aria-hidden="true"></div>
        <div>
          <p class="eyebrow">SmartChef AI</p>
          <h2>Never wonder what to cook again.</h2>
        </div>
        <div class="benefits">
          ${["Daily meal recommendations", "AI-powered recipe suggestions", "Smart ingredient tracking", "Reduce food waste", "Discover new dishes", "Quick meals for busy lifestyles"].map(item => `<div class="benefit">${item}</div>`).join("")}
        </div>
      </div>`
  },
  { key: "cuisines", title: "Select Preferred Cuisines", multi: true, options: ["Desi / Pakistani", "Indian", "Italian", "Chinese", "Thai", "Mexican", "Turkish", "Mediterranean", "Arabic", "American", "Japanese", "Korean", "Vegetarian", "Vegan"] },
  { key: "diet", title: "Dietary Preferences", multi: true, options: ["No restrictions", "Halal", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "High Protein"] },
  { key: "skill", title: "Cooking Skill Level", multi: false, options: ["Beginner", "Intermediate", "Advanced"] },
  { key: "lifestyle", title: "Lifestyle Selection", multi: true, options: ["Student", "International Student", "Bachelor / Living Alone", "Working Professional", "Family Household", "Fitness Enthusiast"] },
  { key: "time", title: "Available Cooking Time", multi: false, options: ["Under 10 Minutes", "10-20 Minutes", "20-40 Minutes", "40+ Minutes"] },
  {
    key: "trial",
    render: () => `
      <div class="onboarding-hero">
        <div class="premium-card">
          <p class="eyebrow">Free Premium Trial</p>
          <h3>Enjoy SmartChef AI Premium FREE for 7 days.</h3>
          <p>Explore unlimited AI recipes, meal plans, nutrition tracking, shopping optimization, and personalized recommendations before choosing a subscription.</p>
        </div>
        <div class="benefits">
          ${["No feature restrictions during trial", "Full access to Premium AI capabilities", "Cancel anytime before trial ends", "Reminder before billing begins"].map(item => `<div class="benefit">${item}</div>`).join("")}
        </div>
      </div>`
  }
];

const state = JSON.parse(localStorage.getItem("smartchef-state") || "null") || {
  step: 0,
  profile: { cuisines: ["Desi / Pakistani"], diet: ["Halal"], skill: "Beginner", lifestyle: ["International Student"], time: "10-20 Minutes" },
  inventory: [
    { name: "Spinach", quantity: "300 g", expiry: 2 },
    { name: "Eggs", quantity: "6", expiry: 8 },
    { name: "Potatoes", quantity: "1 kg", expiry: 6 }
  ],
  trialStarted: false,
  selectedPlan: "",
  selectedRating: 0
};

if (!state.feedback) state.feedback = defaultFeedback;
if (!state.selectedRating) state.selectedRating = 0;

const save = () => localStorage.setItem("smartchef-state", JSON.stringify(state));
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function renderOnboarding() {
  const step = onboardingSteps[state.step];
  $("#progressBar").style.width = `${((state.step + 1) / onboardingSteps.length) * 100}%`;
  $("#backBtn").disabled = state.step === 0;
  $("#nextBtn").textContent = state.step === onboardingSteps.length - 1 ? "Enter SmartChef" : "Continue";

  if (step.render) {
    $("#onboardingContent").innerHTML = step.render();
    return;
  }

  const current = state.profile[step.key];
  $("#onboardingContent").innerHTML = `
    <div class="onboarding-hero">
      <div>
        <p class="eyebrow">Step ${state.step + 1} of ${onboardingSteps.length}</p>
        <h2>${step.title}</h2>
      </div>
      <div class="choice-grid">
        ${step.options.map(option => {
          const selected = Array.isArray(current) ? current.includes(option) : current === option;
          return `<button class="choice ${selected ? "selected" : ""}" data-choice="${option}">${option}</button>`;
        }).join("")}
      </div>
    </div>`;

  $$(".choice").forEach(button => {
    button.addEventListener("click", () => {
      const value = button.dataset.choice;
      if (step.multi) {
        const next = new Set(state.profile[step.key] || []);
        next.has(value) ? next.delete(value) : next.add(value);
        state.profile[step.key] = Array.from(next);
      } else {
        state.profile[step.key] = value;
      }
      save();
      renderOnboarding();
    });
  });
}

function completeOnboarding() {
  runTransition(() => {
    $("#onboarding").classList.remove("active-screen");
    $("#home").classList.add("active-screen");
    renderHome();
  });
}

function scoreRecipe(recipe) {
  const names = state.inventory.map(i => i.name.toLowerCase());
  const available = recipe[4].filter(ingredient => names.includes(ingredient.toLowerCase()));
  return { available, missing: recipe[4].filter(ingredient => !names.includes(ingredient.toLowerCase())) };
}

function card(recipe, action = "Save") {
  return `<article class="recipe-card" data-open-recipe="${recipe[0]}">
    ${foodVisual(recipe[0], "thumb")}
    <div>
      <h4>${recipe[0]}</h4>
      <p>${recipe[1]} · ${recipe[2]} · ${recipe[3]} · ${recipe[4].length} ingredients</p>
    </div>
    <button class="tiny-btn" data-recipe="${recipe[0]}">${action}</button>
  </article>`;
}

function renderHome() {
  const quickMode = ["International Student", "Bachelor / Living Alone", "Working Professional"].some(item => state.profile.lifestyle.includes(item));
  const all = quickMode ? [...recipes.quick, ...recipes.desi] : [...recipes.desi, ...recipes.quick];
  const cookNow = all.filter(recipe => scoreRecipe(recipe).missing.length === 0).slice(0, 3);
  const almost = all.filter(recipe => {
    const missing = scoreRecipe(recipe).missing.length;
    return missing > 0 && missing <= 3;
  }).slice(0, 4);

  const hero = all[0];
  $("#greetingTitle").textContent = quickMode ? "Quick meals for busy days" : "Cook with what you have";
  $("#heroRecipe").textContent = hero[0];
  $("#heroMeta").textContent = `${hero[1]} · ${hero[2]} · ${hero[3]}`;
  $("#heroFoodVisual").innerHTML = foodVisual(hero[0], "hero");
  $("#inventoryCount").textContent = state.inventory.length;
  $("#wasteCount").textContent = state.inventory.filter(item => item.expiry <= 3).length;
  $("#cookNow").innerHTML = (cookNow.length ? cookNow : all.slice(0, 2)).map(recipe => card(recipe)).join("");
  $("#almostThere").innerHTML = almost.map(recipe => {
    const missing = scoreRecipe(recipe).missing.join(", ");
    return card([recipe[0], recipe[1], recipe[2], recipe[3], [`Missing: ${missing}`]], "Shop");
  }).join("");
  $("#creativeIdeas").innerHTML = recipes.creative.map(recipe => card(recipe, "Try")).join("");
  bindRecipeCards();
  renderInventory();
  renderPlan();
  renderFeedback();
}

function bindRecipeCards() {
  $$("[data-open-recipe]").forEach(cardEl => {
    cardEl.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      const title = cardEl.dataset.openRecipe;
      const recipe = [...recipes.quick, ...recipes.desi, ...recipes.creative].find(item => item[0] === title);
      if (recipe) openRecipe(recipe);
    });
  });
}

function openRecipe(recipe) {
  const dialog = $("#recipeDialog");
  $("#recipeDialogContent").innerHTML = `
    <button class="dialog-close" aria-label="Close recipe">Close</button>
    <div class="dialog-food">${foodVisual(recipe[0], "large")}</div>
    <p class="eyebrow">AI recipe idea</p>
    <h2>${recipe[0]}</h2>
    <p class="dialog-meta">${recipe[1]} · ${recipe[2]} per serving · ${recipe[3]}</p>
    <div class="ingredient-pills">${recipe[4].map(item => `<span>${item}</span>`).join("")}</div>
    <ol class="recipe-steps">
      <li>Prep ingredients and keep everything within reach.</li>
      <li>Cook the base flavors first, then add the main ingredient.</li>
      <li>Finish, taste, and save this recipe if it worked for your routine.</li>
    </ol>
    <div class="dialog-actions">
      <button class="ghost-btn">Not for me</button>
      <button class="primary-btn">I would cook this</button>
    </div>`;
  dialog.showModal();
  $(".dialog-close").addEventListener("click", () => dialog.close());
}

function foodVisual(title, size = "thumb") {
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const seeds = {
    "omelette-paratha-roll": ["#f5c04f", "#f8eee1", "#2f9d64", "#c93d28"],
    "chicken-biryani": ["#f1b03b", "#fff6dc", "#bd5a24", "#2f9d64"],
    "karahi-chicken": ["#b93d2f", "#e77a32", "#2f9d64", "#f7d36a"],
    "masala-fries": ["#f2c04c", "#d94e2e", "#fff0b8", "#753019"],
    "egg-fried-rice": ["#f6d26b", "#f7f2dd", "#2f9d64", "#d66a35"],
    "garlic-butter-pasta": ["#f0bd4b", "#fff2c5", "#e9e1b0", "#2f9d64"],
    "chicken-wrap": ["#e9c48a", "#f8efe2", "#d95d35", "#2f9d64"],
    "turkish-yogurt-chicken-bake": ["#e7d0a8", "#fff7ea", "#c65438", "#74a35e"],
    "creamy-desi-chicken-casserole": ["#dfa051", "#ffe1ad", "#9b3d2e", "#2f9d64"],
    "spinach-pasta-korma": ["#3f9d5a", "#f0c659", "#fff3cc", "#225a38"],
    "high-protein-omelette": ["#f5c04f", "#fff0b5", "#d65138", "#2f9d64"],
    "chicken-rice-bowl": ["#f6f1db", "#d95d35", "#2f9d64", "#f2b84b"],
    "tuna-rice-bowl": ["#f6f1db", "#c8d0d6", "#2f9d64", "#d65138"]
  };
  const [a, b, c, d] = seeds[slug] || ["#f2b84b", "#fff2c5", "#1ea672", "#ff6b35"];
  return `
    <div class="food-icon ${size}" data-dish="${slug}" aria-hidden="true">
      <svg viewBox="0 0 120 120" role="img">
        <defs>
          <radialGradient id="plate-${slug}-${size}" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#e8e1d3"/>
          </radialGradient>
          <filter id="shadow-${slug}-${size}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#1a211c" flood-opacity="0.22"/>
          </filter>
        </defs>
        <circle cx="60" cy="60" r="52" fill="url(#plate-${slug}-${size})" filter="url(#shadow-${slug}-${size})"/>
        <circle cx="60" cy="60" r="39" fill="${b}"/>
        <path d="M31 72 C42 48, 67 41, 92 58 C85 86, 49 92, 31 72Z" fill="${a}"/>
        <path d="M30 58 C44 43, 68 39, 93 52" fill="none" stroke="${d}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="47" cy="54" r="7" fill="${c}"/>
        <circle cx="67" cy="68" r="8" fill="${d}"/>
        <circle cx="78" cy="52" r="6" fill="${c}"/>
        <path d="M38 78 C52 85, 75 86, 92 72" fill="none" stroke="rgba(255,255,255,.78)" stroke-width="5" stroke-linecap="round"/>
        <g opacity=".7">
          <circle cx="43" cy="68" r="2.2" fill="#ffffff"/>
          <circle cx="58" cy="49" r="2.2" fill="#ffffff"/>
          <circle cx="82" cy="65" r="2.2" fill="#ffffff"/>
        </g>
      </svg>
    </div>`;
}

function selectedPackName() {
  return state.profile.cuisines.find(cuisine => starterPacks[cuisine]) || "Desi / Pakistani";
}

function renderInventoryMethod(method = document.querySelector(".segment.active")?.dataset.method || "packs") {
  const wrap = $("#inventoryMethod");
  if (method === "packs") {
    const packName = selectedPackName();
    wrap.innerHTML = `<div class="mode-card">
      <h3>${packName === "Desi / Pakistani" ? "Essential Desi Ingredients" : `${packName} Starter Pack`}</h3>
      <div class="pack-grid">
        ${starterPacks[packName].map(([name, qty]) => `<label class="pack-row"><span>${name}</span><input value="${qty}" data-pack-item="${name}"></label>`).join("")}
      </div>
      <button id="addPackBtn" class="primary-btn" style="width:100%;margin-top:12px">Add all ingredients</button>
    </div>`;
    $("#addPackBtn").addEventListener("click", () => {
      $$("[data-pack-item]").forEach(input => addIngredient(input.dataset.packItem, input.value));
      renderHome();
    });
  }

  if (method === "manual") {
    wrap.innerHTML = `<div class="form-stack">
      <input id="manualName" class="input" placeholder="Ingredient, e.g. Chicken">
      <input id="manualQty" class="input" placeholder="Quantity, e.g. 2 kg">
      <button id="manualAdd" class="primary-btn">Add ingredient</button>
    </div>`;
    $("#manualAdd").addEventListener("click", () => {
      addIngredient($("#manualName").value || "Ingredient", $("#manualQty").value || "1 unit");
      renderHome();
    });
  }

  if (method === "voice") {
    wrap.innerHTML = `<div class="form-stack">
      <textarea id="voiceText" rows="4">I have 2 onions, half a kilo chicken and 1 kg rice.</textarea>
      <button id="parseVoice" class="primary-btn">Extract ingredients</button>
    </div>`;
    $("#parseVoice").addEventListener("click", () => {
      const text = $("#voiceText").value.toLowerCase();
      [["Onions", text.includes("onion") ? "2" : ""], ["Chicken", text.includes("chicken") ? "0.5 kg" : ""], ["Rice", text.includes("rice") ? "1 kg" : ""]]
        .filter(item => item[1])
        .forEach(item => addIngredient(item[0], item[1]));
      renderHome();
    });
  }

  if (method === "scan") {
    wrap.innerHTML = `<div class="form-stack">
      <button id="photoScan" class="primary-btn">Simulate grocery photo recognition</button>
      <button id="receiptScan" class="ghost-btn">Simulate receipt scanning</button>
      <p class="caption">Prototype simulates Vision API extraction and asks for confirmation in the inventory list.</p>
    </div>`;
    $("#photoScan").addEventListener("click", () => {
      [["Tomatoes", "1 kg"], ["Garlic", "250 g"], ["Basil", "1 bunch"]].forEach(item => addIngredient(item[0], item[1]));
      renderHome();
    });
    $("#receiptScan").addEventListener("click", () => {
      [["Pasta", "1 kg"], ["Olive Oil", "750 ml"], ["Mozzarella", "300 g"]].forEach(item => addIngredient(item[0], item[1]));
      renderHome();
    });
  }
}

function addIngredient(name, quantity) {
  const clean = name.trim();
  if (!clean) return;
  const existing = state.inventory.find(item => item.name.toLowerCase() === clean.toLowerCase());
  if (existing) existing.quantity = quantity;
  else state.inventory.push({ name: clean, quantity, expiry: Math.max(2, Math.ceil(Math.random() * 12)) });
  save();
}

function renderInventory() {
  renderInventoryMethod();
  $("#inventoryList").innerHTML = state.inventory.map(item => `<article class="inventory-item">
    <div><h4>${item.name}</h4><p>${item.quantity}</p></div>
    <span class="expiry">${item.expiry <= 3 ? `Use in ${item.expiry} days` : `${item.expiry} days`}</span>
  </article>`).join("");
}

function renderPlan(mode = "Student") {
  $("#planModes").innerHTML = planModes.map(item => `<button class="mode-btn ${item === mode ? "active" : ""}" data-plan-mode="${item}">${item} Mode</button>`).join("");
  const meals = mode === "High Protein" ? ["High Protein Omelette", "Chicken Rice Bowl", "Karahi Chicken"] :
    mode === "Budget" ? ["Masala Fries", "Egg Fried Rice", "Garlic Butter Pasta"] :
    ["Omelette Paratha Roll", "Chicken Wrap", "Tuna Rice Bowl"];
  $("#weeklyPlan").innerHTML = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => `<article class="plan-day"><h4>${day}</h4><p>${meals[index % meals.length]} · ${mode} optimized</p></article>`).join("");
  $("#shoppingList").innerHTML = [["Cream", "300 ml", "$1.20"], ["Parmesan", "200 g", "$2.40"], ["Yogurt", "500 g", "$1.10"], ["Spinach", "300 g", "$1.30"]]
    .map(item => `<article class="shopping-item"><span>${item[0]} · ${item[1]}</span><strong>${item[2]}</strong></article>`).join("");
  $$("[data-plan-mode]").forEach(button => button.addEventListener("click", () => renderPlan(button.dataset.planMode)));
}

function renderFeedback() {
  $("#feedbackList").innerHTML = state.feedback.map((item, index) => `<article class="feedback-note">
    <strong>Customer ${index + 1}</strong>
    <p><b>Weekly use rating:</b> ${item.rating || "Not rated"}/5</p>
    <p><b>Problem:</b> ${item.problem}</p>
    <p><b>Best feature:</b> ${item.feature}</p>
    <p><b>Would pay if:</b> ${item.pay}</p>
  </article>`).join("");
  $$(".rating-btn").forEach(button => {
    button.classList.toggle("active", Number(button.dataset.rating) === state.selectedRating);
  });
}

function saveFeedbackNote() {
  const note = {
    rating: state.selectedRating || "Not rated",
    problem: $("#feedbackProblem").value || "No answer yet",
    feature: $("#feedbackFeature").value || "No answer yet",
    pay: $("#feedbackPay").value || "No answer yet"
  };
  state.feedback.unshift(note);
  save();
  $("#feedbackProblem").value = "";
  $("#feedbackFeature").value = "";
  $("#feedbackPay").value = "";
  state.selectedRating = 0;
  save();
  renderFeedback();
  showToast("Customer note saved on this device.");
}

async function copyFeedbackSummary() {
  const text = state.feedback.map((item, index) => [
    `Customer ${index + 1}`,
    `Weekly use rating: ${item.rating || "Not rated"}/5`,
    `Problem: ${item.problem}`,
    `Best feature: ${item.feature}`,
    `Would pay if: ${item.pay}`
  ].join("\n")).join("\n\n") || "No feedback yet.";

  try {
    await navigator.clipboard.writeText(text);
    showToast("Feedback copied. Paste it into WhatsApp, email, or Notes.");
  } catch {
    showToast("Copy was blocked. Select the saved notes and copy them manually.");
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function restartDemo() {
  localStorage.removeItem("smartchef-state");
  window.location.reload();
}

function runTransition(update) {
  if (document.startViewTransition && !runTransition.busy) {
    runTransition.busy = true;
    const transition = document.startViewTransition(update);
    transition.finished
      .catch(() => {})
      .finally(() => {
        runTransition.busy = false;
      });
  } else {
    update();
  }
}

function bindEvents() {
  $("#nextBtn").addEventListener("click", () => {
    if (state.step < onboardingSteps.length - 1) {
      runTransition(() => {
        state.step += 1;
        save();
        renderOnboarding();
      });
    } else {
      state.step = onboardingSteps.length;
      state.trialStarted = true;
      save();
      completeOnboarding();
    }
  });
  $("#backBtn").addEventListener("click", () => {
    runTransition(() => {
      state.step = Math.max(0, state.step - 1);
      save();
      renderOnboarding();
    });
  });
  $$(".tab").forEach(tab => tab.addEventListener("click", () => {
    runTransition(() => {
      $$(".tab").forEach(item => item.classList.remove("active"));
      $$(".tab-panel").forEach(item => item.classList.remove("active-panel"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}Tab`).classList.add("active-panel");
    });
  }));
  $$(".segment").forEach(segment => segment.addEventListener("click", () => {
    $$(".segment").forEach(item => item.classList.remove("active"));
    segment.classList.add("active");
    renderInventoryMethod(segment.dataset.method);
  }));
  $("#startTrialBtn").addEventListener("click", () => {
    state.trialStarted = true;
    save();
    $("#startTrialBtn").textContent = "Trial active";
  });
  $$(".price-card").forEach(card => card.addEventListener("click", () => {
    state.selectedPlan = card.dataset.plan;
    save();
    $$(".price-card").forEach(item => item.classList.remove("best"));
    card.classList.add("best");
  }));
  $$(".rating-btn").forEach(button => button.addEventListener("click", () => {
    state.selectedRating = Number(button.dataset.rating);
    save();
    renderFeedback();
  }));
  $("#saveFeedbackBtn").addEventListener("click", saveFeedbackNote);
  $("#copyFeedbackBtn").addEventListener("click", copyFeedbackSummary);
  $("#restartDemoBtn").addEventListener("click", restartDemo);
  ["#themeToggle", "#homeThemeToggle"].forEach(selector => $(selector).addEventListener("click", toggleTheme));
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const label = document.body.classList.contains("dark") ? "Light" : "Dark";
  $("#themeToggle").textContent = label;
  $("#homeThemeToggle").textContent = label;
}

bindEvents();
if (state.step >= onboardingSteps.length) {
  completeOnboarding();
} else {
  renderOnboarding();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
