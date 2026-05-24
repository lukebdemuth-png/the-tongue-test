# Books Directory

This directory is the GitHub-visible source-book map for the Patterns / Three Traditions closed-loop source system.

It does not store raw PDFs by default. Raw uploaded books and full extracted texts remain local-only when rights/access status is uncertain, explicit permission is missing, or the source is a private style/reference file.

The app-facing source system should use the committed structured layers:

- `data/chunks/*.jsonl`
- `data/chunks/normalized/*.jsonl`
- `sources/metadata/**/*.jsonl`
- `sources/metadata/**/*.json`

These files provide source IDs, chunk IDs, text previews, locators, traditions, citations, access notes, and metadata for retrieval and Supabase import.

## Structure

```text
books/
  ayurveda/
  homeopathy/
  tcm/
  intake-methodology/
  local-only/
  manifest.json
```

## Commit Policy

Commit:

- source manifests
- source metadata
- normalized chunks that are allowed for the project repository
- import/export scripts
- provenance and rights notes

Do not commit without explicit review:

- raw PDFs
- full extracted OCR text
- private style references
- copyrighted translations with uncertain redistribution rights
- paywalled or login-gated material

## Current Closed-Loop Status

The current GitHub-accessible closed-loop source layer is chunk based, not raw-book based. That means GitHub has the source material the prototype can retrieve from, but not every original uploaded PDF.

Vector embeddings are not yet committed or generated. `indexes/` and top-level `chunks/` are placeholders only.
