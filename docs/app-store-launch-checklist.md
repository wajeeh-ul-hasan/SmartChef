# SmartChef App Store / Play Store Launch Checklist

## Accounts

- Apple Developer Program account.
- Google Play Console account.
- RevenueCat account.
- OpenAI API account.
- Production hosting account for API, PostgreSQL, and object storage.

## Store Products

Create matching products in App Store Connect, Google Play Console, and RevenueCat:

- `basic_monthly` - Basic, $0.99/month.
- `pro_monthly` - Pro Monthly, $4.99/month.
- `pro_yearly` - Pro Yearly, $39.99/year.

RevenueCat entitlements:

- `basic` unlocks recommendations and recipes.
- `pro` unlocks inventory, photo recognition, voice inventory, ingredient-based recommendations, generated recipes, and assistant tools.

## Required App Features Before Submission

- Sign in with Apple on iOS when third-party login is offered.
- Restore purchases button.
- Delete account button.
- Privacy policy URL.
- Terms of service URL.
- Support URL.
- App review demo account.
- Fully working backend during review.
- Clear camera, microphone, and photo library permission explanations.

## Beta Testing

### iOS

- Upload Expo/EAS iOS build to App Store Connect.
- Use TestFlight for internal testing first.
- Add external testers after TestFlight review.
- Collect screenshots, crash reports, and feedback in App Store Connect.

### Android

- Upload Android App Bundle to Play Console.
- Use internal testing first.
- For new personal Play Console accounts, run closed testing with at least 12 opted-in testers for 14 continuous days before requesting production access.

## Review Notes

Include this in review notes:

```text
SmartChef AI is a cooking assistant. All new users receive a 7-day Pro trial.

Demo account:
Email: demo@smartchef.app
Password: provided in secure review notes

Features to review:
1. Complete onboarding.
2. Open Today recommendations.
3. Open a recipe and view cooking instructions.
4. Open Inventory and test voice/photo inventory.
5. Open Ask SmartChef and request a recipe idea.
6. Open Plans and confirm Basic, Pro Monthly, and Pro Yearly options.
7. Use Restore Purchases in Settings.
```

## Store Listing Assets

- App name: SmartChef AI.
- Subtitle: AI meals from ingredients you already have.
- Short description: Decide what to cook, track ingredients, and reduce food waste with AI.
- Screenshots:
  - Onboarding trial screen.
  - Today recommendations.
  - Recipe instructions.
  - Inventory starter pack.
  - Photo/voice inventory confirmation.
  - Ask SmartChef assistant.
  - Plans/paywall.
  - Shopping list or weekly plan.

## Privacy / Data Safety

Disclose:

- Account info: email and name.
- User content: inventory items, recipe preferences, assistant messages.
- Photos/audio: used for ingredient recognition and voice inventory.
- Purchases: subscription status via Apple/Google/RevenueCat.
- Diagnostics: crash/error data if monitoring is added.

Do not store raw grocery photos or audio permanently unless the user opts into history.
