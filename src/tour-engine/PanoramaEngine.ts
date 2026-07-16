import * as THREE from "three";
import type { Hotspot, HotspotIcon, Panorama } from "@/data/panoramas";
import { getPanorama } from "@/data/panoramas";
import { vec3ToYawPitch, yawPitchToVec3 } from "./sphereMath";

// ─── Constants ──────────────────────────────────────────────────────────
const SPHERE_RADIUS = 500;
const HOTSPOT_RADIUS = 6;
const DEFAULT_DISC = 1.4;
const DEFAULT_LABEL_H = 0.6;
const FADE_SPEED = 1.6;

const ICON_GLYPH: Record<string, string> = {
  arrow: "", building: "🏫", gate: "🏠", cse: "💻", ece: "📡",
  cafeteria: "🍽", seminar: "🎤", library: "📚", parking: "🚲",
  ground: "⚽", garden: "🌳", info: "ℹ", nav: "➡",
};

// ─── Public types ───────────────────────────────────────────────────────
export interface DebugHotspotInfo {
  index: number;
  id: string;
  targetId: string;
  yaw: number;
  pitch: number;
  world: { x: number; y: number; z: number };
  visible: boolean;
  distance: number;
  hovered: boolean;
  selected: boolean;
}

export interface DebugState {
  fps: number;
  presenting: boolean;
  panoramaId: string | null;
  cameraYaw: number;
  cameraPitch: number;
  hotspots: DebugHotspotInfo[];
}

export type QualityPreset = "crisp" | "balanced" | "performance" | "auto";

export interface DiagnosticsState {
  presenting: boolean;
  preset: QualityPreset;
  effectivePreset: Exclude<QualityPreset, "auto">;
  framebufferScale: number;
  foveation: number;
  anisotropy: number;
  maxAnisotropy: number;
  mipmaps: boolean;
  minFilter: string;
  textureWidth: number;
  textureHeight: number;
  loading: boolean;
  loadingLabel: string;
  fps: number;
  avgFps: number;
  autoDowngraded: boolean;
}

export interface EngineCallbacks {
  onNavigate?: (targetId: string) => void;
  onSelect?: (index: number | null) => void;
  onHotspotDrag?: (index: number, yaw: number, pitch: number) => void;
  onEmptyClick?: (yaw: number, pitch: number) => void;
  onHotspotContextMenu?: (index: number, screenX: number, screenY: number) => void;
  onLoadStart?: (title: string) => void;
  onLoadEnd?: () => void;
  onLoadError?: () => void;
  onDebug?: (state: DebugState) => void;
  onDiagnostics?: (state: DiagnosticsState) => void;
}

interface QualityRow {
  framebufferScale: number;
  foveation: number;
  mipmaps: boolean;
  minFilter: "mipmap-linear" | "mipmap-nearest";
  anisoFactor: number; // multiplied by GPU max
}

const QUALITY_TABLE: Record<Exclude<QualityPreset, "auto">, QualityRow> = {
  crisp:       { framebufferScale: 1.7, foveation: 0.0, mipmaps: true, minFilter: "mipmap-linear",  anisoFactor: 1.0  },
  balanced:    { framebufferScale: 1.3, foveation: 0.3, mipmaps: true, minFilter: "mipmap-linear",  anisoFactor: 0.5  },
  performance: { framebufferScale: 1.0, foveation: 0.6, mipmaps: true, minFilter: "mipmap-nearest", anisoFactor: 0.25 },
};

export interface EngineOptions {
  /** Enable WebGL renderer.xr — required for VR wrapper. */
  xr?: boolean;
}

/**
 * PanoramaEngine — the ONE Three.js renderer used by Desktop, Mobile,
 * Fullscreen AND WebXR / Meta Quest. There is no separate VR pipeline.
 *
 * The only Desktop/VR difference is which camera drives the view:
 * desktop pointer/touch drag vs. renderer.xr headset pose.
 */
export class PanoramaEngine {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly rig = new THREE.Group();
  readonly hotspotGroup = new THREE.Group();
  readonly sphere: THREE.Mesh;
  readonly sphereMat: THREE.MeshBasicMaterial;
  readonly raycaster = new THREE.Raycaster();

  // Camera control state (desktop only — VR ignores).
  private yaw = 0;
  private pitch = 0;
  private fov: number;
  private dragging = false;
  private draggingHotspot: number | null = null;
  private pointerDownAt = { x: 0, y: 0, t: 0 };
  private lastPtr = { x: 0, y: 0 };
  private pinchDist = 0;

  private hotspots: Hotspot[] = [];
  private editMode = false;
  private selectedIndex: number | null = null;
  private hoveredIndex: number | null = null;
  private currentPanoramaId: string | null = null;
  private pendingId: string | null = null;
  private fadeDir: -1 | 0 | 1 = 0;
  private fadeMat: THREE.MeshBasicMaterial;
  private cb: EngineCallbacks = {};
  private mount: HTMLElement;
  private xr: boolean;
  private disposed = false;

  // Debug
  private debugEnabled = false;
  private debugGroup = new THREE.Group();
  private axesHelper: THREE.AxesHelper | null = null;
  private hitMarker: THREE.Mesh | null = null;
  private controllerRays: THREE.Line[] = [];
  private controllers: THREE.XRTargetRaySpace[] = [];
  private lastFrameT = 0;
  private lastDebugEmit = 0;

  private loader = new THREE.TextureLoader();
  private readonly xrYawSpeed = THREE.MathUtils.degToRad(90);
  private disposables: (() => void)[] = [];

  constructor(mount: HTMLElement, opts: EngineOptions = {}) {
    this.mount = mount;
    this.xr = !!opts.xr;
    this.loader.setCrossOrigin("anonymous");
    this.fov = 75;

    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1100,
    );
    this.rig.add(this.camera);
    this.scene.add(this.rig);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      xrCompatible: true,
    } as THREE.WebGLRendererParameters);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // NoToneMapping for equirect panoramas — ACES darkens them heavily in
    // WebXR (Quest 3 / 3S) framebuffers and can render as a black view.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    if (this.xr) {
      this.renderer.xr.enabled = true;
      // Prefer local-floor; if the runtime rejects it (some Quest browser
      // builds), fall back to "local" so the session still renders.
      try { this.renderer.xr.setReferenceSpaceType("local-floor"); }
      catch { try { this.renderer.xr.setReferenceSpaceType("local"); } catch { /* ignore */ } }
      // Foveation 0 = full resolution edge-to-edge (sharpest panorama).
      // A value of 1 heavily blurs the periphery which looks like a low-res image.
      try { this.renderer.xr.setFoveation?.(0); } catch { /* ignore */ }
      // Render at higher-than-native resolution in the headset for crisp text
      // and panorama detail. Quest 3/3S handle 1.5x comfortably on a single sphere.
      try { this.renderer.xr.setFramebufferScaleFactor?.(1.5); } catch { /* ignore */ }
      // Force the underlying GL context to be XR-compatible up front. Without
      // this, some Quest browser builds accept the session request but fail
      // to bind the framebuffer, producing a completely black view.
      try {
        const gl = this.renderer.getContext() as WebGL2RenderingContext & {
          makeXRCompatible?: () => Promise<void>;
        };
        gl.makeXRCompatible?.();
      } catch { /* ignore */ }
      // Reset all view state at the moment the headset session starts so we
      // never enter with a stale desktop rotation / rig offset / opaque fade
      // overlay (any of which would show as a "black screen" in VR).
      this.renderer.xr.addEventListener("sessionstart", () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        this.rig.position.set(0, 0, 0);
        this.rig.rotation.set(0, 0, 0);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        this.fadeMat.opacity = 0;
        this.fadeDir = 0;
        this.pendingId = null;
        // Always show a lit sphere on session start — even if the panorama
        // texture hasn't finished decoding, the user sees the navy fallback
        // instead of a fully black headset view.
        this.sphereMat.color.set(this.sphereMat.map ? 0xffffff : 0x1a2540);
        this.sphereMat.needsUpdate = true;
      });
    }
    mount.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.cursor = "grab";

    // Panorama sphere (inverted). Neutral navy placeholder so if the
    // headset session opens before the texture arrives, the user sees a
    // color instead of pure black.
    const geom = new THREE.SphereGeometry(SPHERE_RADIUS, 128, 96);
    geom.scale(-1, 1, 1);
    this.sphereMat = new THREE.MeshBasicMaterial({ color: 0x1a2540 });
    this.sphere = new THREE.Mesh(geom, this.sphereMat);
    this.scene.add(this.sphere);

    // Hotspots are children of the sphere so ANY sphere/rig transforms
    // move them together — desktop and VR see identical positions.
    this.sphere.add(this.hotspotGroup);

    // Debug scene root.
    this.scene.add(this.debugGroup);
    this.debugGroup.visible = false;

    // Fade overlay attached to camera (in front, screen-space).
    // IMPORTANT: only mount it in 2D/desktop mode. In WebXR a 2m plane
    // sitting 0.5m in front of the base camera fills the entire headset FOV
    // and any non-zero opacity (mid-transition) blacks out the view.
    const fadeGeom = new THREE.PlaneGeometry(2, 2);
    this.fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0,
      depthTest: false, depthWrite: false,
    });
    if (!this.xr) {
      const fade = new THREE.Mesh(fadeGeom, this.fadeMat);
      fade.position.z = -0.5;
      fade.renderOrder = 999;
      this.camera.add(fade);
    }

    // XR controllers (harmless when session never starts).
    if (this.xr) this.setupControllers();

    this.installInput();
    this.startLoop();

    const onResize = () => {
      this.camera.aspect = mount.clientWidth / mount.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);
    this.disposables.push(() => window.removeEventListener("resize", onResize));

    if (this.xr) {
      const preventJoystickUiFocus = (event: KeyboardEvent) => {
        if (!this.renderer.xr.isPresenting) return;
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Spacebar"].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      document.addEventListener("keydown", preventJoystickUiFocus, true);
      this.disposables.push(() =>
        document.removeEventListener("keydown", preventJoystickUiFocus, true),
      );
    }
  }

  setCallbacks(cb: EngineCallbacks) { this.cb = cb; }

  // ─── Panorama loading ────────────────────────────────────────────────
  setPanorama(id: string, fade = true) {
    if (!fade || this.currentPanoramaId === null) {
      this.applyPanorama(id);
      return;
    }
    if (id === this.currentPanoramaId) return;
    this.pendingId = id;
    this.fadeDir = 1;
  }

  private applyPanorama(id: string) {
    const p = getPanorama(id);
    if (!p) return;
    this.cb.onLoadStart?.(p.title);
    this.loader.load(
      p.panorama,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        const old = this.sphereMat.map;
        this.sphereMat.map = tex;
        this.sphereMat.color.set(0xffffff);
        this.sphereMat.needsUpdate = true;
        old?.dispose();
        this.currentPanoramaId = id;
        this.rebuildHotspots();
        this.cb.onLoadEnd?.();
      },
      undefined,
      () => this.cb.onLoadError?.(),
    );
  }

  // ─── Hotspots ────────────────────────────────────────────────────────
  setHotspots(list: Hotspot[], opts?: { editMode?: boolean; selectedIndex?: number | null }) {
    this.hotspots = list;
    if (opts) {
      if (opts.editMode !== undefined) this.editMode = opts.editMode;
      if (opts.selectedIndex !== undefined) this.selectedIndex = opts.selectedIndex;
    }
    this.rebuildHotspots();
  }

  setEditMode(v: boolean) { this.editMode = v; this.rebuildHotspots(); }
  setSelectedIndex(i: number | null) { this.selectedIndex = i; this.rebuildHotspots(); }

  private rebuildHotspots() {
    // Dispose previous.
    while (this.hotspotGroup.children.length) {
      const c = this.hotspotGroup.children.pop() as THREE.Mesh;
      c.geometry?.dispose?.();
      const m = c.material as any;
      m?.map?.dispose?.();
      m?.dispose?.();
    }

    for (let i = 0; i < this.hotspots.length; i++) {
      const h = this.hotspots[i];
      if (!this.editMode && h.visible === false) continue;
      const target = getPanorama(h.targetId);
      const name = h.label ?? target?.title ?? "Location";
      const bg = h.background ?? "#1e5fbf";
      const fg = h.textColor ?? "#ffffff";
      const border = h.borderColor ?? "#ffffff";
      const borderW = h.borderWidth ?? 12;
      const opacity = h.opacity ?? 1;
      const sizeScale = (h.size ?? 54) / 54;
      const display = h.display ?? "iconText";
      const iconKey = (h.icon ?? "arrow") as HotspotIcon;
      const isSelected = i === this.selectedIndex;

      const pos = yawPitchToVec3(h.yaw, h.pitch, HOTSPOT_RADIUS);

      if (display !== "text") {
        const discCanvas = document.createElement("canvas");
        discCanvas.width = 256; discCanvas.height = 256;
        const dctx = discCanvas.getContext("2d")!;
        dctx.beginPath();
        dctx.arc(128, 128, 110, 0, Math.PI * 2);
        dctx.fillStyle = bg; dctx.fill();
        dctx.lineWidth = borderW;
        dctx.strokeStyle = isSelected ? "#f97316" : border;
        dctx.stroke();
        if (iconKey === "arrow") {
          drawArrow(dctx, h.arrow, fg);
        } else {
          dctx.fillStyle = fg;
          dctx.font = "bold 130px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
          dctx.textAlign = "center"; dctx.textBaseline = "middle";
          dctx.fillText(ICON_GLYPH[iconKey] ?? "•", 128, 138);
        }
        const tex = new THREE.CanvasTexture(discCanvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({
          map: tex, transparent: true, opacity,
          depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        });
        const size = DEFAULT_DISC * sizeScale;
        const disc = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
        disc.position.copy(pos);
        disc.lookAt(0, 0, 0);
        disc.userData = { hotspotIndex: i, targetId: h.targetId, kind: "disc" };
        disc.renderOrder = 10;
        this.hotspotGroup.add(disc);
      }

      if (display !== "icon") {
        const labelCanvas = document.createElement("canvas");
        labelCanvas.width = 512; labelCanvas.height = 128;
        const lctx = labelCanvas.getContext("2d")!;
        lctx.font = "bold 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        const textW = lctx.measureText(name).width;
        const padX = 28;
        const boxW = Math.min(labelCanvas.width, textW + padX * 2);
        const boxH = 96;
        const bx = (labelCanvas.width - boxW) / 2;
        const by = (labelCanvas.height - boxH) / 2;
        const r = 14;
        lctx.fillStyle = "#ffffff";
        lctx.beginPath();
        lctx.moveTo(bx + r, by);
        lctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
        lctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
        lctx.arcTo(bx, by + boxH, bx, by, r);
        lctx.arcTo(bx, by, bx + boxW, by, r);
        lctx.closePath(); lctx.fill();
        lctx.strokeStyle = isSelected ? "#f97316" : "rgba(0,33,71,0.2)";
        lctx.lineWidth = isSelected ? 4 : 2;
        lctx.stroke();
        lctx.fillStyle = "#002147";
        lctx.textAlign = "center"; lctx.textBaseline = "middle";
        lctx.fillText(name, labelCanvas.width / 2, labelCanvas.height / 2);
        const tex = new THREE.CanvasTexture(labelCanvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({
          map: tex, transparent: true, opacity,
          depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        });
        const aspect = labelCanvas.width / labelCanvas.height;
        const h2 = DEFAULT_LABEL_H * sizeScale;
        const label = new THREE.Mesh(new THREE.PlaneGeometry(h2 * aspect, h2), mat);
        const up = new THREE.Vector3(0, 1.15 * sizeScale, 0);
        label.position.copy(pos).add(up);
        label.lookAt(0, 0, 0);
        label.userData = { hotspotIndex: i, targetId: h.targetId, kind: "label" };
        label.renderOrder = 11;
        this.hotspotGroup.add(label);
      }
    }

    if (this.debugEnabled) this.updateDebugAnchors();
  }

  // ─── XR controllers ──────────────────────────────────────────────────
  private setupControllers() {
    const rayGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -6),
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x28c7fa });
    for (let i = 0; i < 2; i++) {
      const c = this.renderer.xr.getController(i);
      const line = new THREE.Line(rayGeom, rayMat);
      line.scale.z = 6;
      c.add(line);
      this.rig.add(c);
      this.controllers.push(c);
      this.controllerRays.push(line);
      c.addEventListener("selectstart", () => this.selectFromController(c));
    }
  }

  private selectFromController(controller: THREE.XRTargetRaySpace) {
    const m = new THREE.Matrix4().extractRotation(controller.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
    const hits = this.raycaster.intersectObjects(this.hotspotGroup.children, false);
    const idx = hits[0]?.object?.userData?.hotspotIndex as number | undefined;
    if (typeof idx === "number") {
      const target = this.hotspots[idx]?.targetId;
      if (target) this.cb.onNavigate?.(target);
    }
  }

  // ─── Input (desktop / touch) ─────────────────────────────────────────
  private installInput() {
    const el = this.renderer.domElement;

    const getNDC = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return new THREE.Vector2(
        ((x - r.left) / r.width) * 2 - 1,
        -((y - r.top) / r.height) * 2 + 1,
      );
    };

    const raycastAt = (x: number, y: number, targets: THREE.Object3D[]) => {
      const ndc = getNDC(x, y);
      this.raycaster.setFromCamera(ndc, this.camera);
      return this.raycaster.intersectObjects(targets, false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (this.renderer.xr.isPresenting) return;
      el.setPointerCapture?.(e.pointerId);
      this.pointerDownAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.lastPtr = { x: e.clientX, y: e.clientY };

      // Hotspot pick — desktop equivalent of controller ray.
      const hits = raycastAt(e.clientX, e.clientY, this.hotspotGroup.children);
      const idx = hits[0]?.object?.userData?.hotspotIndex as number | undefined;
      if (this.editMode && typeof idx === "number") {
        this.draggingHotspot = idx;
        this.cb.onSelect?.(idx);
        el.style.cursor = "grabbing";
        return;
      }
      this.dragging = true;
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (this.renderer.xr.isPresenting) return;
      // Debug: hover reporting.
      if (this.debugEnabled) {
        const hits = raycastAt(e.clientX, e.clientY, this.hotspotGroup.children);
        const idx = hits[0]?.object?.userData?.hotspotIndex ?? null;
        if (idx !== this.hoveredIndex) this.hoveredIndex = idx as number | null;
        if (this.hitMarker) {
          if (hits[0]) {
            this.hitMarker.visible = true;
            this.hitMarker.position.copy(hits[0].point);
          } else this.hitMarker.visible = false;
        }
      }
      if (this.draggingHotspot != null) {
        const hits = raycastAt(e.clientX, e.clientY, [this.sphere]);
        if (hits[0]) {
          const { yaw, pitch } = vec3ToYawPitch(hits[0].point);
          const h = this.hotspots[this.draggingHotspot];
          if (h) {
            h.yaw = Number(yaw.toFixed(2));
            h.pitch = Number(pitch.toFixed(2));
            this.rebuildHotspots();
          }
        }
        return;
      }
      if (this.dragging) {
        const dx = e.clientX - this.lastPtr.x;
        const dy = e.clientY - this.lastPtr.y;
        this.lastPtr = { x: e.clientX, y: e.clientY };
        this.yaw -= dx * 0.005;
        this.pitch -= dy * 0.005;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
        this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (this.renderer.xr.isPresenting) return;
      el.style.cursor = "grab";
      const moved = Math.hypot(e.clientX - this.pointerDownAt.x, e.clientY - this.pointerDownAt.y);
      const dt = performance.now() - this.pointerDownAt.t;

      if (this.draggingHotspot != null) {
        const idx = this.draggingHotspot;
        const h = this.hotspots[idx];
        if (h) this.cb.onHotspotDrag?.(idx, h.yaw, h.pitch);
        this.draggingHotspot = null;
        this.dragging = false;
        return;
      }
      this.dragging = false;

      // Treat as a click if barely moved.
      if (moved < 5 && dt < 500) {
        const hsHits = raycastAt(e.clientX, e.clientY, this.hotspotGroup.children);
        const idx = hsHits[0]?.object?.userData?.hotspotIndex as number | undefined;
        if (typeof idx === "number") {
          if (this.editMode) {
            this.cb.onSelect?.(idx);
          } else {
            const target = this.hotspots[idx]?.targetId;
            if (target) this.cb.onNavigate?.(target);
          }
          return;
        }
        // Empty click.
        const sHits = raycastAt(e.clientX, e.clientY, [this.sphere]);
        if (sHits[0]) {
          const { yaw, pitch } = vec3ToYawPitch(sHits[0].point);
          if (this.editMode) this.cb.onEmptyClick?.(yaw, pitch);
          else this.cb.onSelect?.(null);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.fov = Math.max(30, Math.min(100, this.fov + e.deltaY * 0.05));
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!this.editMode) return;
      const hits = raycastAt(e.clientX, e.clientY, this.hotspotGroup.children);
      const idx = hits[0]?.object?.userData?.hotspotIndex as number | undefined;
      if (typeof idx === "number") {
        e.preventDefault();
        this.cb.onSelect?.(idx);
        this.cb.onHotspotContextMenu?.(idx, e.clientX, e.clientY);
      }
    };

    // Touch pinch — 2-finger zoom.
    const activePointers = new Map<number, { x: number; y: number }>();
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        this.dragging = false;
      }
    };
    const onTouchMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const [a, b] = Array.from(activePointers.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const delta = this.pinchDist - d;
        this.pinchDist = d;
        this.fov = Math.max(30, Math.min(100, this.fov + delta * 0.2));
        this.camera.fov = this.fov;
        this.camera.updateProjectionMatrix();
      }
    };
    const onTouchUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      activePointers.delete(e.pointerId);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerdown", onTouchDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointermove", onTouchMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointerup", onTouchUp);
    window.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("contextmenu", onContextMenu);

    this.disposables.push(() => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerdown", onTouchDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointermove", onTouchMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerup", onTouchUp);
      window.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("contextmenu", onContextMenu);
    });
  }

  // ─── Locomotion (VR) ─────────────────────────────────────────────────
  // Continuous, frame-rate-independent joystick handling for Meta Quest.
  // Only the LEFT thumbstick X axis is used, and it only changes yaw.
  // Pitch / roll are locked so the panorama never tilts or steps.
  private pollXRControllers(dt: number) {
    const session = this.renderer.xr.getSession();
    if (!session) return;
    const DEAD = 0.15;
    const applyCurve = (v: number) => {
      const a = Math.abs(v);
      if (a < DEAD) return 0;
      const t = (a - DEAD) / (1 - DEAD);
      return Math.sign(v) * t * t; // quadratic ease → smooth accel/decel
    };

    let yawAxis = 0;
    for (const source of session.inputSources) {
      if (source.handedness !== "left") continue;
      const gp = source.gamepad;
      if (!gp) continue;
      const axes = gp.axes ?? [];
      const thumbX = Math.abs(axes[2] ?? 0) > Math.abs(axes[0] ?? 0) ? axes[2] : axes[0];
      yawAxis = applyCurve(thumbX ?? 0);
      break;
    }

    if (yawAxis !== 0) this.rig.rotation.y -= yawAxis * this.xrYawSpeed * dt;
    this.rig.rotation.x = 0;
    this.rig.rotation.z = 0;
  }

  // ─── Debug ───────────────────────────────────────────────────────────
  enableDebug(on: boolean) {
    this.debugEnabled = on;
    this.debugGroup.visible = on;
    if (on && !this.axesHelper) {
      this.axesHelper = new THREE.AxesHelper(2);
      this.debugGroup.add(this.axesHelper);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false }),
      );
      marker.renderOrder = 100;
      marker.visible = false;
      this.hitMarker = marker;
      this.debugGroup.add(marker);
    }
    this.updateDebugAnchors();
  }

  private updateDebugAnchors() {
    // Remove existing anchor dots.
    for (const c of [...this.debugGroup.children]) {
      if (c.userData.isAnchor) {
        this.debugGroup.remove(c);
        (c as THREE.Mesh).geometry?.dispose?.();
        ((c as THREE.Mesh).material as THREE.Material)?.dispose?.();
      }
    }
    if (!this.debugEnabled) return;
    for (let i = 0; i < this.hotspots.length; i++) {
      const h = this.hotspots[i];
      const pos = yawPitchToVec3(h.yaw, h.pitch, HOTSPOT_RADIUS);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0x00ff88, depthTest: false, transparent: true, opacity: 0.9 }),
      );
      dot.position.copy(pos);
      dot.renderOrder = 99;
      dot.userData.isAnchor = true;
      this.debugGroup.add(dot);
    }
  }

  private emitDebug() {
    if (!this.debugEnabled || !this.cb.onDebug) return;
    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const camYP = vec3ToYawPitch(camDir);

    const infos: DebugHotspotInfo[] = this.hotspots.map((h, i) => {
      const pos = yawPitchToVec3(h.yaw, h.pitch, HOTSPOT_RADIUS);
      return {
        index: i,
        id: `hs-${i}-${h.targetId}`,
        targetId: h.targetId,
        yaw: h.yaw,
        pitch: h.pitch,
        world: { x: +pos.x.toFixed(3), y: +pos.y.toFixed(3), z: +pos.z.toFixed(3) },
        visible: h.visible !== false,
        distance: +pos.distanceTo(camPos).toFixed(3),
        hovered: i === this.hoveredIndex,
        selected: i === this.selectedIndex,
      };
    });

    const now = performance.now();
    const fps = this.lastFrameT ? 1000 / (now - this.lastFrameT) : 0;
    this.cb.onDebug({
      fps: +fps.toFixed(0),
      presenting: this.renderer.xr.isPresenting,
      panoramaId: this.currentPanoramaId,
      cameraYaw: +camYP.yaw.toFixed(2),
      cameraPitch: +camYP.pitch.toFixed(2),
      hotspots: infos,
    });
  }

  // ─── Render loop ─────────────────────────────────────────────────────
  private startLoop() {
    const clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => {
      if (this.disposed) return;
      const dt = clock.getDelta();
      // Fade transition.
      if (this.fadeDir !== 0) {
        this.fadeMat.opacity = THREE.MathUtils.clamp(this.fadeMat.opacity + this.fadeDir * dt * FADE_SPEED, 0, 1);
        if (this.fadeMat.opacity >= 1 && this.pendingId) {
          this.applyPanorama(this.pendingId);
          this.pendingId = null;
          this.fadeDir = -1;
        } else if (this.fadeMat.opacity <= 0 && this.fadeDir < 0) {
          this.fadeDir = 0;
        }
      }
      if (this.xr) this.pollXRControllers(dt);
      this.renderer.render(this.scene, this.camera);
      const now = performance.now();
      if (this.debugEnabled && now - this.lastDebugEmit > 100) {
        this.emitDebug();
        this.lastDebugEmit = now;
      }
      this.lastFrameT = now;
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    for (const fn of this.disposables) fn();
    this.disposables = [];
    try { this.mount.removeChild(this.renderer.domElement); } catch { /* ignore */ }
    this.renderer.dispose();
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, direction: Hotspot["arrow"] = "up", color = "#ffffff") {
  ctx.strokeStyle = color;
  ctx.lineWidth = 22;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (direction === "right") {
    ctx.moveTo(78, 128); ctx.lineTo(178, 128);
    ctx.moveTo(128, 78); ctx.lineTo(178, 128);
    ctx.moveTo(128, 178); ctx.lineTo(178, 128);
  } else if (direction === "left") {
    ctx.moveTo(178, 128); ctx.lineTo(78, 128);
    ctx.moveTo(128, 78); ctx.lineTo(78, 128);
    ctx.moveTo(128, 178); ctx.lineTo(78, 128);
  } else if (direction === "down") {
    ctx.moveTo(128, 78); ctx.lineTo(128, 178);
    ctx.moveTo(78, 128); ctx.lineTo(128, 178);
    ctx.moveTo(178, 128); ctx.lineTo(128, 178);
  } else {
    ctx.moveTo(128, 180); ctx.lineTo(128, 78);
    ctx.moveTo(78, 128); ctx.lineTo(128, 78);
    ctx.moveTo(178, 128); ctx.lineTo(128, 78);
  }
  ctx.stroke();
}
