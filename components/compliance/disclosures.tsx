export const FULL_MEDICAL_DISCLAIMER =
  "Tongue Test: TCM AI is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. The information provided is for informational and educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.";

export const SHORT_RESULT_DISCLAIMER =
  "Informational only. Not medical advice. Consult a qualified healthcare professional for medical concerns.";

export const EMERGENCY_WARNING =
  "If you are experiencing a medical emergency, call emergency services immediately.";

export const WELLNESS_PURPOSE =
  "This tool is for wellness education, self-reflection, and traditional pattern exploration. It is not a substitute for a doctor, licensed practitioner, emergency care, medical testing, prescribed medication, or professional medical judgment.";

export function FullMedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`${compact ? "border-l border-ink/12 pl-3" : "border border-ink/10 bg-white/72 p-4"}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Informational</p>
      <p className="mt-1 text-xs leading-5 text-ink/48">{FULL_MEDICAL_DISCLAIMER}</p>
    </aside>
  );
}

export function ShortResultDisclaimer() {
  return (
    <p className="text-[0.72rem] leading-5 text-ink/42">
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
    <aside className="border-l border-amber-300/70 pl-3">
      <p className="text-xs leading-5 text-ink/48">{EMERGENCY_WARNING}</p>
    </aside>
  );
}

export function WellnessPurposeDisclosure({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`${compact ? "border-l border-ink/12 pl-3" : "border border-ink/10 bg-white/72 p-4"}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Purpose</p>
      <p className="mt-1 text-xs leading-5 text-ink/48">{WELLNESS_PURPOSE}</p>
    </aside>
  );
}
