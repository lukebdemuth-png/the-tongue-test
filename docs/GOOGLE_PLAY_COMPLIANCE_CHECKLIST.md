# Google Play Compliance Checklist: Tongue Test TCM

Last updated: May 30, 2026

This checklist is for preparing the Android / Google Play version of Tongue Test TCM. It is not legal advice. It records the app-side steps and the external Play Console setup still needed.

Primary Google references reviewed:

- Google Play Developer Policy Center: https://play.google/developer-content-policy/
- Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511
- User Data: https://support.google.com/googleplay/android-developer/answer/10144311
- Permissions and APIs that Access Sensitive Information: https://support.google.com/googleplay/android-developer/answer/16558241
- Payments: https://support.google.com/googleplay/android-developer/answer/9858738

## App Positioning

- Position the app as wellness education, self-reflection, and Traditional Chinese Medicine-inspired tongue observation.
- Do not market the app as a medical device.
- Do not claim diagnosis, treatment, cure, prevention, disease detection, medical monitoring, or emergency triage.
- Use wording such as "may suggest," "can reflect," "traditionally associated with," and "educational wellness report."
- Keep the exact disclaimer visible in onboarding, photo consent, results, PDF/email report, footer, Privacy Policy, and Terms:

> Tongue Test TCM is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.

## Health And Sensitive Data

The app handles sensitive information because it collects tongue photos, intake answers, wellness notes, email addresses, and report metadata.

Code now includes:

- Privacy Policy route: `/privacy`
- Terms / educational disclaimer route: `/terms`
- Data deletion route: `/data-deletion`
- Explicit photo and AI review consent before analysis
- Current-session photo deletion before continuing
- PDF/email report output that does not include the raw tongue photo

Before Play submission:

- Add the deployed privacy URL in Play Console.
- Add the data deletion URL in Play Console if account/data deletion is requested.
- Complete the Data Safety form honestly for photo/image data, health/wellness information, email, payments, and service providers.
- Complete any Health Apps / health-content declarations required by Play Console.
- In screenshots, app listing, short description, and full description, avoid medical claims.

## Camera And Photo Permissions

- Prefer system photo picker / file upload where possible.
- If a native wrapper requests Camera permission, only request it when the user taps the camera/photo action.
- Add a clear permission rationale: the camera is used only so the user can take a tongue photo for an educational wellness report.
- Do not request microphone, location, contacts, or unrelated permissions.

## Payments

Important: Stripe is appropriate for the web version, but Android in-app purchases for digital reports/subscriptions generally need Google Play Billing.

Current code:

- Web checkout uses Stripe through `/api/stripe-checkout`.
- If `NEXT_PUBLIC_GOOGLE_PLAY_BUILD=true`, Stripe checkout is disabled and the app shows a Google Play Billing notice.

Before submitting an Android build:

- Implement Google Play Billing for the one-time report and subscription inside the Android app.
- Do not use Stripe inside the Android app for digital report unlocks unless a qualified policy exception applies.
- Keep Stripe for the public web app only.

## AI Transparency

The app should disclose:

- The tongue image is reviewed by AI-assisted visual analysis.
- The output is educational and may be incomplete or wrong.
- Photo lighting, angle, camera color, food, coffee, brushing, hydration, and image quality can affect the result.
- The result should not be used for medical decisions.

## Herbs And Lifestyle Suggestions

- Present herbs/formulas as educational traditional references only.
- Do not give dosages.
- Do not tell the user to self-treat a serious condition.
- Include the herb safety disclaimer:

> Consult a qualified practitioner before taking herbs, especially if pregnant, nursing, on medication, or managing a health condition.

## App Store Listing Copy

Use safe language:

- "AI-assisted tongue observation inspired by Traditional Chinese Medicine."
- "Educational wellness report."
- "Visible tongue features, organ-system reflections, food direction, and lifestyle notes."
- "Track changes over time."

Avoid:

- "Diagnose"
- "Treat"
- "Cure"
- "Detect disease"
- "Fix your organs"
- "Medical-grade"
- "Doctor replacement"
- "Prescription"

## Required URLs For Google Play

Use these once the production deployment is live:

- Privacy Policy: `https://the-tongue-test.vercel.app/privacy`
- Terms: `https://the-tongue-test.vercel.app/terms`
- Data Deletion: `https://the-tongue-test.vercel.app/data-deletion`
- App: `https://the-tongue-test.vercel.app/tongue-assessment`

## Remaining Non-Code Tasks

- Verify production deployment after Vercel redeploys.
- Add production environment variables in Vercel.
- Implement Google Play Billing for Android app release.
- Create the Android wrapper/native project if submitting as an app rather than a web app.
- Fill out Play Console Data Safety and Health Apps declarations.
- Confirm app screenshots and listing text use educational language only.
- Confirm privacy policy and data deletion URLs are accessible publicly.
