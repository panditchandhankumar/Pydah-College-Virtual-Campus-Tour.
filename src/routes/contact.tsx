import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — PYDAH College" },
      { name: "description", content: "Get in touch with PYDAH College admissions, faculty and campus tour desk." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Contact</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-primary">Let's talk.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Reach admissions, book a physical tour, or ask a question. We usually reply within one working day.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {[
              { icon: MapPin, title: "Campus", body: "Kakinada, Andhra Pradesh, India" },
              { icon: Phone, title: "Call", body: "+91 000 000 0000" },
              { icon: Mail, title: "Email", body: "hello@pydah.example" },
            ].map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{c.title}</p>
                  <p className="mt-1 text-foreground">{c.body}</p>
                </div>
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
              <div className="aspect-[4/3] w-full gradient-hero" aria-hidden />
              <p className="bg-card px-4 py-3 text-xs text-muted-foreground">
                Interactive campus map — coming soon.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="rounded-3xl bg-card p-8 shadow-elegant ring-1 ring-border"
          >
            <h2 className="font-display text-2xl font-semibold text-primary">Send a message</h2>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-foreground">Name</span>
                  <input required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-foreground">Email</span>
                  <input required type="email" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent" />
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-foreground">Subject</span>
                <input className="w-full rounded-xl border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-foreground">Message</span>
                <textarea rows={5} required className="w-full rounded-xl border border-input bg-background px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent" />
              </label>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-secondary"
              >
                <Send className="h-4 w-4" /> Send message
              </button>
              {sent && (
                <p className="rounded-xl bg-accent/20 px-4 py-3 text-sm text-primary">
                  Thanks — we'll be in touch shortly.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
