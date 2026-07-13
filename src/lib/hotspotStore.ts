import { create } from "zustand";
import { PANORAMAS, type Hotspot, type Panorama } from "@/data/panoramas";

const LS_KEY = "pydah-hotspot-overrides-v1";

type Overrides = Record<string, Hotspot[]>;

function load(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function persist(o: Overrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

interface State {
  overrides: Overrides;
  dirty: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  getHotspots: (panoId: string) => Hotspot[];
  setHotspots: (panoId: string, hs: Hotspot[]) => void;
  save: () => void;
  resetPanorama: (panoId: string) => void;
  importJSON: (json: string) => boolean;
  exportJSON: () => string;
}

export const useHotspotStore = create<State>((set, get) => ({
  overrides: load(),
  dirty: false,
  editMode: false,
  setEditMode: (v) => set({ editMode: v }),
  getHotspots: (panoId) => {
    const o = get().overrides[panoId];
    if (o) return o;
    return PANORAMAS.find((p) => p.id === panoId)?.hotspots ?? [];
  },
  setHotspots: (panoId, hs) =>
    set((s) => ({
      overrides: { ...s.overrides, [panoId]: hs },
      dirty: true,
    })),
  save: () => {
    const { overrides } = get();
    persist(overrides);
    set({ dirty: false });
  },
  resetPanorama: (panoId) =>
    set((s) => {
      const next = { ...s.overrides };
      delete next[panoId];
      persist(next);
      return { overrides: next, dirty: false };
    }),
  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Overrides;
      if (typeof parsed !== "object" || !parsed) return false;
      persist(parsed);
      set({ overrides: parsed, dirty: false });
      return true;
    } catch {
      return false;
    }
  },
  exportJSON: () => JSON.stringify(get().overrides, null, 2),
}));

/** Returns a panorama with hotspot overrides merged in. */
export function withOverrides(p: Panorama, overrides: Overrides): Panorama {
  const o = overrides[p.id];
  return o ? { ...p, hotspots: o } : p;
}
