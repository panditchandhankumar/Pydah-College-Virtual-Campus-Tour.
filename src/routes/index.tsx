import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  Play,
  Sparkles,
  BookOpen,
  FlaskConical,
  Trophy,
  Lightbulb,
  Building2,
  Home as HomeIcon,
  Rocket,
  Users,
  Globe2,
} from "lucide-react";
import { PANORAMAS } from "@/data/panoramas";
import { DEPARTMENTS } from "@/data/departments";
import { IntroVideoModal } from "@/components/IntroVideoModal";
import campusAsset from "@/assets/pydah-home-hero.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PYDAH College — Immersive 360° Virtual Campus Tour" },
      {
        name: "description",
        content:
          "Walk through PYDAH College in cinematic 360°. Explore departments, labs, hostels, and green spaces from anywhere in the world.",
      },
      { property: "og:title", content: "PYDAH College — Immersive Virtual Campus Tour" },
      {
        property: "og:description",
        content: "A cinematic 360° tour of every department, lab and green space at PYDAH College of Engineering.",
      },
    ],
    links: [{ rel: "preload", as: "image", href: campusAsset.url, fetchpriority: "high" }],
  }),
  component: Landing,
});

// ─────────────────────────────────────────────────────────────────────────────
// Data

const HIGHLIGHTS = [
  {
    id: "drone",
    title: "Drone View",
    desc: "A cinematic sweep over the 72-acre campus.",
    icon: Compass,
    image: campusAsset.url,
    span: "md:col-span-2 md:row-span-2",
  },
  {
    id: "library",
    title: "Central Library",
    desc: "80,000 volumes and quiet reading pods.",
    icon: BookOpen,
    image: PANORAMAS[2].panorama,
    span: "md:col-span-2",
  },
  {
    id: "labs",
    title: "Laboratories",
    desc: "AI/ML, VLSI, robotics and more.",
    icon: FlaskConical,
    image: PANORAMAS[4].panorama,
  },
  {
    id: "sports",
    title: "Sports Complex",
    desc: "Cricket, football, tennis, athletics.",
    icon: Trophy,
    image: PANORAMAS[7].panorama,
  },
  {
    id: "innovation",
    title: "Innovation Center",
    desc: "Where student startups take shape.",
    icon: Lightbulb,
    image: PANORAMAS[4].panorama,
    span: "md:col-span-2",
  },
  {
    id: "hostels",
    title: "Hostels",
    desc: "Modern residences with 24/7 amenities.",
    icon: HomeIcon,
    image: PANORAMAS[8].panorama,
  },
];

const WHY = [
  { icon: Rocket, title: "Placements", desc: "94% placement rate with recruiters from India's top companies." },
  { icon: Lightbulb, title: "Innovation", desc: "Maker space, incubation, and 12+ patents in the last three years." },
  { icon: FlaskConical, title: "Research", desc: "Active labs across AI, VLSI, robotics and materials science." },
  { icon: Users, title: "Faculty", desc: "PhDs from IITs, NITs and leading global universities." },
  { icon: Building2, title: "Modern Labs", desc: "Industry-grade equipment across every department." },
  { icon: Globe2, title: "Global Reach", desc: "Exchange programs and international collaborations." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Landing

function Landing() {
  const [introOpen, setIntroOpen] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.18]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);

  return (
    <>
      <IntroVideoModal open={introOpen} onClose={() => setIntroOpen(false)} />

      {/* ═══════════════════════════════════ HERO */}
      <section ref={heroRef} className="relative isolate h-[100vh] min-h-[720px] w-full overflow-hidden">
        {/* Background media with parallax + slow zoom */}
        <motion.div
          style={{ y: bgY, scale: bgScale }}
          className="absolute inset-0 -z-20 will-change-transform"
        >
          <img
            src={campusAsset.url}
            alt="PYDAH College campus aerial view"
            className="h-full w-full object-cover animate-[kenburns_28s_ease-in-out_infinite_alternate]"
            loading="eager"
            fetchPriority="high"
          />
        </motion.div>

        {/* Soft neutral gradient overlay — text side is readable, image side stays clear */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(100deg, rgba(10,20,40,0.55) 0%, rgba(10,20,40,0.28) 38%, rgba(10,20,40,0.08) 65%, transparent 85%)",
          }}
        />

        {/* Content */}
        <motion.div
          style={{ y: contentY, textShadow: "0 2px 32px rgba(0,0,0,0.65)" }}
          className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pt-24 text-white"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/90 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Immersive 360° Experience
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="mt-8 max-w-4xl font-display text-[54px] font-bold leading-[1.03] tracking-tight md:text-[78px] lg:text-[90px]"
          >
            Walk Through <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
              PYDAH College
            </span>
            <br className="hidden sm:block" /> Like You're Already Here.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-8 max-w-xl text-[19px] leading-relaxed text-white/85 md:text-[22px]"
          >
            A cinematic 360° tour of every classroom, lab and green space —
            experienced from anywhere in the world.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => setIntroOpen(true)}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-secondary to-accent px-8 py-4 text-[17px] font-semibold text-white shadow-[0_20px_50px_-15px_rgba(40,199,250,0.7)] transition-transform hover:scale-[1.03]"
            >
              <Play className="h-4 w-4 fill-white" />
              Start Virtual Tour
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </motion.div>

        </motion.div>
      </section>


      {/* ═══════════════════════════════════ CAMPUS HIGHLIGHTS BENTO */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="mb-14 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
              Campus Highlights
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold text-primary md:text-6xl">
              Every corner, thoughtfully designed.
            </h2>
          </div>
          <p className="max-w-md text-[17px] text-muted-foreground">
            From flagship labs to open green spaces — a campus built for study, discovery and life.
          </p>
        </div>

        <div className="grid auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4 md:gap-5">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-3xl bg-muted ${h.span ?? ""}`}
            >
              <img
                src={h.image}
                alt={h.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white md:p-7">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25">
                  <h.icon className="h-5 w-5 text-accent" />
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold md:text-3xl">{h.title}</h3>
                <p className="mt-1 max-w-xs text-sm text-white/75">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ 360 EXPERIENCE CTA */}
      <section className="relative overflow-hidden bg-primary py-28 text-white md:py-36">
        {/* Animated gradient orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-secondary/40 blur-[120px]" />
          <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-accent/30 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
              360° Virtual Experience
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              Explore campus the way you'd walk it.
            </h2>
            <p className="mt-6 max-w-lg text-[18px] leading-relaxed text-white/75">
              Move between blocks, look up at the atrium, step into a lab — all in real-time 360°.
              Best experienced on desktop or with a VR headset.
            </p>
            <p className="mt-6 text-sm text-white/60">
              Use the virtual tour to move between blocks, look up at the atrium, and step into labs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-8 rounded-full border border-dashed border-white/15"
            />
            <div className="relative aspect-square overflow-hidden rounded-full shadow-[0_40px_120px_-20px_rgba(40,199,250,0.6)] ring-1 ring-white/20">
              <img
                src={PANORAMAS[2].panorama}
                alt="360 preview"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════ DEPARTMENTS */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
            Departments
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">
            Nine departments. <br className="hidden md:block" /> One connected campus.
          </h2>
        </div>

        <div className="space-y-4">
          {DEPARTMENTS.slice(0, 5).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_rgba(0,102,255,0.25)]"
            >
              <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr] md:items-center md:gap-10 md:p-8">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl md:aspect-square md:w-[220px]">
                  <img
                    src={PANORAMAS[(i + 2) % PANORAMAS.length].panorama}
                    alt={d.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {d.short}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold text-primary md:text-3xl">
                    {d.name}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[16px] text-muted-foreground">{d.overview}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ GALLERY MASONRY */}
      <section className="bg-gradient-to-b from-transparent via-muted/40 to-transparent py-28 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">Gallery</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">Snapshots from campus.</h2>
          </div>
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {PANORAMAS.slice(0, 8).map((p, i) => (
              <Link
                key={p.id}
                to="/tour"
                search={{ id: p.id }}
                className="group mb-4 block break-inside-avoid overflow-hidden rounded-2xl"
              >
                <div className={`relative overflow-hidden ${i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}`}>
                  <img
                    src={p.panorama}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-display text-base font-semibold md:text-lg">{p.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ WHY PYDAH */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">Why PYDAH</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">
            A university built for outcomes.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.05 }}
              className="group rounded-3xl bg-card p-8 ring-1 ring-border transition-all hover:-translate-y-1 hover:ring-secondary/30 hover:shadow-[0_20px_60px_-20px_rgba(0,102,255,0.25)]"
            >
              <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-accent text-white shadow-[0_10px_30px_-10px_rgba(0,102,255,0.6)] transition-transform group-hover:scale-110 group-hover:rotate-3">
                <w.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold text-primary">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>





      {/* ═══════════════════════════════════ FINAL CTA */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-secondary to-accent p-12 text-center text-white shadow-[0_40px_120px_-30px_rgba(0,102,255,0.55)] md:p-20">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3), transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              Ready to look around?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[18px] text-white/85">
              The full 360° tour takes about ten minutes — or as long as your curiosity lasts.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
