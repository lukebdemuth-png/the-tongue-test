"use client";

import { useState } from "react";

type WaitlistFormProps = {
  compact?: boolean;
  source: string;
  buttonLabel?: string;
  successMessage?: string;
  helperText?: string;
  interestPlaceholder?: string;
};

export function WaitlistForm({
  compact = false,
  source,
  buttonLabel = "Join Updates",
  successMessage = "You are on the early access list. I will send thoughtful updates as Tongue Test: TCM AI develops.",
  helperText = "Educational updates only. No spam, no diagnosis, no treatment claims.",
  interestPlaceholder = "What do you want Tongue Test: TCM AI to help you understand?",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, interest, source }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not join the waitlist.");
      setStatus("success");
      setMessage(successMessage);
      setEmail("");
      setName("");
      setInterest("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not join the waitlist.");
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "grid gap-3 sm:grid-cols-[1fr_auto]" : "grid gap-3"}>
        <label className="sr-only" htmlFor={`${source}-email`}>
          Email address
        </label>
        <input
          id={`${source}-email`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="min-h-12 w-full border border-ink/10 bg-white/85 px-5 text-sm text-ink outline-none focus:border-moss"
        />
        {compact ? (
          <button className="button-primary min-w-[10rem]" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : buttonLabel}
          </button>
        ) : null}
      </div>

      {!compact ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name, practice, or organization"
            className="min-h-12 w-full border border-ink/10 bg-white/85 px-5 text-sm text-ink outline-none focus:border-moss"
          />
          <textarea
            value={interest}
            onChange={(event) => setInterest(event.target.value)}
            placeholder={interestPlaceholder}
            rows={3}
            className="w-full resize-y border border-ink/10 bg-white/85 p-5 text-sm leading-6 text-ink outline-none focus:border-moss"
          />
          <button className="button-primary w-full" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : buttonLabel}
          </button>
        </>
      ) : null}

      {message ? (
        <p className={`text-sm leading-6 ${status === "error" ? "text-red-700" : "text-moss"}`}>
          {message}
        </p>
      ) : (
        <p className="text-sm leading-6 text-ink/54">
          {helperText}
        </p>
      )}
    </form>
  );
}
