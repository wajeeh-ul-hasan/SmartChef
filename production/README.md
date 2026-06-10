# SmartChef Production Build

This folder is the production foundation for the App Store and Play Store version of SmartChef.

## Structure

- `api/` - Node.js, Express, TypeScript backend with trial, subscriptions, inventory, recommendations, AI assistant, photo detection, and voice parsing endpoints.
- `mobile/` - React Native / Expo app that uses the API and mirrors the customer-tested prototype flow.

## Local Setup

1. Start the API:

```bash
cd production/api
npm install
cp .env.example .env
npm run dev
```

2. Start the mobile app:

```bash
cd production/mobile
npm install
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 npm run start
```

3. Add real production secrets later:

- `OPENAI_API_KEY`
- RevenueCat public SDK keys in the mobile app
- RevenueCat webhook secret in the API
- PostgreSQL `DATABASE_URL`
- S3-compatible storage credentials

## Current Status

This is a store-launch foundation, not a submitted binary yet. It includes the architecture and screens needed to continue implementation:

- 7-day Pro trial
- Basic, Pro Monthly, Pro Yearly plans
- Pro entitlement gate
- Recipe recommendations
- Inventory
- Voice inventory parsing
- Photo inventory detection
- AI assistant
- Admin analytics endpoint
- App Store / Play Store permission copy

The current API uses an in-memory store for development. Replace `src/services/store.ts` with PostgreSQL repositories before production launch.
