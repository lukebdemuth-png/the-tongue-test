# Private Source Register

This register tracks private or copyrighted materials that may inform style, communication architecture, or private analysis workflows without being committed as extracted source text.

## Science of Breath

- Local private path: `private_sources/communication/science_of_breath.pdf`
- Original filename: `230308 HIP Science of Breath INSIDE FINAL.pdf`
- Source type: private communication-style reference
- App layer: communication voice layer
- Permitted use:
  - style analysis
  - communication architecture
  - response tone
  - practitioner explanation structure
- Prohibited use:
  - do not treat as a primary medical authority
  - do not commit extracted full text
  - do not quote large passages
  - do not use as clinical evidence
- Notes: The file is intentionally stored under `private_sources/`, which is ignored by git.

## Locally Supplied Canon PDFs

These files were supplied from a local/external drive and copied into `data/raw/` for future ingestion. Verify rights/access notes before committing extracted text or publishing derived full-text outputs.

### Organon of Medicine

- Local raw path: `data/raw/organon_medicine.pdf`
- Original filename: `2015.31779.Organon-Of-Medicinefifth-And-Sixth-Edition.pdf`
- Canon layer: Homeopathy foundational theory
- Intended use: source ingestion with citation-preserving chunks
- Notes: Processed Organon text/chunks already exist; this PDF now preserves the raw source file locally.

### Organon of Homeopathic Medicine, Third American Edition

- Local raw path: `data/raw/organon_homeopathic_medicine_1849_third_american.pdf`
- Original filename: `101305248.pdf`
- Identified title page: `Samuel Hahnemann's Organon of Homeopathic Medicine`
- Edition note: Third American edition, with improvements and additions from the last German edition and Dr. C. Hering's introductory remarks
- Publication note: New York, William Radde, 1849
- Canon layer: Homeopathy foundational theory
- Intended use: alternate/historical Organon source for comparison and citation-preserving chunks
- Notes: Keep distinct from the fifth/sixth edition source; do not merge translations/editions during ingestion.

### Sushruta Samhita Volume 1

- Local raw path: `data/raw/sushruta_samhita_vol1.pdf`
- Original filename: `Sushruta Samhita 1.pdf`
- Canon layer: Ayurveda foundational theory / classical expansion layer
- Intended use: future source ingestion with citation-preserving chunks
- Notes: Do not add an ingestion script until metadata schema alignment is maintained.
