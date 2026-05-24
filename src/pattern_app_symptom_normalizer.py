"""Normalize plain-language symptom input for Pattern App retrieval.

The normalizer is deliberately conservative: it adds search aliases and flags
without replacing the user's original words. That keeps the practitioner trace
honest while making single-word and typo-heavy tests less brittle.
"""

from __future__ import annotations

import re
from difflib import get_close_matches
from typing import Any


CANONICAL_SYMPTOMS: dict[str, dict[str, Any]] = {
    "anxiety": {
        "dimension": "mental_emotional",
        "aliases": ["anxiety", "anxious", "worry", "panic", "nervous", "restless mind"],
        "next_questions": [
            "Does the anxiety come with panic, chest pain, shortness of breath, insomnia, digestive changes, or a clear trigger?",
            "Is it worse at a certain time of day, before events, after caffeine, or when alone?",
            "What helps: reassurance, movement, pressure, warmth, breathing, food, or rest?",
        ],
    },
    "bloating": {
        "dimension": "digestion",
        "aliases": ["bloating", "bloated", "gas", "flatulence", "abdominal distension", "distention"],
        "next_questions": [
            "Is bloating worse after meals, specific foods, stress, evening, or before stool?",
            "Is there belching, gas, pain, constipation, loose stool, nausea, or appetite change?",
            "What helps: warmth, pressure, movement, passing gas, stool, fasting, or smaller meals?",
        ],
    },
    "back_pain": {
        "dimension": "pain",
        "aliases": ["back pain", "low back pain", "upper back pain", "back ache", "backache"],
        "next_questions": [
            "Where is the back pain: low back, mid-back, upper back, one-sided, or radiating down the leg?",
            "Is there injury, fever, numbness, weakness, bowel/bladder change, pregnancy, or severe sudden pain?",
            "What helps or worsens it: movement, rest, heat, cold, pressure, bending, sitting, or lying down?",
        ],
    },
    "brain_fog": {
        "dimension": "mind_focus",
        "aliases": ["brain fog", "foggy", "poor focus", "lack of focus", "mental fog", "concentration"],
        "next_questions": [
            "Is brain fog worse in the morning, after meals, with poor sleep, during stress, or after exertion?",
            "Is it linked with headache, dizziness, mood change, digestion, medication changes, or blood sugar swings?",
            "What helps: food, rest, movement, hydration, caffeine, fresh air, or sleep?",
        ],
    },
    "chest_tightness": {
        "dimension": "cardiorespiratory",
        "aliases": ["chest tightness", "tight chest", "chest pressure", "chest discomfort"],
        "next_questions": [
            "Is there chest pain, shortness of breath, fainting, sweating, jaw/arm pain, or sudden onset?",
            "Is it related to exertion, anxiety, breathing, meals, position, or respiratory illness?",
            "What makes it better or worse: rest, breathing, movement, pressure, food, or posture?",
        ],
    },
    "cold_hands": {
        "dimension": "circulation_temperature",
        "aliases": ["cold hands", "cold feet", "cold extremities", "chilly hands", "cold fingers"],
        "next_questions": [
            "Are the hands or feet cold all day, only at night, with stress, or with cold weather?",
            "Is there color change, numbness, tingling, pain, swelling, fatigue, or thyroid/anemia history?",
            "What helps: warmth, movement, food, rest, pressure, or stress reduction?",
        ],
    },
    "cough": {
        "dimension": "respiratory",
        "aliases": ["cough", "coughing", "dry cough", "wet cough", "phlegm", "mucus"],
        "next_questions": [
            "Is the cough dry, wet, barking, spasmodic, or productive with phlegm?",
            "Are there red flags such as difficulty breathing, chest pain, blood, high fever, or low oxygen?",
            "What makes it worse: lying down, cold air, talking, exertion, night, or morning?",
        ],
    },
    "cravings": {
        "dimension": "digestion",
        "aliases": ["cravings", "food cravings", "sweet cravings", "salty cravings", "sugar cravings"],
        "next_questions": [
            "What is being craved: sweet, salty, sour, spicy, cold, warm, or heavy foods?",
            "Are cravings worse with stress, fatigue, before menses, after meals, or at night?",
            "Is there low appetite, blood sugar instability, thirst, mood change, or digestive discomfort?",
        ],
    },
    "constipation": {
        "dimension": "elimination",
        "aliases": ["constipation", "hard stool", "dry stool", "infrequent stool", "difficult stool", "bowel"],
        "next_questions": [
            "How often is the stool passed, and is it hard, dry, incomplete, or painful?",
            "Is there bloating, gas, abdominal pain, or straining?",
            "What makes the constipation better or worse: fluids, warmth, oil, movement, stress, or travel?",
        ],
    },
    "diarrhea": {
        "dimension": "elimination",
        "aliases": ["diarrhea", "diarrhoea", "loose stool", "loose stools", "watery stool", "frequent stool"],
        "next_questions": [
            "How many stools per day, and are they watery, urgent, painful, burning, or mucus-containing?",
            "Is there fever, blood, dehydration, severe abdominal pain, recent travel, or food poisoning concern?",
            "Is it worse after meals, dairy, stress, cold foods, morning, or night?",
        ],
    },
    "dizziness": {
        "dimension": "neurological",
        "aliases": ["dizziness", "dizzy", "lightheaded", "vertigo", "spinning", "faint"],
        "next_questions": [
            "Is it spinning vertigo, lightheadedness, faintness, imbalance, or worse when standing?",
            "Are there red flags such as chest pain, fainting, neurological symptoms, severe headache, or new weakness?",
            "Is it linked with meals, dehydration, medications, anxiety, ear symptoms, or blood pressure changes?",
        ],
    },
    "dry_mouth": {
        "dimension": "fluid",
        "aliases": ["dry mouth", "mouth dryness", "dry tongue", "parched mouth"],
        "next_questions": [
            "Is there thirst, frequent urination, dry eyes, medication use, mouth breathing, or waking dry at night?",
            "Is the dryness worse with heat, anxiety, salty foods, caffeine, or sleep?",
            "What helps: water, electrolytes, sour taste, humid air, or stopping triggers?",
        ],
    },
    "dry_skin": {
        "dimension": "skin",
        "aliases": ["dry skin", "skin dryness", "flaky skin", "rough skin"],
        "next_questions": [
            "Is the skin dry, itchy, cracked, scaly, red, burning, or worse in cold weather?",
            "Is there thirst, constipation, poor sleep, stress, medication change, or new products?",
            "What helps: oil, humidity, warmth, diet changes, bathing changes, or rest?",
        ],
    },
    "fever": {
        "dimension": "temperature",
        "aliases": ["fever", "high fever", "temperature", "chills", "feverish"],
        "next_questions": [
            "How high is the fever, how long has it lasted, and is it worsening?",
            "Are there red flags such as stiff neck, confusion, shortness of breath, chest pain, rash, dehydration, or severe pain?",
            "Is there chill, sweat, thirst, cough, sore throat, urinary symptoms, abdominal pain, or exposure history?",
        ],
    },
    "frequent_urination": {
        "dimension": "urinary",
        "aliases": ["frequent urination", "urinating often", "pee often", "urinary frequency", "nocturia"],
        "next_questions": [
            "Is there burning, urgency, fever, flank pain, blood, pregnancy possibility, or excessive thirst?",
            "Is it worse at night, after caffeine, with anxiety, or with increased fluid intake?",
            "How much urine is passed each time, and is there pain or unusual odor?",
        ],
    },
    "fatigue": {
        "dimension": "energy",
        "aliases": ["fatigue", "low energy", "no energy", "tired", "tiredness", "weakness", "exhaustion", "low stamina"],
        "next_questions": [
            "Is the low energy worse in the morning, afternoon, after meals, or after exertion?",
            "How are sleep, appetite, digestion, mood, and recovery after rest?",
            "Is there dizziness, shortness of breath, fever, weight loss, bleeding, or other medical concern?",
        ],
    },
    "headache": {
        "dimension": "pain",
        "aliases": ["headache", "head pain", "migraine", "forehead pain", "temple pain", "occipital pain"],
        "next_questions": [
            "Where is the headache located: forehead, temples, behind the eyes, vertex, or occiput?",
            "What is the quality: throbbing, pressure, sharp, dull, burning, or heavy?",
            "Are there red flags such as sudden worst headache, neurological symptoms, fever, head injury, or vision changes?",
        ],
    },
    "heart_palpitations": {
        "dimension": "cardiorespiratory",
        "aliases": ["palpitations", "heart racing", "racing heart", "heart pounding", "irregular heartbeat"],
        "next_questions": [
            "Is there chest pain, fainting, shortness of breath, new weakness, or sustained rapid heartbeat?",
            "Is it linked with caffeine, anxiety, exertion, dehydration, medications, thyroid history, or poor sleep?",
            "How long does it last, and is the rhythm regular, fluttering, pounding, or skipped beats?",
        ],
    },
    "heavy_feeling": {
        "dimension": "general",
        "aliases": ["heavy feeling", "heaviness", "heavy body", "sluggish", "weighted down"],
        "next_questions": [
            "Is the heaviness in the whole body, head, limbs, digestion, chest, or mood?",
            "Is it worse after meals, in damp weather, on waking, with poor sleep, or with low mood?",
            "What helps: movement, warmth, light food, sweating, rest, or routine?",
        ],
    },
    "hot_flashes": {
        "dimension": "temperature",
        "aliases": ["hot flashes", "hot flushes", "heat waves", "sudden heat", "flushing"],
        "next_questions": [
            "Are hot flashes linked with night sweats, menstrual changes, stress, food, alcohol, or sleep disruption?",
            "Is there palpitations, dizziness, weight loss, fever, medication change, or thyroid concern?",
            "What helps: cooling, breathing, rest, avoiding triggers, or timing changes?",
        ],
    },
    "insomnia": {
        "dimension": "sleep",
        "aliases": ["insomnia", "can't sleep", "cant sleep", "sleepless", "poor sleep", "waking at night", "restless sleep"],
        "next_questions": [
            "Is the main issue falling asleep, staying asleep, waking too early, or non-restorative sleep?",
            "What time does waking happen, and is there heat, sweating, urination, hunger, worry, pain, or dreams?",
            "What helps or worsens sleep: food, screens, stress, caffeine, exercise, warmth, or position?",
        ],
    },
    "irritability": {
        "dimension": "mental_emotional",
        "aliases": ["irritability", "irritable", "anger", "frustrated", "short temper", "easily annoyed"],
        "next_questions": [
            "Is irritability linked with hunger, poor sleep, stress, heat, pain, menstrual timing, or overstimulation?",
            "Is it sudden, chronic, worse at a certain time, or associated with anxiety or sadness?",
            "What helps: food, solitude, movement, cooling, rest, reassurance, or structure?",
        ],
    },
    "joint_pain": {
        "dimension": "pain",
        "aliases": ["joint pain", "painful joints", "stiff joints", "arthritis pain", "joint stiffness"],
        "next_questions": [
            "Which joints are involved, and is there swelling, heat, redness, stiffness, or injury?",
            "Is pain worse in the morning, with cold, with damp weather, after activity, or at rest?",
            "What helps: warmth, movement, rest, pressure, stretching, or anti-inflammatory medication?",
        ],
    },
    "low_appetite": {
        "dimension": "digestion",
        "aliases": ["low appetite", "poor appetite", "no appetite", "reduced appetite", "lack of appetite"],
        "next_questions": [
            "Is appetite low all day, worse in the morning, with nausea, stress, bloating, fever, or sadness?",
            "Is there weight loss, early fullness, pain, medication change, or taste change?",
            "What helps appetite: warmth, movement, smaller meals, spices, routine, or stress reduction?",
        ],
    },
    "menstrual_cramps": {
        "dimension": "reproductive",
        "aliases": ["menstrual cramps", "period cramps", "cramps before period", "cramps during period", "dysmenorrhea"],
        "next_questions": [
            "Are cramps before bleeding, during bleeding, after bleeding, sharp, dull, spasmodic, or better with heat?",
            "Is there heavy bleeding, clots, severe pain, fainting, fever, pregnancy possibility, or new/worsening pain?",
            "What helps: heat, pressure, movement, rest, bowel movement, or medication?",
        ],
    },
    "menstrual_irregularity": {
        "dimension": "reproductive",
        "aliases": ["irregular period", "irregular periods", "missed period", "late period", "irregular cycle"],
        "next_questions": [
            "Is the cycle early, late, skipped, heavy, light, spotting, or newly irregular?",
            "Is pregnancy possible, postpartum, perimenopause, stress-related, weight-change-related, or medication-related?",
            "Are there cramps, clots, hot flashes, acne, mood changes, or fatigue?",
        ],
    },
    "muscle_aches": {
        "dimension": "pain",
        "aliases": ["muscle aches", "body aches", "sore muscles", "muscle pain", "aching muscles"],
        "next_questions": [
            "Are aches generalized or localized, sudden or chronic, with fever, exertion, injury, or medication change?",
            "Are they worse with movement, rest, cold, damp weather, pressure, or time of day?",
            "What helps: warmth, rest, stretching, hydration, pressure, or gentle movement?",
        ],
    },
    "nausea": {
        "dimension": "digestion",
        "aliases": ["nausea", "nauseous", "queasy", "vomiting", "retching", "upset stomach"],
        "next_questions": [
            "Is there vomiting, pregnancy possibility, fever, severe abdominal pain, dehydration, or blood?",
            "Is nausea worse before eating, after eating, with motion, odors, stress, morning, or night?",
            "What helps: eating, fasting, ginger, warmth, fresh air, lying still, or vomiting?",
        ],
    },
    "night_sweats": {
        "dimension": "temperature_fluid",
        "aliases": ["night sweats", "sweating at night", "waking sweaty", "night sweating"],
        "next_questions": [
            "Are night sweats soaking, mild, frequent, fever-related, or linked with hot flashes?",
            "Is there weight loss, fever, cough, medication change, anxiety, menopause transition, or infection concern?",
            "What time does sweating happen, and is there thirst, heat, chills, dreams, or waking?",
        ],
    },
    "nasal_congestion": {
        "dimension": "respiratory",
        "aliases": ["congestion", "nasal congestion", "stuffy nose", "blocked nose", "sinus congestion"],
        "next_questions": [
            "Is congestion dry, wet, thick, clear, yellow/green, one-sided, sinus-heavy, or allergy-related?",
            "Is there fever, facial pain, cough, sore throat, wheezing, or shortness of breath?",
            "What makes it worse: lying down, cold air, dust, pollen, dairy, dampness, or morning?",
        ],
    },
    "neck_tension": {
        "dimension": "pain",
        "aliases": ["neck tension", "neck pain", "stiff neck", "tight neck", "neck stiffness"],
        "next_questions": [
            "Is neck tension linked with headache, jaw tension, screen use, stress, sleep position, or injury?",
            "Is there fever, neurological symptoms, severe sudden pain, or recent trauma?",
            "What helps: heat, pressure, stretching, rest, movement, posture change, or massage?",
        ],
    },
    "pms": {
        "dimension": "reproductive",
        "aliases": ["PMS", "pms", "premenstrual symptoms", "before period mood", "before period symptoms"],
        "next_questions": [
            "Which symptoms appear before menses: mood change, breast tenderness, cravings, bloating, headache, acne, or insomnia?",
            "How many days before bleeding do symptoms start, and do they resolve when bleeding begins?",
            "Are there severe mood symptoms, heavy bleeding, intense pain, or cycle irregularity?",
        ],
    },
    "pain": {
        "dimension": "pain",
        "aliases": ["pain", "ache", "aching", "soreness", "sharp pain", "dull pain"],
        "next_questions": [
            "Where is the pain located, and does it move anywhere?",
            "What is the quality: sharp, dull, throbbing, burning, cramping, heavy, or shooting?",
            "What makes it better or worse: motion, rest, pressure, heat, cold, eating, stool, or time of day?",
        ],
    },
    "rash": {
        "dimension": "skin",
        "aliases": ["rash", "itch", "itching", "hives", "red skin", "skin eruption"],
        "next_questions": [
            "Is there swelling of lips or throat, breathing difficulty, fever, blistering, or rapidly spreading rash?",
            "Is the rash itchy, burning, painful, dry, oozing, raised, or hot?",
            "What triggered it: food, medication, herb, supplement, contact exposure, heat, cold, stress, or infection?",
        ],
    },
    "reflux": {
        "dimension": "digestion",
        "aliases": ["reflux", "heartburn", "acid reflux", "GERD", "sour burps", "burning stomach"],
        "next_questions": [
            "Is reflux burning, sour, bitter, with nausea, cough, throat irritation, or chest pain?",
            "Is it worse after meals, lying down, spicy/fatty foods, alcohol, coffee, stress, or late eating?",
            "Are there red flags such as trouble swallowing, vomiting blood, black stool, weight loss, or severe chest pain?",
        ],
    },
    "restlessness": {
        "dimension": "mental_emotional",
        "aliases": ["restlessness", "restless", "can't settle", "agitated", "fidgety"],
        "next_questions": [
            "Is restlessness mental, physical, worse at night, worse with anxiety, or relieved by movement?",
            "Is there insomnia, palpitations, caffeine/stimulant use, medication change, or panic?",
            "What helps: movement, pressure, breathing, warmth, reassurance, or solitude?",
        ],
    },
    "runny_nose": {
        "dimension": "respiratory",
        "aliases": ["runny nose", "nasal discharge", "clear discharge", "dripping nose", "rhinitis"],
        "next_questions": [
            "Is the discharge clear, watery, thick, colored, irritating, or worse outdoors/indoors?",
            "Is there sneezing, itchy eyes, cough, fever, sore throat, or sinus pressure?",
            "What makes it worse: cold air, pollen, dust, food, dampness, morning, or lying down?",
        ],
    },
    "sadness": {
        "dimension": "mental_emotional",
        "aliases": ["sadness", "sad", "low mood", "depressed mood", "grief", "melancholy"],
        "next_questions": [
            "Is sadness linked with grief, stress, sleep change, appetite change, fatigue, or loss of interest?",
            "Are there safety concerns such as self-harm thoughts, hopelessness, or inability to function?",
            "What helps: company, solitude, movement, routine, food, warmth, expression, or rest?",
        ],
    },
    "skin_acne": {
        "dimension": "skin",
        "aliases": ["acne", "breakouts", "pimples", "skin blemishes"],
        "next_questions": [
            "Is acne cystic, inflamed, oily, dry, itchy, painful, or linked with menses?",
            "Is it worse with stress, dairy, sugar, heat, sweat, products, or medication changes?",
            "Is there digestive change, constipation, cravings, or heat/flushing?",
        ],
    },
    "shoulder_pain": {
        "dimension": "pain",
        "aliases": ["shoulder pain", "shoulder tension", "tight shoulders", "pain in shoulder"],
        "next_questions": [
            "Is shoulder pain from injury, overuse, neck tension, posture, or unknown onset?",
            "Is there weakness, numbness, chest pain, shortness of breath, or pain radiating down the arm?",
            "What helps: rest, heat, movement, pressure, stretching, or position change?",
        ],
    },
    "shortness_of_breath": {
        "dimension": "cardiorespiratory",
        "aliases": ["shortness of breath", "breathless", "difficulty breathing", "can't breathe", "air hunger"],
        "next_questions": [
            "Is shortness of breath sudden, severe, with chest pain, blue lips, fainting, wheezing, or low oxygen?",
            "Is it worse with exertion, lying down, anxiety, cough, infection, allergens, or after meals?",
            "What helps: rest, sitting upright, inhaler, breathing slowly, fresh air, or treating congestion?",
        ],
    },
    "sore_throat": {
        "dimension": "respiratory",
        "aliases": ["sore throat", "throat pain", "scratchy throat", "raw throat"],
        "next_questions": [
            "Is there fever, difficulty swallowing, breathing trouble, rash, swollen glands, or severe one-sided pain?",
            "Is the throat dry, burning, raw, swollen, worse with swallowing, or better with warm/cold drinks?",
            "Is there cough, congestion, reflux, exposure, or voice strain?",
        ],
    },
    "stress": {
        "dimension": "mental_emotional",
        "aliases": ["stress", "high stress", "overwhelmed", "burned out", "overworked"],
        "next_questions": [
            "Is stress showing more as sleep disruption, anxiety, irritability, digestion change, pain, or fatigue?",
            "Is it acute, chronic, work-related, relational, caregiving-related, or trauma-related?",
            "What reliably helps: rest, movement, structure, breathing, food, support, or solitude?",
        ],
    },
    "stomach_pain": {
        "dimension": "digestion",
        "aliases": ["stomach pain", "abdominal pain", "belly pain", "stomach ache", "cramps", "cramping"],
        "next_questions": [
            "Where is the pain located, and is it mild, moderate, severe, sudden, or worsening?",
            "Is there fever, vomiting, blood, pregnancy possibility, chest pain, or acute severe abdominal pain?",
            "Is it better or worse with food, stool, gas, pressure, warmth, cold, movement, or rest?",
        ],
    },
    "swelling": {
        "dimension": "fluid",
        "aliases": ["swelling", "edema", "puffy", "fluid retention", "ankle swelling"],
        "next_questions": [
            "Where is the swelling, and is it one-sided, painful, sudden, red, hot, or associated with shortness of breath?",
            "Is it worse at the end of the day, with salt, heat, standing, menstrual cycle, or medications?",
            "Does it improve with elevation, movement, rest, or overnight?",
        ],
    },
    "weight_gain": {
        "dimension": "metabolic",
        "aliases": ["weight gain", "gaining weight", "difficulty losing weight", "heavier weight"],
        "next_questions": [
            "Was weight gain sudden, gradual, fluid-like, medication-related, stress-related, or cycle-related?",
            "Is there swelling, fatigue, cold intolerance, constipation, appetite change, sleep change, or shortness of breath?",
            "What has changed recently: food, movement, stress, sleep, medications, hormones, or digestion?",
        ],
    },
    "symptom": {
        "dimension": "general",
        "aliases": ["symptom", "symptoms", "complaint", "main concern"],
        "next_questions": [
            "What is the single main symptom or concern?",
            "When did it start, how severe is it, and what changes it?",
        ],
    },
}

TYPO_CORRECTIONS = {
    "consitation": "constipation",
    "constiation": "constipation",
    "constipaton": "constipation",
    "constapation": "constipation",
    "headace": "headache",
    "headach": "headache",
    "lowenergy": "low energy",
    "cant sleep": "can't sleep",
    "cantsleep": "can't sleep",
    "stomache": "stomach ache",
    "stomachach": "stomach ache",
    "anxity": "anxiety",
    "nausia": "nausea",
    "tummypain": "stomach pain",
    "tird": "tired",
    "tierd": "tired",
}

ALIAS_TO_CANONICAL: dict[str, str] = {}
for canonical, payload in CANONICAL_SYMPTOMS.items():
    for alias in payload["aliases"]:
        ALIAS_TO_CANONICAL[alias] = canonical
ALIAS_TO_CANONICAL.update({canonical: canonical for canonical in CANONICAL_SYMPTOMS})


def normalize_text(text: str) -> str:
    lowered = text.lower()
    lowered = re.sub(r"[^a-z0-9\s-]+", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    for typo, correction in TYPO_CORRECTIONS.items():
        lowered = re.sub(rf"\b{re.escape(typo)}\b", correction, lowered)
    return lowered


def canonical_for_phrase(phrase: str) -> str | None:
    normalized = normalize_text(phrase)
    if not normalized:
        return None
    if normalized in ALIAS_TO_CANONICAL:
        return ALIAS_TO_CANONICAL[normalized]
    for alias, canonical in ALIAS_TO_CANONICAL.items():
        if alias in normalized:
            return canonical
    close = get_close_matches(normalized, ALIAS_TO_CANONICAL.keys(), n=1, cutoff=0.86)
    if close:
        return ALIAS_TO_CANONICAL[close[0]]
    return None


def symptom_alias_terms(text: str) -> set[str]:
    canonical = canonical_for_phrase(text)
    if not canonical:
        return set()
    if canonical == "symptom":
        return set()
    terms = set()
    for alias in CANONICAL_SYMPTOMS[canonical]["aliases"]:
        terms.update(normalize_text(alias).split())
    terms.add(canonical)
    return {term for term in terms if len(term) > 2}


def normalize_intake_symptoms(intake: dict[str, Any]) -> list[dict[str, Any]]:
    symptoms = intake.get("symptoms", {}) if isinstance(intake.get("symptoms"), dict) else {}
    values: list[str] = []
    for key in ["chief_complaint", "digestion", "sleep", "energy", "mood", "pain_location", "pain_quality"]:
        value = symptoms.get(key)
        if isinstance(value, str) and value.strip():
            values.append(value)
    for key in ["primary_symptoms", "secondary_symptoms", "better_from", "worse_from", "time_patterns", "temperature_patterns"]:
        value = symptoms.get(key)
        if isinstance(value, list):
            values.extend(str(item) for item in value if str(item).strip())

    seen = set()
    normalized: list[dict[str, Any]] = []
    for value in values:
        canonical = canonical_for_phrase(value)
        if not canonical or canonical in seen:
            continue
        seen.add(canonical)
        payload = CANONICAL_SYMPTOMS[canonical]
        normalized.append(
            {
                "canonical": canonical,
                "original": value,
                "dimension": payload["dimension"],
                "aliases": payload["aliases"],
                "next_questions": payload["next_questions"],
            }
        )
    return normalized


def expanded_query_text(query: str) -> str:
    canonical = canonical_for_phrase(query)
    if not canonical:
        return query
    if canonical == "symptom":
        return query
    aliases = CANONICAL_SYMPTOMS[canonical]["aliases"]
    return " ".join([query, canonical, *aliases])
