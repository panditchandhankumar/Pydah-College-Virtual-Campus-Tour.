/**
 * /admin — dashboard landing after login.
 * Cards route to the different admin tools and utilities.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Compass,
  Image as ImageIcon,
  LogOut,
  Map,
  MousePointerClick,
  Rocket,
  Upload,
} from "lucide-react";
import { logout } from "@/lib/adminAuth";
import { PANORAMAS } from "@/data/panoramas";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — PYDAH Virtual Tour" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type Card = {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  search?: Record<string, string>;
  accent?: string;
};

function Dashboard() {
  const navigate = useNavigate();

  const cards: Card[] = [
    {
      title: "Manage Panoramas",
      desc: "Browse all 360° locations and jump into the visual editor.",
      icon: Camera,
      to: "/admin/editor",
      accent: "from-sky-500/40 to-blue-600/20",
    },
    {
      title: "Manage Hotspots",
      desc: "Add, rename, resize, move or delete hotspots directly on the sphere.",
      icon: MousePointerClick,
      to: "/admin/editor",
      accent: "from-cyan-500/40 to-emerald-500/20",
    },
    {
      title: "Campus Map",
      desc: "Preview the interactive campus map and location markers.",
      icon: Map,
      to: "/tour",
      accent: "from-amber-500/40 to-orange-500/20",
    },
    {
      title: "Upload Images",
      desc: "Add new 360° panorama photos to the tour catalogue.",
      icon: Upload,
      to: "/admin/editor",
      accent: "from-fuchsia-500/40 to-pink-500/20",
    },
    {
      title: "Preview Tour",
      desc: "Open the live virtual tour exactly as visitors experience it.",
      icon: Compass,
      to: "/tour",
      accent: "from-indigo-500/40 to-violet-500/20",
    },
    {
      title: "Publish Changes",
      desc: "Export the updated locations JSON to ship the latest tour data.",
      icon: Rocket,
      to: "/admin/editor",
      accent: "from-emerald-500/40 to-teal-500/20",
    },
  ];

  const totalHotspots = PANORAMAS.reduce((n, p) => n + p.hotspots.length, 0);

  function onLogout() {
    logout();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-br from-slate-950 via-primary/40 to-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Admin
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
              Control Panel
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Manage panoramas, hotspots and the campus map from a single place.
            </p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Panoramas" value={PANORAMAS.length} icon={Camera} />
          <Stat label="Hotspots" value={totalHotspots} icon={MousePointerClick} />
          <Stat label="Map Locations" value={PANORAMAS.length} icon={Map} />
          <Stat label="Media Assets" value={PANORAMAS.length} icon={ImageIcon} />
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br ${c.accent ?? ""} p-5 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/20`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-white/70">{c.desc}</p>
              <span className="mt-4 inline-block text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-white/60">{label}</p>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
