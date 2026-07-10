import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Compass, Building2, Users, GraduationCap, MapPin, Award, BookOpen } from "lucide-react";
import { PANORAMAS } from "@/data/panoramas";
import { DEPARTMENTS } from "@/data/departments";
import { IntroVideoModal } from "@/components/IntroVideoModal";
import campusAsset from "@/assets/pydah-campus.jpg.asset.json";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PYDAH College — Immersive Virtual Campus Tour" },
      {
        name: "description",
        content:
          "Explore PYDAH College in 360°. Walk through classrooms, labs, hostels and gardens from anywhere in the world.",
      },
    ],
  }),
  component: Landing,
});

const stats = [
  { label: "Acres", value: "72", icon: MapPin },
  { label: "Programs", value: "24", icon: BookOpen },
  { label: "Faculty", value: "310", icon: Users },
  { label: "Placements", value: "94%", icon: Award },
];

function Landing() {
  const [introOpen, setIntroOpen] = useState(false);

  return (
    <>
      <IntroVideoModal open={introOpen} onClose={() => setIntroOpen(false)} />

      {/* HERO — classic split layout, no overlay on the photo */}
      <section className="relative bg-background pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <img src={logoAsset.url} alt="PYDAH crest" className="h-14 w-14 object-contain" />
                <div>
                  <p className="font-display text-lg font-semibold text-primary leading-tight">
                    PYDAH College
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Autonomous Institution · Est. 2009
                  </p>
                </div>
              </div>

              <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Immersive 360° Virtual Tour
              </span>

              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] text-primary md:text-6xl">
                A campus <em className="not-italic gradient-text">worth walking</em> through.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Step inside PYDAH from anywhere in the world. Explore classrooms,
                laboratories, hostels and green spaces in crisp 360° — the way a
                visitor would see them on campus.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setIntroOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
                >
                  <Compass className="h-4 w-4" />
                  Start Virtual Tour
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <Link
                  to="/departments"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-muted"
                >
                  Browse Departments
                </Link>
              </div>

              {/* stat strip */}
              <div className="mt-10 grid grid-cols-4 gap-4 border-t border-border pt-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-bold text-primary md:text-3xl">{s.value}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — clear campus photograph, framed like a classic postcard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-elegant ring-1 ring-border">
                <img
                  src={campusAsset.url}
                  alt="PYDAH College campus, aerial view"
                  className="h-[460px] w-full object-cover md:h-[540px]"
                  loading="eager"
                />
              </div>

              {/* floating caption */}
              <div className="absolute -bottom-6 left-6 right-6 rounded-xl bg-card p-4 shadow-elegant ring-1 ring-border md:left-8 md:right-auto md:max-w-xs">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-foreground/70">
                  The Campus
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-primary">
                  72 acres of learning, laboratories &amp; lawns.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT — classic four-column feature strip */}
      <section className="border-y border-border bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Building2, title: "Modern facilities", desc: "Smart classrooms, incubation lab, sports complex." },
              { icon: Users, title: "Vibrant community", desc: "40+ student clubs across arts, sports and tech." },
              { icon: GraduationCap, title: "Career outcomes", desc: "Recruiters from India's top product companies." },
              { icon: MapPin, title: "Prime location", desc: "Green campus with excellent connectivity." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-base font-semibold text-primary">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-foreground/70">
              Departments
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">
              Nine departments. One campus.
            </h2>
          </div>
          <Link to="/departments" className="hidden text-sm font-semibold text-secondary hover:text-primary sm:inline">
            View all →
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.slice(0, 6).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {d.short}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{d.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d.overview}</p>
              <Link
                to="/departments"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-secondary group-hover:text-primary"
              >
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="border-t border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-foreground/70">
            Gallery
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">
            Snapshots from campus
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {PANORAMAS.slice(0, 8).map((p, i) => (
              <Link
                key={p.id}
                to="/tour"
                search={{ id: p.id }}
                className={`group relative overflow-hidden rounded-xl ring-1 ring-border ${
                  i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                }`}
              >
                <img
                  src={p.panorama}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="font-display text-sm font-semibold md:text-base">{p.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-10 text-center text-white shadow-elegant md:p-14">
          <h2 className="font-display text-3xl font-bold md:text-5xl">Ready to look around?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            The full 360° tour takes about ten minutes — or as long as your curiosity lasts.
          </p>
          <button
            onClick={() => setIntroOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Compass className="h-4 w-4" /> Enter the tour
          </button>
        </div>
      </section>
    </>
  );
}
