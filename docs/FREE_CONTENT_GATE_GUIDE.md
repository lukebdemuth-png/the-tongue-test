# Free Content Gate Guide

The free-content system is hidden from normal site visitors.

It is not linked in the header or landing page. People only see a piece when you send them its direct gated link.

## Current Example Link

`/free-content/single-symptom-intake-prompts`

## How It Works

1. Create or upload the PDF/audio file into `public/free-content/`.
2. Add one entry in `lib/free-content.ts`.
3. Share the gated link: `/free-content/the-slug`.
4. The visitor sees the content title and a signup form.
5. After signup, the page unlocks the resource link.
6. The signup is saved with a source label like `free-content:single-symptom-intake-prompts`.

## Add A New PDF

Put the file here:

`public/free-content/your-file.pdf`

Add this to `freeContentResources` in `lib/free-content.ts`:

```ts
{
  slug: "your-resource-slug",
  title: "Your Resource Title",
  eyebrow: "Free PDF",
  format: "PDF",
  description: "Short description visitors see before signup.",
  promise: "Why this is useful and what they get by joining the newsletter.",
  assetHref: "/free-content/your-file.pdf",
  assetLabel: "Open the PDF",
}
```

Then share:

`https://your-domain.com/free-content/your-resource-slug`

## Add A New Audio

Put the file here:

`public/free-content/your-audio.mp3`

Use:

```ts
{
  slug: "your-audio-slug",
  title: "Your Audio Title",
  eyebrow: "Free audio",
  format: "Audio",
  description: "Short description visitors see before signup.",
  promise: "Why this is useful and what they get by joining the newsletter.",
  assetHref: "/free-content/your-audio.mp3",
  assetLabel: "Play the audio",
}
```

## Important

This is a simple signup gate, not a secure paywall. It keeps content hidden from normal site navigation and discourages casual access, but anyone with the direct file URL can open the file.
