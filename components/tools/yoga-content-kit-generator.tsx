"use client";

import { ChangeEvent, ReactNode, useMemo, useState } from "react";

import {
  generateYogaContentKit,
  type StoryFrame,
  type YogaContentKit,
  type YogaContentKitInput,
} from "@/lib/yoga-content-kit";

const sampleTranscript = `Today we are working with the relationship between the breath, the ribcage, and the spine. Before you go deeper into the posture, notice whether you are pushing with the shoulders. Let the sternum widen without hardening the front ribs. Inhale to create length through the side body. Exhale to soften the jaw, the throat, and the places that are gripping. The pose becomes steadier when the pelvis is grounded and the breath stays even. This is not about forcing a bigger shape. It is about creating a clear inner lift while the outer body stays quiet.`;

const initialInput: YogaContentKitInput = {
  classTitle: "Breath, Ribcage, and Steadiness",
  teacherName: "Himalayan Institute",
  transcript: sampleTranscript,
  mainTheme: "Using the breath to create steadiness without over-efforting",
  imageNotes: "Use a seated side-bend or upright pose with ribcage labels.",
  productCta: "Join the next Himalayan Institute practice or explore the full class.",
};

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink">
      {children}
      {optional ? <span className="ml-2 text-ink/45">Optional</span> : null}
    </label>
  );
}

function OutputCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card border-ink/5 bg-white/80">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StoryFrameCard({ frame, index }: { frame: StoryFrame; index: number }) {
  return (
    <article className="rounded-[24px] border border-ink/8 bg-[#fffaf3] p-5">
      <span className="text-[11px] uppercase tracking-[0.24em] text-moss/75">Frame {index + 1}</span>
      <p className="mt-3 whitespace-pre-line text-lg leading-7 text-ink">{frame.text}</p>
      {frame.cta ? (
        <p className="mt-4 text-sm font-medium text-[#CF6F1A]">CTA: {frame.cta}</p>
      ) : null}
    </article>
  );
}

export function YogaContentKitGenerator() {
  const [input, setInput] = useState<YogaContentKitInput>(initialInput);
  const [uploadMessage, setUploadMessage] = useState(
    "Paste a transcript or upload a `.txt`, `.md`, `.srt`, or `.vtt` file.",
  );
  const [copied, setCopied] = useState(false);

  const contentKit = useMemo<YogaContentKit>(() => generateYogaContentKit(input), [input]);
  const jsonOutput = useMemo(() => JSON.stringify(contentKit, null, 2), [contentKit]);

  function updateField<Key extends keyof YogaContentKitInput>(
    key: Key,
    value: YogaContentKitInput[Key],
  ) {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      updateField("transcript", text);
      setUploadMessage(`Loaded transcript from ${file.name}.`);
    } catch {
      setUploadMessage("That file could not be read in the browser. Try a plain text transcript file.");
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="container-shell section-space pt-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <section className="surface-card border-[#CF6F1A]/10 bg-[linear-gradient(180deg,rgba(255,250,243,0.98),rgba(255,255,255,0.92))]">
          <div className="mb-8 rounded-[24px] border border-[#CF6F1A]/12 bg-[#fff7ed] p-5">
            <p className="text-sm leading-7 text-ink/75">
              Paste a transcript or drop in a text-based caption file. The generator pulls teaching
              cues from the actual class language and formats them into saveable social assets plus a
              reusable JSON payload.
            </p>
          </div>

          <div className="grid gap-5">
            <div>
              <FieldLabel htmlFor="classTitle">Class title</FieldLabel>
              <input
                id="classTitle"
                value={input.classTitle}
                onChange={(event) => updateField("classTitle", event.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-ink/10 bg-white px-4 text-sm outline-none focus:border-[#CF6F1A]/50"
              />
            </div>

            <div>
              <FieldLabel htmlFor="teacherName">Teacher name</FieldLabel>
              <input
                id="teacherName"
                value={input.teacherName}
                onChange={(event) => updateField("teacherName", event.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-ink/10 bg-white px-4 text-sm outline-none focus:border-[#CF6F1A]/50"
              />
            </div>

            <div>
              <FieldLabel htmlFor="mainTheme" optional>
                Main theme
              </FieldLabel>
              <input
                id="mainTheme"
                value={input.mainTheme ?? ""}
                onChange={(event) => updateField("mainTheme", event.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-ink/10 bg-white px-4 text-sm outline-none focus:border-[#CF6F1A]/50"
                placeholder="If omitted, the generator will infer it from the transcript."
              />
            </div>

            <div>
              <FieldLabel htmlFor="imageNotes" optional>
                Image notes
              </FieldLabel>
              <input
                id="imageNotes"
                value={input.imageNotes ?? ""}
                onChange={(event) => updateField("imageNotes", event.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-ink/10 bg-white px-4 text-sm outline-none focus:border-[#CF6F1A]/50"
                placeholder="Pose ideas, image mood, teacher photo notes, anatomy overlay ideas."
              />
            </div>

            <div>
              <FieldLabel htmlFor="productCta" optional>
                Product or event CTA
              </FieldLabel>
              <input
                id="productCta"
                value={input.productCta ?? ""}
                onChange={(event) => updateField("productCta", event.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-ink/10 bg-white px-4 text-sm outline-none focus:border-[#CF6F1A]/50"
                placeholder="Join the upcoming event, watch the full class, explore the course."
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <FieldLabel htmlFor="transcript">Transcript</FieldLabel>
                <label className="inline-flex cursor-pointer rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink/78 hover:border-[#CF6F1A]/35">
                  Upload transcript
                  <input
                    type="file"
                    accept=".txt,.md,.srt,.vtt,text/plain,text/markdown"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              <textarea
                id="transcript"
                value={input.transcript}
                onChange={(event) => updateField("transcript", event.target.value)}
                className="min-h-[18rem] w-full rounded-[22px] border border-ink/10 bg-white px-4 py-4 text-sm leading-7 outline-none focus:border-[#CF6F1A]/50"
                placeholder="Paste the class transcript here."
              />
              <p className="mt-3 text-sm text-ink/55">{uploadMessage}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <OutputCard title="Input Signals">
            <div className="flex flex-wrap gap-2">
              {contentKit.meta.extractedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[#CF6F1A]/18 bg-[#fff6ea] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#8d4d11]"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              {contentKit.meta.supportingTranscriptPulls.map((snippet) => (
                <blockquote
                  key={snippet}
                  className="rounded-[20px] border border-ink/8 bg-white p-4 text-sm leading-7 text-ink/80"
                >
                  {snippet}
                </blockquote>
              ))}
            </div>
          </OutputCard>

          <OutputCard title="Reusable JSON">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="max-w-xl text-sm text-ink/62">
                Structured for later handoff into Canva, Figma, After Effects, or a content ops
                workflow.
              </p>
              <button type="button" className="button-secondary" onClick={copyJson}>
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
            <pre className="max-h-[24rem] overflow-auto rounded-[22px] bg-ink p-5 text-xs leading-6 text-[#f8f6f2]">
              <code>{jsonOutput}</code>
            </pre>
          </OutputCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <OutputCard title="Instagram Carousel">
          <div className="grid gap-4">
            {contentKit.instagramCarousel.map((slide, index) => (
              <article
                key={`${slide.slideTitle}-${index}`}
                className="rounded-[24px] border border-ink/8 bg-[#fffdf9] p-5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-full bg-[#CF6F1A] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white">
                    Slide {index + 1}
                  </span>
                  <h3 className="text-2xl">{slide.slideTitle}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Main text</p>
                    <p className="mt-2 whitespace-pre-line text-ink">{slide.mainText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Visual direction</p>
                    <p className="mt-2 text-ink">{slide.visualDirection}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-moss/80">Design notes</p>
                    <p className="mt-2 text-ink">{slide.designNotes}</p>
                    {slide.cta ? (
                      <>
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-moss/80">CTA</p>
                        <p className="mt-2 text-[#8d4d11]">{slide.cta}</p>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </OutputCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <OutputCard title="Reel Package">
            <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Voiceover script</p>
            <p className="mt-2 text-ink">{contentKit.reelPackage.voiceoverScript}</p>

            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-moss/80">On-screen text overlays</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {contentKit.reelPackage.onScreenText.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-ink/10 bg-[#fff8ee] px-3 py-1.5 text-sm text-ink/80"
                >
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-moss/80">Suggested b-roll moments</p>
            <ul className="mt-3 grid gap-2 text-sm text-ink/80">
              {contentKit.reelPackage.bRollMoments.map((moment) => (
                <li key={moment} className="rounded-[18px] border border-ink/8 bg-white p-3">
                  {moment}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-moss/80">Caption</p>
            <p className="mt-2 whitespace-pre-line text-ink">{contentKit.reelPackage.caption}</p>
          </OutputCard>

          <OutputCard title="Story Package">
            <div className="grid gap-4">
              {contentKit.storyPackage.map((frame, index) => (
                <StoryFrameCard key={`${frame.text}-${index}`} frame={frame} index={index} />
              ))}
            </div>
          </OutputCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <OutputCard title="Free PDF Lead Magnet">
            <div className="rounded-[24px] border border-[#CF6F1A]/14 bg-[#fff7ed] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Title</p>
              <h3 className="mt-2 text-2xl">{contentKit.leadMagnet.title}</h3>
            </div>

            <div className="mt-5 grid gap-4">
              {contentKit.leadMagnet.pageStructure.map((page, index) => (
                <article
                  key={`${page.pageTitle}-${index}`}
                  className="rounded-[24px] border border-ink/8 bg-white p-5"
                >
                  <span className="text-[11px] uppercase tracking-[0.22em] text-moss/75">Page {index + 1}</span>
                  <h3 className="mt-2 text-2xl">{page.pageTitle}</h3>
                  <p className="mt-3 text-ink">{page.shortTeaching}</p>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Pulled class content</p>
                      <ul className="mt-2 grid gap-2 text-sm text-ink/80">
                        {page.pulledClassContent.map((item) => (
                          <li key={item} className="rounded-[16px] bg-[#f8f6f2] p-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Guided practice</p>
                      <ul className="mt-2 grid gap-2 text-sm text-ink/80">
                        {page.guidedPractice.map((item) => (
                          <li key={item} className="rounded-[16px] bg-[#f8f6f2] p-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-moss/80">Reflection prompts</p>
                    {page.reflectionPrompts.map((prompt) => (
                      <p key={prompt} className="rounded-[16px] border border-ink/8 p-3 text-sm text-ink/80">
                        {prompt}
                      </p>
                    ))}
                    <p className="text-sm font-medium text-[#8d4d11]">CTA: {page.cta}</p>
                  </div>
                </article>
              ))}
            </div>
          </OutputCard>

          <OutputCard title="Thumbnail and Still Ideas">
            <div className="grid gap-5">
              <div>
                <h3 className="text-xl">YouTube thumbnail titles</h3>
                <div className="mt-3 grid gap-3">
                  {contentKit.thumbnailIdeas.map((idea) => (
                    <article key={idea.title} className="rounded-[20px] border border-ink/8 bg-white p-4">
                      <p className="font-medium text-ink">{idea.title}</p>
                      <p className="mt-2 text-sm text-ink/72">{idea.imageDirection}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl">IG still headlines</h3>
                <div className="mt-3 grid gap-3">
                  {contentKit.igStillIdeas.map((idea) => (
                    <article key={idea.headline} className="rounded-[20px] border border-ink/8 bg-white p-4">
                      <p className="font-medium text-ink">{idea.headline}</p>
                      <p className="mt-2 text-sm text-ink/72">{idea.imageDirection}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </OutputCard>
        </div>
      </div>
    </div>
  );
}
