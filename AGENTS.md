# Agent Working Instructions

## Operating Mode

Work autonomously and continuously. Do not pause for routine permission questions when the next step is clear, low-risk, and aligned with the current task.

Make implementation decisions independently using the repository's existing patterns, project goals, and the smallest reasonable change that moves the work forward.

Before making architectural changes, adding new source families, changing metadata schemas, changing ranking/comparison logic, or building app-facing output formats, read `docs/PROJECT_MASTER.md` first. Use `docs/APP_BRAIN_ARCHITECTURE.md`, `docs/TREATMENT_DISCERNMENT_LOGIC.md`, `docs/TREATMENT_PLAN_OUTPUT_DESIGN.md`, `docs/CASE_STUDY_EVIDENCE_PLAN.md`, `docs/CORE_BOOK_CANON.md`, `docs/MASTER_CANON.md`, `docs/PROJECT_BLUEPRINT.md`, and `docs/APP_SCHEMA_AND_RETRIEVAL_PLAN.md` as supporting references when needed.

When the user is collaborating with ChatGPT, treat pasted ChatGPT output as product input. If ChatGPT guidance would materially improve a task, ask the user to provide the relevant ChatGPT answer or decision notes, then document the decision in repo docs or implementation notes.

Break large tasks into phases and continue through each phase until the task is complete, blocked by a defined stop condition, or the repo is left in a clearly working intermediate state.

## Execution Rules

- Retry failed steps automatically when the failure is likely transient, environmental, or fixable.
- When a dependency, source, or command fails, diagnose the failure and try a reasonable alternate path.
- If a requested source fails, search for alternate public-domain, open-access, or otherwise legitimate public sources.
- If source data is messy, noisy, duplicated, OCR-damaged, or inconsistently structured, clean and normalize it automatically.
- Prefer reproducible scripts and documented commands over one-off manual steps.
- Keep changes scoped to the task unless a supporting fix is required to keep the project working.
- Preserve page numbers, source URLs, provenance, and metadata when processing source texts.
- Do not silently discard uncertain data; mark uncertainty in metadata or notes.

## Stop Conditions

Stop and ask for direction only when one of these applies:

- Credentials, login, private access, or a paywall is required.
- A legal, copyright, privacy, medical-safety, or other safety issue appears.
- The task requires a major architectural direction change.
- The next step risks deleting, overwriting, or invalidating a large amount of existing work.

## Documentation Requirements

Always document meaningful decisions, including:

- Source URLs used or rejected.
- OCR or extraction methods used.
- Cleaning rules and assumptions.
- Metadata schema changes.
- Known data-quality limitations.
- Commands needed to reproduce the work.

## Completion Requirements

Before finishing:

- Run relevant tests or validation commands when available.
- Summarize completed work.
- Mention any remaining limitations or follow-up work.
- Leave the repository in a working state.
- Avoid leaving long-running processes active unless the user explicitly asked for a background run.

## Project Purpose

Build a holistic medicine research ingestion and reasoning system across Ayurveda, TCM, Homeopathy, Yoga, Qigong, and Integrative medicine.

This system should not just collect information. It should organize sources so the app can compare patterns, rank likelihood, detect contradictions, explain confidence, and produce practitioner-facing outputs.

The core app workflow is: practitioner enters symptoms, signs, constitution/context, and notes; the app returns separate Ayurveda, Traditional Chinese Medicine, and Homeopathy views, then a cross-tradition synthesis. Each view must include likely traditional pattern or remedy direction, supporting citations, tradition-specific herbs/formulas/remedy/lifestyle categories, confidence level, and safety notes.

Frame all app outputs as educational, citation-based traditional-system suggestions for qualified practitioner review. Do not present outputs as medical diagnosis, prescription, or patient-specific treatment instruction.

The master canon lives in `docs/MASTER_CANON.md`. Do not add isolated ingestion scripts or retrieval features that drift from the master canon, metadata structure, citation traceability, safety rules, tradition separation, or communication-style requirements.

## Reasoning Framework

Use the first-version reasoning framework in `reasoning/` when building ranking, comparison, question sequencing, or explanatory features:

- `reasoning/pattern_scoring.md`
- `reasoning/safety_overrides.md`
- `reasoning/confidence_levels.md`
- `reasoning/question_sequencing.md`
- `reasoning/cross_tradition_mapping.md`

The reasoning order is:

1. Safety override
2. Pattern match score
3. Symptom strength
4. Source support
5. Cross-tradition agreement
6. Contradiction detection
7. Missing-information penalty
8. Root-cause explanatory power

Standard reasoning output should include:

- best-fit interpretation
- supporting evidence
- contradictions
- missing questions
- confidence level
- source citations
- next best question

## Source Priority Hierarchy

When choosing, ranking, or explaining evidence, preserve this hierarchy:

1. Classical authoritative texts
2. Peer-reviewed case reports and clinical studies
3. Practitioner methodology papers
4. Structured databases
5. Intake forms and diagnostic questionnaires
6. Teacher lectures and transcripts
7. General educational articles

## Required Metadata And Scoring

Every ingested source must include source URL, title, author/authors, publication/source, date, tradition, source type, access status, retrieval date, summary, extracted concepts, symptom clusters, diagnosis/pattern, intervention, outcome, limitations, confidence language, and source scores.

Every source should be scored for authority, relevance, clinical reasoning value, pattern-recognition value, outcome-tracking value, legal/access status, and confidence level. Use:

- `sources/metadata/metadata_schema.json`
- `sources/metadata/source_scoring_schema.json`

## Safety And Access Rules

- Do not bypass paywalls.
- Do not bypass logins.
- Respect robots.txt.
- Use rate limits.
- Collect open-access material only.
- Prefer APIs where available.
- Preserve citations and source metadata.

## Communication Style Layer

Future Codex tasks that produce user-facing explanatory text must follow:

- `docs/VOICE_GUIDE.md`
- `docs/RESPONSE_TEMPLATES.md`

The Science of Breath PDF is a private style reference only. Do not ingest it as clinical source material, do not commit extracted text from it, and do not quote large passages from it.

When explaining retrieved medical or traditional source content, use calm, educational, practitioner-facing language. Explain clearly without overclaiming, diagnosing, or collapsing distinct traditions into false equivalence.
