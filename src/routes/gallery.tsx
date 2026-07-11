import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { PANORAMAS, type Category } from "@/data/panoramas";

const categories: (Category | "all")[] = ["all", "entrance", "road", "junction", "academic", "facility", "recreation", "parking"];

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — PYDAH College" },
      { name: "description", content: "Photo gallery of PYDAH campus buildings, labs, hostels and events." },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [preview, setPreview] = useState<string | null>(null);

  const items = filter === "all" ? PANORAMAS : PANORAMAS.filter((p) => p.category === filter);

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Gallery</p>
        <h1 className="mt-3 font-display text-5xl font-bold text-primary">Campus in pictures</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A curated look at buildings, labs and life at PYDAH. Click any image for a fullscreen preview,
          or jump straight into the tour.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
            >
              <button
                onClick={() => setPreview(p.panorama)}
                className="block w-full"
                aria-label={`Preview ${p.title}`}
              >
                <img
                  src={p.panorama}
                  alt={p.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </button>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">{p.title}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
                </div>
                <Link
                  to="/tour"
                  search={{ id: p.id }}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Tour
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4 backdrop-blur"
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={preview} alt="Preview" className="max-h-[90vh] max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
