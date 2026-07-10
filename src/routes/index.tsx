import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Building2, Users, GraduationCap, Sparkles, MapPin } from "lucide-react";
import { PANORAMAS } from "@/data/panoramas";
import { DEPARTMENTS } from "@/data/departments";
import campusAsset from "@/assets/pydah-campus.jpg.asset.json";


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
  { label: "Acres of campus", value: "72" },
  { label: "Programs", value: "24" },
  { label: "Faculty members", value: "310" },
  { label: "Placement rate", value: "94%" },
];

function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden pb-24 pt-40 min-h-[92vh] flex items-center">
        {/* Campus photo background */}
        <div className="absolute inset-0 -z-20">
          <img
            src={campusAsset.url}
            alt="PYDAH College aerial view"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        {/* Very light overlay so the campus photo stays bright and clear */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(120deg, oklch(0.18 0.03 258 / 0.22) 0%, oklch(0.24 0.04 258 / 0.15) 55%, oklch(0.14 0.03 250 / 0.18) 100%)",
          }}
        />


        <div className="mx-auto max-w-7xl px-6 text-white" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Immersive 360° experience
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl">
              Walk through <span className="gradient-text">PYDAH College</span> without leaving your seat.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl">
              A cinematic virtual tour of every department, lab and green space —
              built for prospective students, parents and visitors from anywhere in the world.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/tour"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105"
              >
                <Compass className="h-4 w-4" />
                Start Virtual Tour
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/departments"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Browse Departments
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass-dark rounded-2xl p-5">
                <p className="font-display text-3xl font-bold text-white md:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">
              About PYDAH
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-5xl">
              A campus designed to be experienced.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Since our founding, PYDAH has grown into a modern, research-driven college with
              nine engineering and management departments. The virtual tour is our invitation —
              step inside, look around, and picture yourself here.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Building2, title: "Modern facilities", desc: "Smart classrooms, incubation lab, sports complex." },
                { icon: Users, title: "Vibrant community", desc: "40+ student clubs across arts, sports and tech." },
                { icon: GraduationCap, title: "Career outcomes", desc: "Recruiters from India's top product companies." },
                { icon: MapPin, title: "Prime location", desc: "Green campus with excellent connectivity." },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold text-foreground">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl shadow-elegant">
              <img
                src={PANORAMAS[2].panorama}
                alt="Preview of PYDAH campus panorama"
                className="h-[520px] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-6 text-white">
                <p className="text-xs uppercase tracking-widest text-accent">Featured location</p>
                <p className="mt-1 font-display text-2xl font-semibold">Central Library</p>
              </div>
              <Link
                to="/tour"
                search={{ id: "library" }}
                className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-white"
              >
                Visit <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Departments preview */}
      <section className="bg-gradient-to-b from-muted/40 to-transparent py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">
                Departments
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-primary">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
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
        </div>
      </section>

      {/* Gallery preview */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">Gallery</p>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary">Snapshots from campus</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PANORAMAS.slice(0, 8).map((p, i) => (
            <Link
              key={p.id}
              to="/tour"
              search={{ id: p.id }}
              className={`group relative overflow-hidden rounded-2xl ${
                i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-[1/1]" : "aspect-square"
              }`}
            >
              <img
                src={p.panorama}
                alt={p.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="font-display text-sm font-semibold md:text-base">{p.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-center text-white shadow-elegant md:p-16">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Ready to look around?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            The full 360° tour takes about ten minutes — or as long as your curiosity lasts.
          </p>
          <Link
            to="/tour"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Compass className="h-4 w-4" /> Enter the tour
          </Link>
        </div>
      </section>
    </>
  );
}
