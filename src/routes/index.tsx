import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  Play,
  MousePointer2,
  Sparkles,
  BookOpen,
  FlaskConical,
  Trophy,
  Lightbulb,
  Building2,
  Home as HomeIcon,
  Rocket,
  Users,
  GraduationCap,
  Globe2,
  Star,
  Quote,
  ChevronRight,
} from "lucide-react";
import { PANORAMAS } from "@/data/panoramas";
import { DEPARTMENTS } from "@/data/departments";
import { IntroVideoModal } from "@/components/IntroVideoModal";
import campusAsset from "@/assets/pydah-campus.jpg.asset.json";

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

const STATS = [
  { value: "72", label: "Acres Campus" },
  { value: "24", label: "Programs" },
  { value: "310", label: "Faculty" },
  { value: "94%", label: "Placements" },
];

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

const TESTIMONIALS = [
  {
    name: "Ananya Rao",
    role: "CSE '24 · Software Engineer @ Amazon",
    quote:
      "PYDAH's project-first curriculum gave me real product thinking. My internship at day 90 was because of what the faculty pushed us to build.",
  },
  {
    name: "Karthik Menon",
    role: "ECE '23 · VLSI Engineer @ Intel",
    quote:
      "The VLSI lab is genuinely industry-grade. I taped out a working chip as an undergrad — that got me the Intel interview.",
  },
  {
    name: "Priya Sharma",
    role: "M.Tech AI '24 · Research @ IISc",
    quote:
      "Research culture, mentorship, and access to compute — everything I needed to publish before graduating.",
  },
];

const PLACEMENT_LOGOS = ["TCS", "Infosys", "Wipro", "Amazon", "Microsoft", "Accenture", "Deloitte", "IBM"];

// ─────────────────────────────────────────────────────────────────────────────
// Animated counter

function Counter({ value }: { value: string }) {
  const numeric = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[\d]/g, "");
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (!ref.current || isNaN(numeric)) {
      setN(numeric || 0);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !shown.current) {
          shown.current = true;
          const start = performance.now();
          const dur = 1400;
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(numeric * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [numeric]);

  return (
    <span ref={ref}>
      {isNaN(numeric) ? value : `${n}${suffix}`}
    </span>
  );
}

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

        {/* Soft UI-tinted gradient overlay — text side is readable, image side stays clear */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(100deg, rgba(91,26,91,0.62) 0%, rgba(91,26,91,0.34) 38%, rgba(91,26,91,0.10) 65%, transparent 85%)",
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
            <Link
              to="/departments"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-[17px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              Explore Campus
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
          >
            <div className="flex flex-col items-center gap-2 text-white/70">
              <MousePointer2 className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
              <span className="relative block h-8 w-[2px] overflow-hidden rounded-full bg-white/20">
                <motion.span
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-accent"
                />
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════ FLOATING STATS */}
      <section className="relative z-10 mx-auto -mt-20 max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(7,27,68,0.25)] backdrop-blur-xl transition-shadow hover:shadow-[0_30px_80px_-20px_rgba(0,102,255,0.35)] md:p-8"
            >
              <p className="font-display text-[34px] font-bold text-primary md:text-[44px]">
                <Counter value={s.value} />
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">
                {s.label}
              </p>
              <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
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
            <button
              onClick={() => setIntroOpen(true)}
              className="mt-10 group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[17px] font-semibold text-primary shadow-glow transition-transform hover:scale-[1.03]"
            >
              <Play className="h-4 w-4 fill-primary" />
              Enter Virtual Tour
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
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
              <div className="absolute inset-0 grid place-items-center bg-primary/40">
                <button
                  onClick={() => setIntroOpen(true)}
                  className="grid h-24 w-24 place-items-center rounded-full bg-white/95 text-primary shadow-2xl transition-transform hover:scale-110"
                  aria-label="Play tour"
                >
                  <Play className="h-8 w-8 fill-primary" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════ DEPARTMENTS */}
      <section className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
              Departments
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">
              Nine departments. <br className="hidden md:block" /> One connected campus.
            </h2>
          </div>
          <Link
            to="/departments"
            className="hidden shrink-0 rounded-full border border-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground md:inline-flex"
          >
            View all →
          </Link>
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
              <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr_auto] md:items-center md:gap-10 md:p-8">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl md:aspect-square md:w-[220px]">
                  <img
                    src={PANORAMAS[(i + 2) % PANORAMAS.length].panorama}
                    alt={d.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 to-transparent" />
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
                <Link
                  to="/departments"
                  className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-all group-hover:bg-secondary md:self-center"
                >
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ GALLERY MASONRY */}
      <section className="bg-gradient-to-b from-transparent via-muted/40 to-transparent py-28 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">Gallery</p>
              <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">Snapshots from campus.</h2>
            </div>
            <Link to="/gallery" className="text-sm font-semibold text-secondary hover:text-primary">
              Full gallery →
            </Link>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent opacity-70 transition-opacity group-hover:opacity-90" />
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

      {/* ═══════════════════════════════════ TESTIMONIALS */}
      <section className="bg-gradient-to-b from-muted/40 to-transparent py-28 md:py-36">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-secondary">
              Student Voices
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary md:text-6xl">
              What our graduates say.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_20px_60px_-25px_rgba(7,27,68,0.2)] backdrop-blur-xl"
              >
                <Quote className="absolute right-6 top-6 h-10 w-10 text-accent/30" />
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 fill-accent" />
                  ))}
                </div>
                <p className="mt-5 text-[15px] leading-relaxed text-foreground/85">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-secondary to-accent font-display text-sm font-bold text-white">
                    {t.name.split(" ").map((s) => s[0]).join("")}
                  </span>
                  <div>
                    <p className="font-semibold text-primary">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ PLACEMENTS */}
      <section className="relative overflow-hidden bg-primary py-28 text-white md:py-36">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 rounded-full bg-secondary/30 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Placements</p>
              <h2 className="mt-3 font-display text-4xl font-bold md:text-6xl">
                Careers that begin here go everywhere.
              </h2>
              <p className="mt-6 max-w-lg text-[17px] text-white/75">
                180+ recruiting partners visit campus every year — from India's largest IT services firms to global product companies.
              </p>
              <div className="mt-10 grid grid-cols-3 gap-6">
                {[
                  { v: "94%", l: "Placed" },
                  { v: "₹42L", l: "Highest" },
                  { v: "180+", l: "Recruiters" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-4xl font-bold md:text-5xl">{s.v}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/placements"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[16px] font-semibold text-accent-foreground shadow-glow transition-transform hover:scale-[1.03]"
              >
                <GraduationCap className="h-4 w-4" />
                See placement report
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLACEMENT_LOGOS.map((r, i) => (
                <motion.div
                  key={r}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="grid aspect-[3/2] place-items-center rounded-2xl border border-white/10 bg-white/5 font-display text-lg font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-white/10"
                >
                  {r}
                </motion.div>
              ))}
            </div>
          </div>
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
            <button
              onClick={() => setIntroOpen(true)}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[17px] font-semibold text-primary shadow-2xl transition-transform hover:scale-[1.03]"
            >
              <Compass className="h-4 w-4" /> Enter the tour
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
