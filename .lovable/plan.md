# Unify the Tour on a Single Three.js Pipeline

Replace Photo Sphere Viewer entirely. Desktop, Mobile, Fullscreen and Meta Quest VR will all run the exact same Three.js scene, hotspot manager, camera and raycaster. Add a togglable Debug HUD (dev builds only).

---

## What changes

### 1. New shared engine (`src/tour-engine/`)

One module, used by both `/tour` and `/vr`:

```text
src/tour-engine/
  PanoramaEngine.ts     Scene, camera, renderer, sphere, XR toggle, render loop
  CameraController.ts   Desktop: pointer-drag yaw/pitch + wheel zoom (fov)
                        Touch: 1-finger drag, pinch zoom
                        VR: no-op (headset drives the camera)
  HotspotManager.ts     One list of {yaw, pitch, ...} → Three.js Group of billboard
                        planes parented to the sphere. Handles show/hide,
                        style overrides, rebuild on store change.
  RaycastController.ts  Single Raycaster used for:
                          - mouse move / click (desktop, mobile tap)
                          - XR controller select events (Quest triggers)
                        Emits hover / select with the hotspot object.
  sphereMath.ts         yawPitchToVec3(yaw, pitch, r) — the ONE conversion
                          x = -r·cos(pitch)·sin(yaw)
                          y =  r·sin(pitch)
                          z = -r·cos(pitch)·cos(yaw)
  DebugOverlay.ts       Three.js helpers: AxesHelper, hotspot anchor dots,
                          controller ray lines, raycast hit marker.
  types.ts              Engine options, hotspot render data.
```

### 2. New React wrappers

- `src/components/TourViewer.tsx` — mounts `PanoramaEngine` in "desktop" mode.
  Replaces `PanoramaViewer.tsx` (Photo Sphere Viewer). Same props surface so
  `routes/tour.tsx` and `routes/admin.editor.tsx` keep working.
- `src/components/VRTourViewer.tsx` — mounts `PanoramaEngine` in "xr" mode,
  adds the official Three.js `VRButton`. Replaces `VRPanoramaViewer.tsx`.
- Admin editing (drag to move, click-to-add, right-click menu) is preserved
  by exposing engine events (`onHotspotDrag`, `onEmptyClick`) instead of the
  old Photo Sphere Viewer pointer handlers.

### 3. Debug HUD

- `src/components/DebugHUD.tsx` — floating panel, top-right.
- Toggle: `?debug=1` in the URL, or `D` key, or a dev-only button in `TourHUD`.
- Gated by `import.meta.env.DEV` — the component tree-shakes out of production.
- Shows per-hotspot: `id`, `targetId`, `yaw`, `pitch`, world `x,y,z`,
  `visible`, `distance` from camera, `hovered`, `selected`.
- When on, `DebugOverlay` also draws in-scene: axes, anchor dots, controller
  rays, raycast hit marker — visible in both Desktop and VR.

### 4. Removals

- Uninstall `@photo-sphere-viewer/core`, `markers-plugin`, `stereo-plugin`,
  `gyroscope-plugin`.
- Delete `src/components/PanoramaViewer.tsx` and
  `src/components/VRPanoramaViewer.tsx`.
- Remove Photo Sphere Viewer CSS imports.

### 5. Untouched

- `src/data/panoramas.ts`, `src/lib/hotspotStore.ts`, Supabase persistence,
  admin editor CMS layout, `MiniMap`, `TourHUD` (keeps its buttons), routes
  and URLs, VR config in `src/config/vr.json`.

---

## Guarantees

- One conversion function (`yawPitchToVec3`) — impossible for Desktop and VR
  to disagree on where a hotspot lives.
- Entering VR just calls `renderer.xr.enabled = true` + starts an
  `immersive-vr` session; the scene graph, sphere, hotspot group and
  raycaster are the same objects that were on screen a second earlier.
- No HTML/CSS pixel positioning anywhere in the hotspot pipeline.
- Admin drag-and-drop still edits the same `{yaw, pitch}` values persisted
  to Lovable Cloud.

---

## Verification

1. Load `/tour?id=main-circle`, note where the "Engineering Block" hotspot
   sits on the facade.
2. Click Enter VR (or open `/vr?id=main-circle` on Quest) — the hotspot
   must sit on the same pixel of the same building.
3. Toggle Debug HUD with `D` — the printed `yaw/pitch/world` values must be
   identical in both modes.
4. Move a hotspot in `/admin/editor`, refresh both `/tour` and `/vr` — the
   new position appears in both.
