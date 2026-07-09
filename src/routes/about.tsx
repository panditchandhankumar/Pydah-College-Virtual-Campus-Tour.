import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — PYDAH College" },
      { name: "description", content: "Learn about PYDAH College — vision, mission, campus and community." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="pt-32">
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">About</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-primary">
          A community built for the curious.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          PYDAH College brings together students, researchers and industry mentors on a
          72-acre campus designed for hands-on learning. Our virtual tour is one way we
          open the gates — no visit slot, no travel plans, just a browser and a bit of
          curiosity.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="font-display text-2xl font-semibold text-primary">Vision</h2>
            <p className="mt-3 text-muted-foreground">
              To be an institution where every student graduates with the skill, character
              and confidence to build things the world needs.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="font-display text-2xl font-semibold text-primary">Mission</h2>
            <p className="mt-3 text-muted-foreground">
              To pair rigorous academics with real-world projects, entrepreneurship and
              community engagement across every discipline.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl gradient-hero p-10 text-white shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Campus at a glance</h2>
          <dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              ["1998", "Founded"],
              ["72", "Acres"],
              ["9", "Departments"],
              ["6,800+", "Students"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl font-bold text-accent">{v}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-white/70">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
