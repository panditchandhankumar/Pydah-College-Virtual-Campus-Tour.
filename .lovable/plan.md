## Goal

Refactor the PYDAH Virtual Campus Tour into a production-grade, config-driven WebXR application where adding/removing buildings, hotspots, departments, or narration requires editing **only JSON files** — never code. Add a dev-only Admin Configuration Mode for visual hotspot placement.

## Architecture

### New folder structure

```text
src/
├── components/
│   ├── ui/            # Buttons, Modals, Tooltips, Spinner, Toast
│   ├── vr/            # VRScene, VRControllers, VRHotspot3D, VRTeleport
│   ├── hotspots/      # Hotspot2D, HotspotArrow, HotspotLabel
│   ├── map/           # CampusMap (SVG driven by campus.json)
│   ├── navigation/    # TourHUD, NavBar, Breadcrumbs
│   ├── voice/         # VoiceGuide, VoicePlayer
│   └── admin/         # AdminPanel, HotspotEditor, PanoramaUploader
├── hooks/             # useConfig, usePanorama, useVoice, useWebXR, useAdmin
├── pages/             # Route-level components (thin wrappers over routes/)
├── panoramas/         # PanoramaViewer, PanoramaLoader, TextureCache
├── services/          # configService, storageService, voiceService, xrService
├── config/            # Loader + Zod schemas for every JSON file
├── data/
│   └── json/          # campus.json, locations.json, hotspots.json,
│                      # buildings.json, departments.json, voice.json,
│                      # routes.json, settings.json, ui.json, vr.json
├── assets/{images,360,icons,audio}/
├── types/             # All shared TS interfaces
├── utils/             # math, geo, dom, download helpers
├── constants/         # Enums, non-configurable defaults only
└── routes/            # TanStack Start route files (unchanged location)
```

### Config-driven data layer

- Each JSON in `src/data/json/` has a matching Zod schema in `src/config/schemas/`.
- `configService` loads + validates all JSON at startup and exposes typed getters (`getPanoramas()`, `getHotspots(panoId)`, `getBuilding(id)`).
- A single `ConfigProvider` (Context API) hydrates the whole app. Every component reads via `useConfig()` — no imports of raw JSON in components.
- Adding a location = append to `locations.json` + drop image in `assets/360/`. Map, search, HUD, VR viewer all pick it up automatically.

### Panorama & hotspot system

- `PanoramaViewer` (2D) and `VRScene` (WebXR) both consume the same normalized `Panorama` + `Hotspot[]` types.
- Hotspot JSON: `{ id, title, position:{yaw,pitch}, icon, target, description, animation, visibility, arrow }`.
- Lazy-load panorama textures via dynamic `import()` + LRU texture cache; unload when >3 unused.

### Campus map

- `campus.json` defines roads (SVG path strings), buildings (rects/polygons + label + color), and pin coordinates.
- `CampusMap` renders purely from that JSON — no hardcoded SVG.

### Navigation HUD

- Single `TourHUD` reads `ui.json` for button list: Main Gate, Campus Map, Back, Next, Voice Guide, Information, Enter VR, Settings.
- Buttons are declarative entries → no duplicated code per panorama.

### WebXR (Quest 2/3/3S)

- New `xrService` wraps `renderer.xr` + official `VRButton` from `three/examples/jsm/webxr/VRButton.js`.
- Auto-detect via `navigator.xr.isSessionSupported('immersive-vr')`; hide button gracefully if unsupported.
- Features: 6DoF head tracking, dual Quest controllers, laser pointer (`XRControllerModelFactory`), teleport (parabolic ray → floor mesh), smooth locomotion (thumbstick), snap-turn (configurable degrees), comfort vignette. All values in `vr.json`.
- Target 72+ FPS: compressed KTX2/basis textures where possible, foveated rendering (`renderer.xr.setFoveation(1)`), single 4K equirect sphere per scene.

### Voice guide

- `voice.json` maps `panoramaId → { text, audioUrl?, lang, voice }`.
- `voiceService` prefers pre-recorded `audioUrl`; falls back to Web Speech API. Editable without touching code.

### Settings

- `settings.json` = defaults. User overrides persisted to `localStorage` via `useSettings` hook: language, theme, volume, VR walking speed, comfort mode, snap-turn angle, controller handedness.

### Admin Configuration Mode (dev-only)

- Route: `/admin` — gated by `import.meta.env.DEV` (invisible in production build).
- Features:
  1. **Add Panorama** — upload image → stored in IndexedDB (dev) → new entry appended to in-memory `locations.json`.
  2. **Visual hotspot placement** — click anywhere on the live panorama; a modal captures title/target/arrow; yaw/pitch derived from click coordinates via `PhotoSphereViewer.getPosition()`.
  3. **Edit/rename/move/delete** hotspots via a side panel; drag to reposition on the sphere.
  4. **Export JSON** button downloads the updated `locations.json` / `hotspots.json` so the developer commits them to the repo. (Runtime file writes aren't possible from the browser; download-then-commit is the standard pattern.)
- Zero auth required per user's spec ("no login required during development").

### Code quality & performance

- Strict TypeScript, shared interfaces in `types/`.
- All components documented with a JSDoc header: Purpose / Inputs / Outputs / Usage.
- Lazy routes via TanStack code-splitting; `React.lazy` for admin bundle so it never ships in production.
- Loading indicators on panorama transitions; texture cache eviction.

## Migration steps

1. Scaffold new folders + Zod schemas + `configService` + `ConfigProvider`.
2. Split existing `src/data/panoramas.ts` into `data/json/locations.json` + `hotspots.json` + `buildings.json`; delete the TS file.
3. Extract `MiniMap` SVG into `campus.json`; rewrite component to render from config.
4. Refactor `TourHUD` to read `ui.json`.
5. Rewrite `VRPanoramaViewer` on top of new `xrService` with controllers/teleport/snap-turn from `vr.json`.
6. Add `voice.json` + `voiceService`; wire into HUD.
7. Add `/admin` route + `HotspotEditor` + JSON export.
8. Add JSDoc headers + a top-level `README.md` in `src/` explaining "how to add a building in 30 seconds".

## What stays

- TanStack Start routing, Tailwind design tokens, Photo Sphere Viewer for 2D, Three.js for VR, existing branding/theme, uploaded assets.

## What gets deleted

- `src/data/panoramas.ts` (replaced by JSON).
- Inline SVG in `MiniMap.tsx` (replaced by config-driven renderer).
- Hardcoded HUD button list.

## Scope note

This is a substantial refactor touching ~20 files and adding ~15 new ones. I'll do it in one pass, keeping the app buildable at each stage. Existing 360° assets and branding are preserved. After you approve, I'll implement end-to-end and verify the build.
