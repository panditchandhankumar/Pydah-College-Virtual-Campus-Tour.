import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { PANORAMAS, getPanorama } from "@/data/panoramas";
import { useHotspotStore, withOverrides } from "@/lib/hotspotStore";
import { VRPanoramaViewer } from "@/components/VRPanoramaViewer";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/vr")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "VR Campus Tour — PYDAH College" },
      {
        name: "description",
        content:
          "Immersive WebXR campus tour of PYDAH College. Open on Meta Quest 3 / 3S for full 360° head-tracked VR.",
      },
    ],
  }),
  component: VRPage,
});

function VRPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/vr" });
  const activeId = id && getPanorama(id) ? id : PANORAMAS[0].id;
  const active = getPanorama(activeId)!;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const go = (target: string) =>
    navigate({ search: { id: target }, replace: true });

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <VRPanoramaViewer panorama={active} onChange={go} />

      {/* Location drawer (desktop overlay; VR users navigate via hotspots). */}
      <div
        className={`pointer-events-auto absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-black/0 transition-transform ${
          drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-72px)]"
        }`}
      >
        <button
          onClick={() => setDrawerOpen((v) => !v)}
          className="mx-auto mb-2 mt-3 block rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20"
        >
          {drawerOpen ? "Hide locations" : "Show locations"}
        </button>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-5">
          {PANORAMAS.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              className={`group overflow-hidden rounded-xl ring-1 transition ${
                p.id === activeId
                  ? "ring-2 ring-accent"
                  : "ring-white/20 hover:ring-white/60"
              }`}
            >
              <img
                src={p.thumbnail}
                alt={p.title}
                className="h-20 w-full object-cover"
              />
              <div className="bg-black/70 p-2 text-left">
                <p className="truncate text-xs font-semibold text-white">
                  {p.title}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-white/60">
                  {p.category}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
