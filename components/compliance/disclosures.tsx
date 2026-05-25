export const FULL_MEDICAL_DISCLAIMER =
  "Patterns is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.";

export const SHORT_RESULT_DISCLAIMER =
  "Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.";

export const EMERGENCY_WARNING =
  "If you are experiencing a medical emergency, call emergency services immediately.";

export function FullMedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`border border-ink/10 bg-white/72 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Informational Use</p>
      <p className="mt-2 text-xs leading-5 text-ink/62">{FULL_MEDICAL_DISCLAIMER}</p>
      <p className="mt-2 text-xs leading-5 text-ink/58">
        Patterns is not a substitute for a doctor, licensed practitioner,
        emergency care, or prescribed medication.
      </p>
    </aside>
  );
}

export function ShortResultDisclaimer() {
  return (
    <p className="border-l-2 border-moss/35 pl-3 text-xs leading-5 text-ink/54">
      {SHORT_RESULT_DISCLAIMER}
    </p>
  );
}

export function BasisOfInsightDisclosure() {
  return (
    <section className="border border-ink/10 bg-white/72 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-moss">Basis of Insight</p>
      <p className="mt-2 text-sm leading-6 text-ink/64">
        Outputs are generated from traditional wellness frameworks, source texts,
        user-entered information, and app logic. They are not generated from
        medical testing, physical examination, clinical diagnosis, or emergency
        evaluation.
      </p>
    </section>
  );
}

export function EmergencyWarning() {
  return (
    <aside className="border border-amber-200/80 bg-amber-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Emergency Care</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{EMERGENCY_WARNING}</p>
    </aside>
  );
}
