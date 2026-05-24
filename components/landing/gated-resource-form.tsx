"use client";

import { useState } from "react";

type GatedResourceFormProps = {
  slug: string;
  title: string;
  assetHref?: string;
  assetLabel?: string;
};

export function GatedResourceForm({
  slug,
  title,
  assetHref,
  assetLabel = "Open resource",
}: GatedResourceFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
        body: JSON.stringify({
          email,
          name,
          interest: `Requested gated resource: ${title}`,
          source: `free-content:${slug}`,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not unlock this resource.");

      setStatus("success");
      setMessage("You are signed up. The resource is unlocked below.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not unlock this resource.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-moss/20 bg-white/88 p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">
          Resource unlocked
        </p>
        <h2 className="mt-4 text-3xl leading-9">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-ink/66">{message}</p>
        {assetHref ? (
          <a className="button-primary mt-6 w-full" href={assetHref} target="_blank" rel="noreferrer">
            {assetLabel}
          </a>
        ) : (
          <p className="mt-6 border border-ink/10 bg-fog/70 p-4 text-sm leading-7 text-ink/66">
            The signup gate is working. Add the PDF or audio file path to this
            resource before sharing the link publicly.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-ink/10 bg-white/88 p-6 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
        Unlock this resource
      </p>
      <h2 className="mt-4 text-3xl leading-9">Sign up to view it.</h2>
      <p className="mt-4 text-sm leading-7 text-ink/66">
        Enter your email to unlock this piece and join the Patterns newsletter.
      </p>
      <div className="mt-6 grid gap-3">
        <label className="sr-only" htmlFor={`${slug}-name`}>
          Name
        </label>
        <input
          id={`${slug}-name`}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="min-h-12 w-full border border-ink/10 bg-white/85 px-5 text-sm text-ink outline-none focus:border-moss"
        />
        <label className="sr-only" htmlFor={`${slug}-email`}>
          Email address
        </label>
        <input
          id={`${slug}-email`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="min-h-12 w-full border border-ink/10 bg-white/85 px-5 text-sm text-ink outline-none focus:border-moss"
        />
        <button className="button-primary w-full" disabled={status === "loading"}>
          {status === "loading" ? "Unlocking..." : "Unlock Resource"}
        </button>
      </div>
      {message ? (
        <p className={`mt-4 text-sm leading-6 ${status === "error" ? "text-red-700" : "text-moss"}`}>
          {message}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink/54">
          Educational content only. No diagnosis, treatment claims, or spam.
        </p>
      )}
    </form>
  );
}
