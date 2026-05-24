# Free Content Files

Put gated PDF, audio, or guide files here.

Example:

- `single-symptom-intake-prompts.pdf`
- `sleep-pattern-audio.mp3`

After adding a file, connect it in `lib/free-content.ts` with:

```ts
assetHref: "/free-content/your-file.pdf",
assetLabel: "Open the PDF",
```

The public link people visit should be the gated page:

`/free-content/the-resource-slug`

The direct file path should not be shared publicly. The gate unlocks it after newsletter signup.
