# Tongue Test TCM Mobile

This is the fast native-phone launch shell for Tongue Test TCM.

The app opens with a native three-panel intro, then loads the live assessment:

`https://the-tongue-test.vercel.app/tongue-assessment`

## Launch Path

1. Install dependencies: `npm install`
2. Log in to Expo/EAS: `npx eas-cli login`
3. Link/create EAS project: `npx eas-cli init`
4. Replace the EAS project ID in `app.json`
5. Build Android: `npx eas-cli build --platform android --profile production`
6. Build iOS: `npx eas-cli build --platform ios --profile production`

## Store Notes

- In-app purchases must use Apple/Google billing through RevenueCat or direct store billing.
- Stripe is intentionally not part of phone-app purchases.
- The current shell uses the existing live web app so launch can move quickly.
- A deeper native rebuild can happen after the first app-store path is proven.
