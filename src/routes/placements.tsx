import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Award } from "lucide-react";

export const Route = createFileRoute("/placements")({
  head: () => ({
    meta: [
      { title: "Placements — PYDAH College of Engineering" },
      {
        name: "description",
        content:
          "PYDAH College placement highlights: 94% placement rate, top recruiters, and career outcomes across engineering disciplines.",
      },
    ],
  }),
  component: Placements,
});

const stats = [
  { icon: TrendingUp, value: "94%", label: "Placement rate" },
  { icon: Briefcase, value: "180+", label: "Recruiting partners" },
  { icon: Award, value: "₹42 LPA", label: "Highest package" },
];

const recruiters = [
  "TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Deloitte",
  "HCL", "Capgemini", "Amazon", "Microsoft", "IBM", "Tech Mahindra",
];

function Placements() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary to-secondary pb-24 pt-40 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Career Outcomes</p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">Placements that open doors.</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            PYDAH graduates join India's most competitive product companies, research labs and global consultancies.
          </p>
          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl ring-1 ring-white/20"
              >
                <s.icon className="h-6 w-6 text-accent" />
                <p className="mt-4 font-display text-5xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm uppercase tracking-wider text-white/70">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">Top recruiters</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary">Where our students go.</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {recruiters.map((r) => (
            <div
              key={r}
              className="grid aspect-[3/2] place-items-center rounded-2xl bg-card font-display text-lg font-semibold text-primary ring-1 ring-border transition hover:-translate-y-1 hover:shadow-elegant"
            >
              {r}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
