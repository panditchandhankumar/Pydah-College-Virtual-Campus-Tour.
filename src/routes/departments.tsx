import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DEPARTMENTS } from "@/data/departments";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — PYDAH College" },
      {
        name: "description",
        content: "Explore engineering and management departments at PYDAH College, their courses, labs and achievements.",
      },
    ],
  }),
  component: Departments,
});

function Departments() {
  const [activeId, setActiveId] = useState(DEPARTMENTS[0].id);
  const active = DEPARTMENTS.find((d) => d.id === activeId)!;

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Departments</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-primary">Programs at PYDAH</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Nine departments across engineering and management, each with dedicated labs, faculty and a strong industry network.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-32 lg:h-fit">
            <ul className="flex flex-wrap gap-2 lg:flex-col">
              {DEPARTMENTS.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setActiveId(d.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activeId === d.id
                        ? "bg-primary text-primary-foreground shadow-elegant"
                        : "bg-card text-foreground ring-1 ring-border hover:bg-muted"
                    }`}
                  >
                    <span className="mr-2 text-xs uppercase opacity-70">{d.short}</span>
                    <span className="hidden lg:inline">{d.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Detail */}
          <div className="rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border">
            <div className="relative -mx-8 -mt-8 mb-8 h-48 overflow-hidden rounded-t-3xl gradient-hero">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-6 left-8 text-white">
                <p className="text-xs uppercase tracking-widest text-accent">{active.short}</p>
                <h2 className="mt-1 font-display text-3xl font-bold">{active.name}</h2>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">{active.overview}</p>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Courses</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {active.courses.map((c) => (
                    <li key={c} className="rounded-lg bg-muted px-3 py-2 text-foreground">{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Laboratories</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {active.labs.map((l) => (
                    <li key={l} className="rounded-lg bg-muted px-3 py-2 text-foreground">{l}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">Achievements</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {active.achievements.map((a) => (
                    <li key={a} className="rounded-lg bg-muted px-3 py-2 text-foreground">{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tour"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-secondary"
              >
                Tour the block
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Talk to admissions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
