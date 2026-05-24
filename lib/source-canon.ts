export type SourceCanonBook = {
  title: string;
  author?: string;
  note: string;
};

export type SourceCanonGroup = {
  tradition: string;
  description: string;
  books: SourceCanonBook[];
};

export const sourceCanonPolicy =
  "The Patterns brain is being built as a closed-loop source system. Core reasoning is limited to the books listed here unless a new source is deliberately reviewed and added later.";

export const sourceCanonGroups: SourceCanonGroup[] = [
  {
    tradition: "Homeopathy",
    description: "Foundational method, remedy framework, materia medica, and repertory references.",
    books: [
      {
        title: "Organon of the Medical Art",
        author: "Samuel Hahnemann",
        note: "Foundational philosophical and methodological text; 6th edition preferred when edition-specific access is available.",
      },
      {
        title: "The Science of Homeopathy",
        author: "George Vithoulkas",
        note: "System framework, levels of health, and case reasoning.",
      },
      {
        title: "The Soul of Remedies",
        author: "Dr. Rajan Sankaran",
        note: "Modern remedy framework and interpretive model.",
      },
      {
        title: "Boericke's New Manual of Homeopathic Materia Medica with Repertory",
        author: "William Boericke",
        note: "Materia medica, remedy differentials, modalities, and repertory reference.",
      },
      {
        title: "Desktop Guide to Keynotes and Confirmatory Symptoms",
        author: "Roger Morrison, M.D.",
        note: "Clinical keynotes and confirmatory remedy signs.",
      },
      {
        title: "Desktop Companion to Physical Pathology",
        author: "Roger Morrison, M.D.",
        note: "Physical pathology and remedy differential support.",
      },
      {
        title: "Kent's Final General Repertory",
        author: "James Tyler Kent",
        note: "Repertory structure, rubrics, and symptom-to-remedy mapping.",
      },
      {
        title: "Homeopathic Medical Repertory, 3rd ed.",
        author: "Robin Murphy",
        note: "Modern clinical repertory organized by organ system and clinical diagnosis.",
      },
    ],
  },
  {
    tradition: "Ayurveda",
    description: "Classical foundations, modern assessment, constitution, and management frameworks.",
    books: [
      {
        title: "Charaka Samhita",
        note: "Classical foundation for dosha theory, pathology, diagnosis, physiology, and treatment principles.",
      },
      {
        title: "Sushruta Samhita",
        note: "Classical expansion layer for anatomy, surgery, diagnostics, and clinical context.",
      },
      {
        title: "Vagbhata Samhita / Ashtanga Hridayam",
        author: "Vagbhata",
        note: "Practical clinical Ayurveda, integrated treatment logic, formulations, and lifestyle.",
      },
      {
        title: "Textbook of Ayurveda, Vol. 1: Fundamental Principles of Ayurveda",
        author: "Vasant Lad",
        note: "Modern educational framework for fundamental principles.",
      },
      {
        title: "Textbook of Ayurveda, Vol. 2: A Complete Guide to Clinical Assessment",
        author: "Vasant Lad",
        note: "Clinical assessment, prakriti/vikriti, agni, ama, dhatu, mala, and observation structures.",
      },
      {
        title: "Textbook of Ayurveda, Vol. 3: General Principles of Management and Treatment",
        author: "Vasant Lad",
        note: "Management and treatment principles for practitioner review categories.",
      },
      {
        title: "Ayurvedic Medicine: The Principles of Traditional Practice",
        author: "Sebastian Pole",
        note: "Concise practitioner reference for assessment, traditional interpretation, herbs, and treatment categories.",
      },
      {
        title: "Prakriti: Your Ayurvedic Constitution",
        author: "Robert Svoboda",
        note: "Constitution, prakriti language, and philosophical framing.",
      },
    ],
  },
  {
    tradition: "Chinese Medicine",
    description: "Classical theory, modern conceptual bridge, and pending materia medica reference.",
    books: [
      {
        title: "Huangdi Neijing / Yellow Emperor's Inner Classic",
        note: "Foundational Chinese medicine text for yin-yang, qi, organ networks, seasonal physiology, and pattern logic.",
      },
      {
        title: "The Web That Has No Weaver",
        author: "Ted J. Kaptchuk",
        note: "Modern philosophical and conceptual bridge for Chinese medicine pattern language.",
      },
      {
        title: "User-confirmed TCM Materia Medica",
        note: "Exact title pending from the practitioner office reference; no other TCM herb/formula text is core until confirmed.",
      },
    ],
  },
  {
    tradition: "General Herbal Medicine",
    description: "A supporting herbal cross-checking layer, not a replacement for tradition-specific materia medica.",
    books: [
      {
        title: "Encyclopedia of Herbal Medicine",
        author: "Andrew Chevallier",
        note: "General herb reference, botanical cross-checking, and safety context.",
      },
    ],
  },
];
