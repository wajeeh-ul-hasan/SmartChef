# SmartChef AI Prototype

SmartChef is a mobile-first clickable prototype for testing an AI cooking assistant with real customers.

## Share With Customers
This is now a static customer web app. Put the project folder online with Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any normal static hosting service.

Send customers the public link to `index.html`. They can open it on a phone and use it like an app.

## Run Locally
```bash
node server.js
```

Open `http://localhost:4173`.

If `npm` is available, this also works:
```bash
npm run dev
```

## Included
- Clickable onboarding, inventory, recommendations, weekly planning, trial/pricing, and customer feedback capture.
- Installable mobile web app settings through `manifest.webmanifest`.
- Offline-friendly app shell through `service-worker.js`.
- Light/dark mode.
- Mobile-first responsive UI.
- Customer testing and solo-founder budget docs in `docs/`.
- PostgreSQL schema and API architecture handoff.
- Starter recipes with real food photos, ingredients, and cooking instructions.

## Key Files
- `index.html` - prototype shell.
- `styles.css` - mobile UI, themes, animation, responsive layout.
- `app.js` - onboarding state, inventory methods, recommendation logic, subscription interactions.
- `manifest.webmanifest` - makes the app installable on supported phones.
- `service-worker.js` - caches the app shell for repeat testing.
- `docs/share-with-customers.md` - plain-English sharing instructions.
- `docs/recipe-photo-guide.md` - how to add or replace recipe photos.
- `docs/customer-feedback-plan.md` - simple plan for testing with early users.
- `docs/solo-founder-budget.md` - realistic budget options for a solo founder.
- `docs/smartchef-product-package.md` - PRD, user flows, wireframes, design system, roadmap, MVP, phases.
- `docs/database-schema.sql` - PostgreSQL schema.
- `docs/api-architecture.md` - backend service and endpoint architecture.
- `docs/ai-recommendation-engine.md` - recommendation pipeline and ranking logic.
