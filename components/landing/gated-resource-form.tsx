"use client";

import { useEffect, useMemo, useState } from "react";

type GatedResourceFormProps = {
  slug: string;
  title: string;
  assetHref?: string;
  assetLabel?: string;
  unlockSections?: Array<{
    title: string;
    items: string[];
  }>;
};

export function GatedResourceForm({
  slug,
  title,
  assetHref,
  assetLabel = "Open resource",
  unlockSections = [],
}: GatedResourceFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [unlockedEmail, setUnlockedEmail] = useState("");

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
      setUnlockedEmail(email);
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
        ) : unlockSections.length ? (
          <div className="mt-6 grid gap-4">
            {unlockSections.map((section) => (
              <section key={section.title} className="border border-ink/10 bg-fog/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">
                  {section.title}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-6 border border-ink/10 bg-fog/70 p-4 text-sm leading-7 text-ink/66">
            The signup gate is working. Add the PDF or audio file path to this
            resource before sharing the link publicly.
          </p>
        )}
        <GmailResourceEmailActions email={unlockedEmail} title={title} assetHref={assetHref} />
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
        Enter your email to unlock this piece and receive future educational updates.
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

function GmailResourceEmailActions({
  email,
  title,
  assetHref,
}: {
  email: string;
  title: string;
  assetHref?: string;
}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const resourceUrl = useMemo(() => {
    if (assetHref) return assetHref;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [assetHref]);

  useEffect(() => {
    let alive = true;
    fetch("/api/gmail/status")
      .then((response) => response.json())
      .then((body) => {
        if (!alive) return;
        setConnected(Boolean(body.connected));
      })
      .catch(() => {
        if (alive) setConnected(false);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const payload = {
    to: email,
    subject: `${title} from Tongue Test: TCM AI`,
    body: [
      `Here is the resource you unlocked: ${title}`,
      "",
      resourceUrl ? `Resource link: ${resourceUrl}` : "The resource is unlocked on the page.",
      "",
      "Quick reminder:",
      "- Use natural daylight or neutral indoor light.",
      "- Avoid filters, flash glare, colored drinks, brushing, or scraping right before the photo when possible.",
      "- Center the full tongue and keep it in focus.",
      "",
      "Educational content only. Not medical advice.",
    ].join("\n"),
  };
  const connectHref =
    typeof window === "undefined"
      ? "/api/gmail/connect"
      : `/api/gmail/connect?returnTo=${encodeURIComponent(window.location.pathname)}`;

  async function createDraft() {
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/gmail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create Gmail draft.");
      setStatus("Draft created in Gmail.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create Gmail draft.");
    } finally {
      setSending(false);
    }
  }

  async function sendEmail() {
    const confirmed = window.confirm("Send this email through your connected Gmail account?");
    if (!confirmed) return;
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, confirmSend: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not send Gmail email.");
      setStatus("Email sent through Gmail.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send Gmail email.");
    } finally {
      setSending(false);
    }
  }

  async function disconnect() {
    setSending(true);
    setStatus("");
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      setConnected(false);
      setStatus("Gmail disconnected.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mt-6 border border-ink/10 bg-fog/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">Optional Gmail Draft</p>
      <p className="mt-3 text-sm leading-7 text-ink/62">
        Connect Gmail to create a draft from your signed-in Gmail account. Nothing is sent unless you
        explicitly confirm.
      </p>
      {connected ? (
        <div className="mt-4 grid gap-2">
          <button type="button" className="button-secondary w-full" disabled={sending} onClick={createDraft}>
            {sending ? "Working..." : "Create Gmail Draft"}
          </button>
          <button type="button" className="button-secondary w-full" disabled={sending} onClick={sendEmail}>
            Send With Confirmation
          </button>
          <button type="button" className="text-xs uppercase tracking-[0.16em] text-ink/45" onClick={disconnect}>
            Disconnect Gmail
          </button>
        </div>
      ) : (
        <a className="button-secondary mt-4 w-full" href={connectHref}>
          Connect Gmail
        </a>
      )}
      {status ? <p className="mt-3 text-sm leading-6 text-ink/58">{status}</p> : null}
    </div>
  );
}
