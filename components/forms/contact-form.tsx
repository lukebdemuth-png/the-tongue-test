"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="surface-card bg-soft-radial" role="status" aria-live="polite">
        <span className="eyebrow">Message Sent</span>
        <h2 className="text-3xl">Thank you for reaching out.</h2>
        <p className="mt-4 max-w-2xl">
          Your message came through. You can expect a follow-up by email, and you
          do not need to send a perfectly polished note for it to be useful.
        </p>
      </div>
    );
  }

  return (
    <form className="surface-card space-y-5" action="#" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block" htmlFor="contact-name">
          <span className="mb-2 block text-sm font-medium text-ink">Name</span>
          <input
            id="contact-name"
            type="text"
            name="name"
            required
            placeholder="Your name"
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-moss/45"
          />
        </label>
        <label className="block" htmlFor="contact-email">
          <span className="mb-2 block text-sm font-medium text-ink">Email</span>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-moss/45"
          />
        </label>
      </div>

      <label className="block" htmlFor="contact-subject">
        <span className="mb-2 block text-sm font-medium text-ink">I&apos;m reaching out about</span>
        <input
          id="contact-subject"
          type="text"
          name="subject"
          required
          placeholder="Channel strategy, app feedback, partnership, general question"
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-moss/45"
        />
      </label>

      <label className="block" htmlFor="contact-message">
        <span className="mb-2 block text-sm font-medium text-ink">Message</span>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder="Share your niche, your current channel, and what you want help improving."
          className="w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-ink/35 focus:border-moss/45"
        />
      </label>

      <button type="submit" className="button-primary">
        Send Message
      </button>
    </form>
  );
}
