# SmartChef API Architecture

## Stack
- Mobile: React Native recommended for MVP parity across iOS and Android.
- Prototype: mobile-first HTML/CSS/JavaScript.
- Backend: Node.js, Express, TypeScript.
- Database: PostgreSQL.
- Storage: AWS S3 for user photos, receipt images, generated recipe photos, and creator content in future phases.
- AI: OpenAI text models for generation and ranking, vision model for ingredient detection, speech-to-text for voice inventory.
- Payments: RevenueCat for iOS/Android app subscriptions. Stripe is reserved for future web or B2B billing.

## Service Modules
- Auth Service: email, Google, Apple, session issuance.
- Profile Service: onboarding choices and personalization profile.
- Inventory Service: CRUD, starter packs, expiry tracking, ingestion confidence.
- AI Ingestion Service: voice parsing, photo recognition, receipt OCR.
- Recommendation Service: daily runs, quick meals, almost-there matching, creative generation.
- Recipe Service: recipe database, AI generated recipes, moderation status.
- Meal Plan Service: weekly plan generation and regeneration.
- Shopping Service: missing ingredient aggregation, categories, budget estimates.
- Subscription Service: trial, plan selection, entitlement checks, billing webhooks.
- Admin Service: analytics, recipe management, monitoring, subscriptions.

## Core Endpoints
```http
POST /v1/auth/email
POST /v1/auth/google
POST /v1/auth/apple

GET  /v1/me
PUT  /v1/me/profile
POST /v1/me/trial

GET  /v1/starter-packs?cuisine=desi
GET  /v1/inventory
POST /v1/inventory/items
POST /v1/inventory/starter-pack
PATCH /v1/inventory/items/:id
DELETE /v1/inventory/items/:id

POST /v1/inventory/voice-parse
POST /v1/inventory/photo-detect
POST /v1/inventory/receipt-scan

GET  /v1/recommendations/today
POST /v1/recommendations/regenerate
POST /v1/recipes/generate
POST /v1/recipes/:id/events

GET  /v1/shopping-lists/current
POST /v1/shopping-lists/from-missing
PATCH /v1/shopping-lists/items/:id

GET  /v1/meal-plans/current
POST /v1/meal-plans/generate

GET  /v1/subscriptions/plans
POST /v1/me/trial
POST /v1/webhooks/revenuecat

GET  /v1/admin/analytics
GET  /v1/admin/recipes
PATCH /v1/admin/recipes/:id
GET  /v1/admin/recommendation-monitoring
```

## Subscription Plans
```json
{
  "plans": [
    { "id": "basic_monthly", "name": "Basic", "price": "$0.99/month", "entitlement": "basic" },
    { "id": "pro_monthly", "name": "Pro Monthly", "price": "$4.99/month", "entitlement": "pro" },
    { "id": "pro_yearly", "name": "Pro Yearly", "price": "$39.99/year", "entitlement": "pro" }
  ]
}
```

## Recommendation Response Shape
```json
{
  "date": "2026-06-09",
  "quickMealsMode": true,
  "sections": {
    "cookRightNow": [
      {
        "recipeId": "uuid",
        "title": "Omelette Paratha Roll",
        "cookingTimeMinutes": 12,
        "estimatedCostCents": 140,
        "difficulty": "beginner",
        "ingredientCount": 4,
        "why": "Uses eggs, flour, onions, and green chillies already in inventory."
      }
    ],
    "almostThere": [
      {
        "title": "Chicken Alfredo",
        "missingIngredients": ["Cream", "Parmesan"]
      }
    ],
    "creative": [
      {
        "title": "Turkish Yogurt Chicken Bake",
        "noveltyScore": 0.86
      }
    ]
  }
}
```

## Security and Privacy
- Store OAuth credentials and payment tokens outside the application database.
- Use signed S3 uploads for photos and receipts.
- Delete raw receipt and photo images after extraction unless the user opts into history.
- Entitlement middleware must protect Premium AI endpoints after trial expiry.
- Admin endpoints require role-based access control and audit logs.
