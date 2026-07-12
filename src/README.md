# PYDAH Virtual Campus Tour — Developer Guide

Config-driven, JSON-first architecture. Adding, removing or renaming buildings, hotspots, roads, narration or HUD buttons should **never** require touching component code.

## Folder map

```text
src/
├── components/           # UI, MiniMap, TourHUD, PanoramaViewer, VRPanoramaViewer, admin/
├── config/               # ✨ All JSON configs + configService
│   ├── campus.json       # Map roads, buildings, labels, green zones
│   ├── ui.json           # Tour HUD button list & order
│   ├── vr.json           # WebXR: locomotion, snap-turn, teleport, comfort
│   ├── voice.json        # Per-panorama narration scripts
│   ├── settings.json     # User setting defaults
│   └── index.ts          # `configService` — the one import for components
├── data/
│   ├── panoramas.ts      # 📍 Panorama nodes + hotspots (config-shaped TS)
│   └── departments.ts    # Academic departments
├── routes/
│   ├── tour.tsx          # 2D Street-View-style tour
│   ├── vr.tsx            # WebXR immersive tour
│   └── admin.tsx         # 🛠 Dev-only visual hotspot editor
└── styles.css            # Design tokens (Tailwind v4)
```

## Add a new location (30 seconds)

1. Upload the 360° image via the `lovable-assets` CLI (see `<assets>` docs).
2. Append one object to `PANORAMAS` in `src/data/panoramas.ts`:

   ```ts
   {
     id: "sports-complex",
     title: "Sports Complex",
     description: "Multi-sport indoor arena.",
     category: "recreation",
     panorama: mySportsAsset.url,
     thumbnail: mySportsAsset.url,
     map: { x: 20, y: 82 },
     facilities: ["Badminton", "Basketball"],
     hotspots: [
       { targetId: "main-circle", yaw: 180, pitch: -3, arrow: "down" },
     ],
   }
   ```

3. Done — the location appears automatically in:
   - Tour dropdown & search
   - Campus map pin
   - VR location drawer
   - Admin editor
   - Sitemap

## Remove a location

Delete the object from `PANORAMAS`. Nothing else to change.

## Edit hotspots visually

Open `/admin` in dev mode:

- Click anywhere on the live panorama to drop a hotspot.
- Pick target and arrow direction in the modal.
- Rename / move / delete existing hotspots in the right panel.
- Click **Export locations.json** to download the updated data — paste the resulting `hotspots` arrays into `src/data/panoramas.ts` and commit.

`/admin` is guarded by `import.meta.env.DEV` — invisible in production builds.

## Edit the campus map

`src/config/campus.json` owns every road, building and label. Change coordinates or add a new footprint; `MiniMap.tsx` re-renders automatically.

## Edit narration

`src/config/voice.json` → `scripts[panoramaId]`. Falls back to the panorama description if a script is missing.

## Edit HUD buttons

`src/config/ui.json` → `hud` array. Reorder or remove entries. Supported `action` values: `home`, `toggleMap`, `back`, `next`, `toggleVoice`, `toggleInfo`, `toggleFullscreen`, `enterVR`, `toggleHelp`, `toggleSettings`.

## Tune VR

`src/config/vr.json` — snap-turn degrees, smooth locomotion speed, teleport, comfort vignette, sphere & camera parameters, foveation level. No Three.js code needs to change.

## WebXR support

Uses official Three.js `renderer.xr` + `VRButton`. Detects `navigator.xr.isSessionSupported('immersive-vr')`; the Enter VR button is only offered when supported. Meta Quest 2 / 3 / 3S all work through Quest Browser.

Controllers:
- **Right thumbstick**: snap-turn (configurable degrees).
- **Left thumbstick**: smooth locomotion in the direction you're facing.
- **Trigger**: select hotspot via laser ray.

## Scripts

```bash
bun install
bun run dev       # local dev
bun run build     # production build
```
