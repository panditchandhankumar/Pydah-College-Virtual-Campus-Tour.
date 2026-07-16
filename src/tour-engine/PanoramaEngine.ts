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
const PANORAMA_LOAD_TIMEOUT_MS = 12_000;

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
  crisp:       { framebufferScale: 1.35, foveation: 0.0, mipmaps: true, minFilter: "mipmap-linear",  anisoFactor: 1.0  },
  balanced:    { framebufferScale: 1.3, foveation: 0.3, mipmaps: true, minFilter: "mipmap-linear",  anisoFactor: 0.5  },
  performance: { framebufferScale: 1.0, foveation: 0.6, mipmaps: true, minFilter: "mipmap-nearest", anisoFactor: 0.25 },
};

function createQuestStableRenderer(params: THREE.WebGLRendererParameters) {
  const win = window as Window & { XRWebGLBinding?: unknown };
  const originalDescriptor = Object.getOwnPropertyDescriptor(win, "XRWebGLBinding");
  const originalValue = win.XRWebGLBinding;
  let masked = false;

  // Quest Browser can expose WebXR Layers but still return a black projection
  // layer after refresh/re-entry. Three.js decides between XRProjectionLayer and
  // XRWebGLLayer when WebGLRenderer is constructed, so mask XRWebGLBinding only
  // for this constructor call and force the stable XRWebGLLayer path.
  if (originalValue) {
    try {
      Object.defineProperty(win, "XRWebGLBinding", {
        configurable: true,
        writable: true,
        value: undefined,
      });
      masked = true;
    } catch {
      masked = false;
    }
  }

  try {
    return new THREE.WebGLRenderer(params);
  } finally {
    if (masked) {
      try {
        if (originalDescriptor) Object.defineProperty(win, "XRWebGLBinding", originalDescriptor);
        else win.XRWebGLBinding = originalValue;
      } catch {
        try { win.XRWebGLBinding = originalValue; } catch { /* ignore */ }
      }
    }
  }
}

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
  private panoramaLoadSeq = 0;
  private panoramaLoadTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Quality / diagnostics ──────────────────────────────────────────
  private qualityPreset: QualityPreset = "auto";
  private effectivePreset: Exclude<QualityPreset, "auto"> = "crisp";
  private autoDowngraded = false;
  private maxAnisotropy = 1;
  private fpsSamples: number[] = [];
  private lastAutoCheck = 0;
  private loading = false;
  private loadingLabel = "";
  private lastDiagEmit = 0;
  private texWidth = 0;
  private texHeight = 0;
  private xrSessionActive = false;
  private xrSessionStarting = false;
  // In-VR quality/diagnostics panel (canvas texture on left controller).
  private vrPanel: THREE.Mesh | null = null;
  private vrPanelCanvas: HTMLCanvasElement | null = null;
  private vrPanelTex: THREE.CanvasTexture | null = null;
  private vrPanelVisible = true;
  private vrPanelLastDraw = 0;
  // Debounce controller grip presses.
  private lastGripPress: Record<string, number> = {};

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

    const rendererParams = {
      antialias: true,
      powerPreference: "high-performance",
      xrCompatible: true,
    } as THREE.WebGLRendererParameters & { xrCompatible: boolean };
    this.renderer = this.xr
      ? createQuestStableRenderer(rendererParams)
      : new THREE.WebGLRenderer(rendererParams);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // NoToneMapping for equirect panoramas — ACES darkens them heavily in
    // WebXR (Quest 3 / 3S) framebuffers and can render as a black view.
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy?.() ?? 1;
    if (this.xr) {
      this.renderer.xr.enabled = true;
      // Use "local" for the tour viewer. It is the most reliable Meta Quest
      // reference space for seated/standing panoramas and avoids session-start
      // failures that otherwise appear as a black headset view.
      try { this.renderer.xr.setReferenceSpaceType("local"); } catch { /* ignore */ }
      // Apply initial highest-quality preset before session starts so the very
      // first frame in the headset is already crisp (no "wait for downgrade").
      this.applyQuality("crisp");
      this.renderer.xr.addEventListener("sessionstart", () => {
        this.xrSessionStarting = false;
        this.xrSessionActive = true;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        this.rig.position.set(0, 0, 0);
        this.rig.rotation.set(0, 0, 0);
        this.camera.position.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        this.fadeMat.opacity = 0;
        this.fadeDir = 0;
        this.pendingId = null;
        // Always show a lit sphere on session start.
        this.sphereMat.color.set(this.sphereMat.map ? 0xffffff : 0x1a2540);
        this.sphereMat.needsUpdate = true;
        // Re-assert only values that are legal during an active XR session.
        // Three.js/WebXR cannot change framebufferScaleFactor after the XR layer
        // is created; doing so on Quest can leave the headset with a black layer.
        this.autoDowngraded = false;
        this.fpsSamples = [];
        this.lastAutoCheck = performance.now();
        const target = this.qualityPreset === "auto" ? "crisp" : this.qualityPreset;
        this.effectivePreset = target;
        this.applySessionSafeQuality(target);
        this.buildVRPanel();
      });
      this.renderer.xr.addEventListener("sessionend", () => {
        this.xrSessionActive = false;
        this.xrSessionStarting = false;
        this.disposeVRPanel();
      });
    }
    mount.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.cursor = "grab";

    const onContextLost = (event: Event) => {
      event.preventDefault();
      this.loading = false;
      this.loadingLabel = "";
      this.xrSessionStarting = false;
      this.xrSessionActive = false;
      this.fadeDir = 0;
      this.pendingId = null;
      if (import.meta.env.DEV) console.warn("WebGL context lost during panorama/VR rendering");
      this.cb.onLoadError?.();
    };
    const onContextRestored = () => {
      if (import.meta.env.DEV) console.info("WebGL context restored; reloading panorama texture");
      if (this.currentPanoramaId) this.applyPanorama(this.currentPanoramaId);
    };
    this.renderer.domElement.addEventListener("webglcontextlost", onContextLost, false);
    this.renderer.domElement.addEventListener("webglcontextrestored", onContextRestored, false);
    this.disposables.push(() => {
      this.renderer.domElement.removeEventListener("webglcontextlost", onContextLost, false);
      this.renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored, false);
    });

    // Panorama sphere (inverted). Neutral navy placeholder so if the
    // headset session opens before the texture arrives, the user sees a
    // color instead of pure black.
    const geom = new THREE.SphereGeometry(SPHERE_RADIUS, 128, 96);
    geom.scale(-1, 1, 1);
    this.sphereMat = new THREE.MeshBasicMaterial({ color: 0x1a2540, side: THREE.DoubleSide });
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
    if (!p) {
      this.loading = false;
      this.loadingLabel = "";
      this.cb.onLoadError?.();
      return;
    }

    const loadSeq = ++this.panoramaLoadSeq;
    if (this.panoramaLoadTimer) {
      clearTimeout(this.panoramaLoadTimer);
      this.panoramaLoadTimer = null;
    }

    this.loading = true;
    this.loadingLabel = p.title;
    this.cb.onLoadStart?.(p.title);

    const clearLoadTimer = () => {
      if (this.panoramaLoadTimer) {
        clearTimeout(this.panoramaLoadTimer);
        this.panoramaLoadTimer = null;
      }
    };

    const failLoad = (reason?: unknown) => {
      if (loadSeq !== this.panoramaLoadSeq || this.disposed) return;
      clearLoadTimer();
      this.loading = false;
      this.loadingLabel = "";
      this.fadeDir = 0;
      this.pendingId = null;
      this.fadeMat.opacity = 0;
      if (import.meta.env.DEV && reason) console.warn("Panorama load failed", { id, reason });
      this.cb.onLoadError?.();
    };

    this.panoramaLoadTimer = setTimeout(
      () => failLoad(new Error(`Panorama load timed out after ${PANORAMA_LOAD_TIMEOUT_MS}ms`)),
      PANORAMA_LOAD_TIMEOUT_MS,
    );

    this.loader.load(
      p.panorama,
      (tex) => {
        if (loadSeq !== this.panoramaLoadSeq || this.disposed) {
          tex.dispose();
          return;
        }
        clearLoadTimer();
        tex.colorSpace = THREE.SRGBColorSpace;
        this.applyTextureQuality(tex);
        const img = tex.image as HTMLImageElement | ImageBitmap | undefined;
        this.texWidth = (img as { width?: number })?.width ?? 0;
        this.texHeight = (img as { height?: number })?.height ?? 0;
        const old = this.sphereMat.map;
        this.sphereMat.map = tex;
        this.sphereMat.color.set(0xffffff);
        this.sphereMat.needsUpdate = true;
        old?.dispose();
        this.currentPanoramaId = id;
        this.rebuildHotspots();
        this.loading = false;
        this.loadingLabel = "";
        this.cb.onLoadEnd?.();
      },
      undefined,
      (err) => failLoad(err),
    );
  }

  private applyTextureQuality(tex: THREE.Texture) {
    const row = QUALITY_TABLE[this.effectivePreset];
    tex.generateMipmaps = row.mipmaps;
    tex.minFilter = row.mipmaps
      ? (row.minFilter === "mipmap-linear" ? THREE.LinearMipmapLinearFilter : THREE.LinearMipmapNearestFilter)
      : THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.max(1, Math.round(this.maxAnisotropy * row.anisoFactor));
    tex.needsUpdate = true;
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
    let zoomAxis = 0;
    for (const source of session.inputSources) {
      const gp = source.gamepad;
      if (!gp) continue;
      const axes = gp.axes ?? [];
      // WebXR standard mapping: axes[2]=stick X, axes[3]=stick Y (fallback 0/1).
      const stickX = Math.abs(axes[2] ?? 0) > Math.abs(axes[0] ?? 0) ? (axes[2] ?? 0) : (axes[0] ?? 0);
      const stickY = Math.abs(axes[3] ?? 0) > Math.abs(axes[1] ?? 0) ? (axes[3] ?? 0) : (axes[1] ?? 0);
      if (source.handedness === "left") {
        yawAxis = applyCurve(stickX);
      } else if (source.handedness === "right") {
        zoomAxis = applyCurve(stickY);
      }
    }

    // Left stick X → continuous yaw only.
    if (yawAxis !== 0) this.rig.rotation.y -= yawAxis * this.xrYawSpeed * dt;
    // Lock pitch & roll — no vertical camera tilt, ever.
    this.rig.rotation.x = 0;
    this.rig.rotation.z = 0;

    // Right stick Y → smooth FOV zoom (up = zoom in / smaller FOV).
    if (zoomAxis !== 0) {
      const ZOOM_SPEED = 40; // deg/sec at full deflection
      const MIN_FOV = 30;
      const MAX_FOV = 100;
      this.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, this.fov + zoomAxis * ZOOM_SPEED * dt));
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
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

  // ─── Quality / Diagnostics ───────────────────────────────────────────
  setQualityPreset(preset: QualityPreset) {
    this.qualityPreset = preset;
    this.autoDowngraded = false;
    this.fpsSamples = [];
    const target = preset === "auto" ? "crisp" : preset;
    this.applyQuality(target);
  }

  getQualityPreset(): QualityPreset { return this.qualityPreset; }

  beginXRSessionRequest() {
    const target = this.qualityPreset === "auto" ? "crisp" : this.qualityPreset;
    this.xrSessionStarting = false;
    this.applyQuality(target);
    this.xrSessionStarting = true;
  }

  cancelXRSessionRequest() {
    this.xrSessionStarting = false;
  }

  private applyQuality(next: Exclude<QualityPreset, "auto">) {
    this.effectivePreset = next;
    const row = QUALITY_TABLE[next];
    if (this.xr) {
      // setFramebufferScaleFactor MUST be called before renderer.xr.setSession().
      // During/after session start it is explicitly unsupported by Three.js and
      // can produce a blank Meta Quest view. Use it only before entering VR.
      if (!this.xrSessionActive && !this.xrSessionStarting && !this.renderer.xr.isPresenting) {
        try { this.renderer.xr.setFramebufferScaleFactor?.(row.framebufferScale); } catch { /* ignore */ }
      }
      try { this.renderer.xr.setFoveation?.(row.foveation); } catch { /* ignore */ }
    }
    if (this.sphereMat?.map) {
      this.applyTextureQuality(this.sphereMat.map);
      this.sphereMat.needsUpdate = true;
    }
  }

  private applySessionSafeQuality(next: Exclude<QualityPreset, "auto">) {
    const row = QUALITY_TABLE[next];
    if (this.xr) {
      try { this.renderer.xr.setFoveation?.(row.foveation); } catch { /* ignore */ }
    }
    if (this.sphereMat?.map) {
      this.applyTextureQuality(this.sphereMat.map);
      this.sphereMat.needsUpdate = true;
    }
  }

  private checkAutoDowngrade(now: number) {
    if (this.qualityPreset !== "auto") return;
    if (!this.renderer.xr.isPresenting) return;
    if (this.autoDowngraded) return;
    if (now - this.lastAutoCheck < 500) return;
    this.lastAutoCheck = now;
    // Sustained low FPS → drop one tier.
    const avg = this.fpsSamples.length
      ? this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length
      : 0;
    if (this.fpsSamples.length >= 90) { // ~1.5s of samples
      const drop = this.effectivePreset === "crisp" && avg < 60
        ? "balanced"
        : this.effectivePreset === "balanced" && avg < 45
        ? "performance"
        : null;
      if (drop) {
        this.autoDowngraded = true;
        this.applyQuality(drop);
        this.fpsSamples = [];
      }
    }
  }

  private buildDiagnostics(): DiagnosticsState {
    const row = QUALITY_TABLE[this.effectivePreset];
    const tex = this.sphereMat.map;
    const now = performance.now();
    const fps = this.lastFrameT ? 1000 / Math.max(1, now - this.lastFrameT) : 0;
    const avg = this.fpsSamples.length
      ? this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length
      : fps;
    return {
      presenting: this.renderer.xr.isPresenting,
      preset: this.qualityPreset,
      effectivePreset: this.effectivePreset,
      framebufferScale: row.framebufferScale,
      foveation: row.foveation,
      anisotropy: tex?.anisotropy ?? Math.round(this.maxAnisotropy * row.anisoFactor),
      maxAnisotropy: this.maxAnisotropy,
      mipmaps: row.mipmaps,
      minFilter: row.minFilter,
      textureWidth: this.texWidth,
      textureHeight: this.texHeight,
      loading: this.loading,
      loadingLabel: this.loadingLabel,
      fps: +fps.toFixed(0),
      avgFps: +avg.toFixed(0),
      autoDowngraded: this.autoDowngraded,
    };
  }

  // In-VR quality/diagnostics panel — attaches a canvas texture to the LEFT
  // controller so the user can see live tuning info inside the headset.
  private buildVRPanel() {
    this.disposeVRPanel();
    const c = this.controllers[0];
    if (!c) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 320;
    this.vrPanelCanvas = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.vrPanelTex = tex;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.95,
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.175), mat);
    // Sit above the controller, angled toward the user's face.
    mesh.position.set(0, 0.12, -0.15);
    mesh.rotation.set(-Math.PI / 4, 0, 0);
    mesh.renderOrder = 500;
    mesh.visible = this.vrPanelVisible;
    c.add(mesh);
    this.vrPanel = mesh;
  }

  private disposeVRPanel() {
    if (!this.vrPanel) return;
    this.vrPanel.parent?.remove(this.vrPanel);
    (this.vrPanel.material as THREE.Material)?.dispose?.();
    this.vrPanel.geometry?.dispose?.();
    this.vrPanelTex?.dispose?.();
    this.vrPanel = null;
    this.vrPanelCanvas = null;
    this.vrPanelTex = null;
  }

  private drawVRPanel(diag: DiagnosticsState) {
    if (!this.vrPanelCanvas || !this.vrPanelTex || !this.vrPanel) return;
    if (!this.vrPanelVisible) { this.vrPanel.visible = false; return; }
    this.vrPanel.visible = true;
    const ctx = this.vrPanelCanvas.getContext("2d");
    if (!ctx) return;
    const W = this.vrPanelCanvas.width, H = this.vrPanelCanvas.height;
    ctx.fillStyle = "rgba(4, 12, 28, 0.92)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#28c7fa"; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.fillStyle = "#28c7fa"; ctx.font = "bold 26px system-ui"; ctx.textBaseline = "top";
    ctx.fillText("VR Diagnostics", 16, 12);
    ctx.font = "18px ui-monospace, Menlo, monospace"; ctx.fillStyle = "#e6f3ff";
    const rows: [string, string][] = [
      ["Preset", `${diag.preset}${diag.preset === "auto" ? ` → ${diag.effectivePreset}` : ""}`],
      ["FB Scale", `${diag.framebufferScale.toFixed(2)}x`],
      ["Foveation", diag.foveation.toFixed(2)],
      ["Aniso", `${diag.anisotropy}/${diag.maxAnisotropy}`],
      ["Mipmap", `${diag.mipmaps ? "on" : "off"} · ${diag.minFilter}`],
      ["Texture", `${diag.textureWidth}×${diag.textureHeight}`],
      ["Loading", diag.loading ? diag.loadingLabel || "…" : "idle"],
      ["FPS", `${diag.fps} (avg ${diag.avgFps})${diag.autoDowngraded ? " ⬇" : ""}`],
    ];
    let y = 52;
    for (const [k, v] of rows) {
      ctx.fillStyle = "#7fb1d9"; ctx.fillText(k, 20, y);
      ctx.fillStyle = "#ffffff"; ctx.fillText(v, 170, y);
      y += 30;
    }
    ctx.fillStyle = "#7fb1d9"; ctx.font = "14px ui-monospace";
    ctx.fillText("L-grip: toggle · R-grip: cycle preset", 20, H - 24);
    this.vrPanelTex.needsUpdate = true;
  }

  // Poll controller grip (button 1) for panel toggle / preset cycling.
  private pollXRButtons() {
    const session = this.renderer.xr.getSession();
    if (!session) return;
    for (const src of session.inputSources) {
      const gp = src.gamepad;
      if (!gp) continue;
      const grip = gp.buttons?.[1];
      const key = src.handedness ?? "unknown";
      const now = performance.now();
      if (grip?.pressed) {
        if (!this.lastGripPress[key] || now - this.lastGripPress[key] > 400) {
          this.lastGripPress[key] = now;
          if (src.handedness === "left") {
            this.vrPanelVisible = !this.vrPanelVisible;
          } else if (src.handedness === "right") {
            const order: QualityPreset[] = ["auto", "crisp", "balanced", "performance"];
            const i = order.indexOf(this.qualityPreset);
            this.setQualityPreset(order[(i + 1) % order.length]);
          }
        }
      } else if (this.lastGripPress[key]) {
        // release resets debounce quickly
        if (now - this.lastGripPress[key] > 400) this.lastGripPress[key] = 0;
      }
    }
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
      if (this.xr) {
        this.pollXRControllers(dt);
        if (this.renderer.xr.isPresenting) this.pollXRButtons();
      }
      this.renderer.render(this.scene, this.camera);
      const now = performance.now();

      // FPS sampling for auto-downgrade + diagnostics.
      if (this.lastFrameT) {
        const fps = 1000 / Math.max(1, now - this.lastFrameT);
        this.fpsSamples.push(fps);
        if (this.fpsSamples.length > 120) this.fpsSamples.shift();
      }
      this.checkAutoDowngrade(now);

      if (this.debugEnabled && now - this.lastDebugEmit > 100) {
        this.emitDebug();
        this.lastDebugEmit = now;
      }
      // Diagnostics + in-VR panel refresh (~4Hz).
      if (now - this.lastDiagEmit > 250) {
        const diag = this.buildDiagnostics();
        this.cb.onDiagnostics?.(diag);
        if (this.renderer.xr.isPresenting) this.drawVRPanel(diag);
        this.lastDiagEmit = now;
      }
      this.lastFrameT = now;
    });
  }

  dispose() {
    this.disposed = true;
    this.panoramaLoadSeq++;
    if (this.panoramaLoadTimer) {
      clearTimeout(this.panoramaLoadTimer);
      this.panoramaLoadTimer = null;
    }
    this.disposeVRPanel();
    this.renderer.setAnimationLoop(null);
    for (const fn of this.disposables) fn();
    this.disposables = [];
    this.sphereMat.map?.dispose();
    this.sphere.geometry.dispose();
    this.sphereMat.dispose();
    while (this.hotspotGroup.children.length) {
      const child = this.hotspotGroup.children.pop() as THREE.Mesh;
      child.geometry?.dispose?.();
      const material = child.material as THREE.Material & { map?: THREE.Texture };
      material?.map?.dispose?.();
      material?.dispose?.();
    }
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
