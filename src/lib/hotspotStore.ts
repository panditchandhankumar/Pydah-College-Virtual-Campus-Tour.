import { create } from "zustand";
import { PANORAMAS, type Hotspot, type Panorama } from "@/data/panoramas";
import { supabase } from "@/integrations/supabase/client";
import { upsertHotspotOverride, deleteHotspotOverride } from "@/lib/hotspotAdmin.functions";

const ADMIN_TOKEN =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "pydah@admin";

const LS_KEY = "pydah-hotspot-overrides-v1";
const AUTOSAVE_KEY = "pydah-hotspot-autosave-v1";

type Overrides = Record<string, Hotspot[]>;

// ─── localStorage cache (fast paint / offline fallback) ──────────────
function loadLocal(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

function persistLocal(o: Overrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

const loadAutosave = () => {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(AUTOSAVE_KEY);
  return v === null ? true : v === "1";
};

// ─── Supabase sync ───────────────────────────────────────────────────
async function fetchOverridesFromDB(): Promise<Overrides> {
  const { data, error } = await supabase
    .from("hotspot_overrides")
    .select("scene_id, hotspots");
  if (error) {
    console.error("[hotspotStore] fetch failed:", error);
    throw error;
  }
  const out: Overrides = {};
  for (const row of data ?? []) {
    out[row.scene_id] = (row.hotspots as unknown as Hotspot[]) ?? [];
  }
  return out;
}

async function upsertSceneToDB(sceneId: string, hotspots: Hotspot[]) {
  await upsertHotspotOverride({
    data: {
      sceneId,
      hotspots: hotspots as unknown as Array<{ yaw: number; pitch: number }>,
      adminToken: ADMIN_TOKEN,
    },
  });
}

async function deleteSceneFromDB(sceneId: string) {
  await deleteHotspotOverride({
    data: { sceneId, adminToken: ADMIN_TOKEN },
  });
}

// ─── Store ────────────────────────────────────────────────────────────
interface State {
  overrides: Overrides;
  /** panorama ids with unsaved local changes (only used when autosave = off). */
  pendingIds: Set<string>;
  dirty: boolean;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  syncError: string | null;
  editMode: boolean;
  autosave: boolean;
  setEditMode: (v: boolean) => void;
  setAutosave: (v: boolean) => void;
  getHotspots: (panoId: string) => Hotspot[];
  setHotspots: (panoId: string, hs: Hotspot[]) => void;
  save: () => Promise<{ ok: boolean; error?: string }>;
  resetPanorama: (panoId: string) => Promise<void>;
  refresh: () => Promise<void>;
  importJSON: (json: string) => Promise<boolean>;
  exportJSON: () => string;
}

export const useHotspotStore = create<State>((set, get) => ({
  overrides: loadLocal(),
  pendingIds: new Set(),
  dirty: false,
  loaded: false,
  loading: false,
  saving: false,
  syncError: null,
  editMode: false,
  autosave: loadAutosave(),

  setEditMode: (v) => set({ editMode: v }),

  setAutosave: (v) => {
    if (typeof window !== "undefined") window.localStorage.setItem(AUTOSAVE_KEY, v ? "1" : "0");
    set({ autosave: v });
    // Flush pending changes when turning autosave back on.
    if (v && get().pendingIds.size > 0) void get().save();
  },

  getHotspots: (panoId) => {
    const o = get().overrides[panoId];
    if (o) return o;
    return PANORAMAS.find((p) => p.id === panoId)?.hotspots ?? [];
  },

  setHotspots: (panoId, hs) => {
    const overrides = { ...get().overrides, [panoId]: hs };
    persistLocal(overrides);
    if (get().autosave) {
      // Fire-and-forget DB write.
      set({ overrides, syncError: null });
      void upsertSceneToDB(panoId, hs).catch((e) => {
        console.error("[hotspotStore] autosave failed:", e);
        const pending = new Set(get().pendingIds);
        pending.add(panoId);
        set({ pendingIds: pending, dirty: true, syncError: String(e?.message ?? e) });
      });
    } else {
      const pending = new Set(get().pendingIds);
      pending.add(panoId);
      set({ overrides, pendingIds: pending, dirty: true });
    }
  },

  save: async () => {
    const { pendingIds, overrides, autosave } = get();
    // If autosave is on and nothing is pending, still push the currently loaded
    // overrides for every scene the user might have edited to be safe.
    const ids = pendingIds.size > 0 ? Array.from(pendingIds) : autosave ? [] : Object.keys(overrides);
    if (ids.length === 0) {
      set({ dirty: false, syncError: null });
      return { ok: true };
    }
    set({ saving: true });
    try {
      await Promise.all(ids.map((id) => upsertSceneToDB(id, overrides[id] ?? [])));
      set({ pendingIds: new Set(), dirty: false, saving: false, syncError: null });
      return { ok: true };
    } catch (e: any) {
      console.error("[hotspotStore] save failed:", e);
      set({ saving: false, syncError: String(e?.message ?? e) });
      return { ok: false, error: String(e?.message ?? e) };
    }
  },

  resetPanorama: async (panoId) => {
    const next = { ...get().overrides };
    delete next[panoId];
    persistLocal(next);
    const pending = new Set(get().pendingIds);
    pending.delete(panoId);
    set({ overrides: next, pendingIds: pending });
    try {
      await deleteSceneFromDB(panoId);
    } catch (e: any) {
      console.error("[hotspotStore] reset failed:", e);
      set({ syncError: String(e?.message ?? e) });
    }
  },

  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const remote = await fetchOverridesFromDB();
      const local = get().overrides;
      // First-run migration: if DB is empty but this browser has local
      // customizations, push them up so nothing is lost. Otherwise DB wins.
      if (Object.keys(remote).length === 0 && Object.keys(local).length > 0) {
        await Promise.all(
          Object.entries(local).map(([id, hs]) => upsertSceneToDB(id, hs).catch((e) => console.error(e))),
        );
        set({ loaded: true, loading: false, syncError: null, pendingIds: new Set(), dirty: false });
        return;
      }
      persistLocal(remote);
      set({ overrides: remote, loaded: true, loading: false, syncError: null, pendingIds: new Set(), dirty: false });
    } catch (e: any) {
      set({ loading: false, syncError: String(e?.message ?? e) });
    }
  },

  importJSON: async (json) => {
    try {
      const parsed = JSON.parse(json) as Overrides;
      if (typeof parsed !== "object" || !parsed) return false;
      persistLocal(parsed);
      set({ overrides: parsed });
      // Push every scene to DB.
      await Promise.all(
        Object.entries(parsed).map(([id, hs]) => upsertSceneToDB(id, hs).catch((e) => console.error(e))),
      );
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

// ─── Auto-hydrate on client mount ────────────────────────────────────
if (typeof window !== "undefined") {
  // Kick off the first fetch once. Any component subscribed to `overrides`
  // will re-render as soon as the DB responds.
  queueMicrotask(() => {
    void useHotspotStore.getState().refresh();
  });
}
