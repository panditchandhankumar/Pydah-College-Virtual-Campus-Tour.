import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import type { Panorama } from "@/data/panoramas";
import { getPanorama } from "@/data/panoramas";

interface Props {
  panorama: Panorama;
  onChange: (id: string) => void;
}

/**
 * Native Three.js WebXR panorama viewer optimised for Meta Quest 3/3S.
 *
 * - Equirectangular texture on an inverted 500 m sphere for maximum clarity.
 * - Head tracking + 6DoF via WebXR "immersive-vr".
 * - Both Touch controllers get a laser ray; trigger selects a hotspot.
 * - Right thumbstick performs snap-turn (30°) for comfort.
 * - Panorama swaps use a fade-to-black shader for a smooth transition.
 */
export function VRPanoramaViewer({ panorama, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<any>(null);
  const [status, setStatus] = useState("Loading campus…");
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // ---- Boot Three.js scene (once) ----
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1100,
    );
    // Player rig — the camera is a child so we can rotate/teleport comfortably.
    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    mount.appendChild(renderer.domElement);

    // Enter-VR button (floats bottom-center).
    const vrButton = VRButton.createButton(renderer);
    vrButton.style.position = "absolute";
    vrButton.style.bottom = "24px";
    vrButton.style.left = "50%";
    vrButton.style.transform = "translateX(-50%)";
    mount.appendChild(vrButton);

    if ("xr" in navigator) {
      (navigator as any).xr
        ?.isSessionSupported?.("immersive-vr")
        .then((ok: boolean) => setXrSupported(ok))
        .catch(() => setXrSupported(false));
    } else {
      setXrSupported(false);
    }

    // ---- Panorama sphere ----
    const sphereGeom = new THREE.SphereGeometry(500, 96, 64);
    sphereGeom.scale(-1, 1, 1); // render inside
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 1,
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    // Hotspots group (populated per-panorama).
    const hotspotGroup = new THREE.Group();
    scene.add(hotspotGroup);

    // ---- Controllers with laser rays ----
    const controllerFactory = new XRControllerModelFactory();
    const rayGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -6),
    ]);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x28c7fa });

    const controllers: THREE.XRTargetRaySpace[] = [];
    const grips: THREE.XRGripSpace[] = [];
    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i);
      const line = new THREE.Line(rayGeom, rayMat);
      line.name = "ray";
      line.scale.z = 6;
      c.add(line);
      rig.add(c);
      controllers.push(c);

      const grip = renderer.xr.getControllerGrip(i);
      grip.add(controllerFactory.createControllerModel(grip));
      rig.add(grip);
      grips.push(grip);

      c.addEventListener("selectstart", () => onSelect(c));
    }

    // ---- Snap-turn from right thumbstick ----
    let snapReady = true;
    function pollControllers() {
      const session = renderer.xr.getSession();
      if (!session) return;
      for (const source of session.inputSources) {
        const gp = source.gamepad;
        if (!gp) continue;
        const x = gp.axes[2] ?? gp.axes[0] ?? 0;
        if (source.handedness === "right") {
          if (Math.abs(x) > 0.75 && snapReady) {
            rig.rotation.y -= Math.sign(x) * (Math.PI / 6);
            snapReady = false;
          } else if (Math.abs(x) < 0.3) {
            snapReady = true;
          }
        }
      }
    }

    // ---- Hotspot selection ----
    const raycaster = new THREE.Raycaster();
    const tmpMatrix = new THREE.Matrix4();
    function onSelect(controller: THREE.XRTargetRaySpace) {
      tmpMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tmpMatrix);
      const hits = raycaster.intersectObjects(hotspotGroup.children, false);
      const target = hits[0]?.object?.userData?.targetId as string | undefined;
      if (target) triggerChange(target);
    }
    // Desktop click fallback.
    function onPointerDown(ev: PointerEvent) {
      if (renderer.xr.isPresenting) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hotspotGroup.children, false);
      const target = hits[0]?.object?.userData?.targetId as string | undefined;
      if (target) triggerChange(target);
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // ---- Desktop drag-to-look ----
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let yaw = 0;
    let pitch = 0;
    renderer.domElement.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener("pointerup", () => (dragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!dragging || renderer.xr.isPresenting) return;
      yaw -= (e.clientX - lastX) * 0.005;
      pitch -= (e.clientY - lastY) * 0.005;
      pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
      lastX = e.clientX;
      lastY = e.clientY;
      camera.rotation.set(pitch, yaw, 0, "YXZ");
    });

    // ---- Fade overlay (screen-space plane on the camera) ----
    const fadeGeom = new THREE.PlaneGeometry(2, 2);
    const fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    const fade = new THREE.Mesh(fadeGeom, fadeMat);
    fade.position.z = -0.5;
    fade.renderOrder = 999;
    camera.add(fade);

    function triggerChange(id: string) {
      if (id === stateRef.current.currentId) return;
      stateRef.current.pendingId = id;
      stateRef.current.fadeDir = 1;
    }

    // ---- Animation loop ----
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      const st = stateRef.current;
      if (st) {
        // fade animation
        if (st.fadeDir !== 0) {
          fadeMat.opacity = THREE.MathUtils.clamp(
            fadeMat.opacity + st.fadeDir * dt * 1.6,
            0,
            1,
          );
          if (fadeMat.opacity >= 1 && st.pendingId) {
            st.applyPanorama(st.pendingId);
            st.pendingId = null;
            st.fadeDir = -1;
          } else if (fadeMat.opacity <= 0 && st.fadeDir < 0) {
            st.fadeDir = 0;
          }
        }
      }
      pollControllers();
      renderer.render(scene, camera);
    });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Expose state for the panorama-change effect.
    stateRef.current = {
      renderer,
      scene,
      sphere,
      sphereMat,
      hotspotGroup,
      currentId: null as string | null,
      pendingId: null as string | null,
      fadeDir: 0 as -1 | 0 | 1,
      applyPanorama: null as null | ((id: string) => void),
    };

    // Loader
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    stateRef.current.applyPanorama = (id: string) => {
      const p = getPanorama(id);
      if (!p) return;
      setStatus(`Loading ${p.title}…`);
      loader.load(
        p.panorama,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          const old = (sphere.material as THREE.MeshBasicMaterial).map;
          (sphere.material as THREE.MeshBasicMaterial).map = tex;
          (sphere.material as THREE.MeshBasicMaterial).color.set(0xffffff);
          (sphere.material as THREE.MeshBasicMaterial).needsUpdate = true;
          old?.dispose();

          // Rebuild hotspots
          while (hotspotGroup.children.length) {
            const c = hotspotGroup.children.pop()!;
            (c as THREE.Mesh).geometry?.dispose?.();
            ((c as THREE.Mesh).material as THREE.Material)?.dispose?.();
          }
          for (const h of p.hotspots) {
            const g = new THREE.SphereGeometry(0.35, 24, 16);
            const m = new THREE.MeshBasicMaterial({
              color: 0x28c7fa,
              transparent: true,
              opacity: 0.9,
            });
            const mesh = new THREE.Mesh(g, m);
            const yaw = THREE.MathUtils.degToRad(h.yaw);
            const pit = THREE.MathUtils.degToRad(h.pitch);
            const r = 6;
            mesh.position.set(
              r * Math.cos(pit) * Math.sin(yaw),
              r * Math.sin(pit),
              -r * Math.cos(pit) * Math.cos(yaw),
            );
            mesh.userData.targetId = h.targetId;
            hotspotGroup.add(mesh);

            // ring outline
            const ringGeom = new THREE.RingGeometry(0.45, 0.55, 32);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.8,
              side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.copy(mesh.position);
            ring.lookAt(0, 0, 0);
            hotspotGroup.add(ring);
          }
          stateRef.current.currentId = id;
          setStatus("");
          onChange(id);
        },
        undefined,
        () => setStatus("Failed to load panorama."),
      );
    };

    // Initial load
    stateRef.current.applyPanorama(panorama.id);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      vrButton.remove();
      mount.removeChild(renderer.domElement);
      sphereGeom.dispose();
      sphereMat.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prop-driven panorama switching (from external UI).
  useEffect(() => {
    const st = stateRef.current;
    if (!st || !st.applyPanorama) return;
    if (st.currentId === panorama.id) return;
    st.pendingId = panorama.id;
    st.fadeDir = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panorama.id]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black">
      <div ref={mountRef} className="h-full w-full" />

      {status && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50 text-white backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
            <p className="text-sm">{status}</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1 text-xs text-white/90">
        <span className="rounded-full bg-black/60 px-3 py-1 backdrop-blur">
          {panorama.title}
        </span>
        {xrSupported === false && (
          <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/70 backdrop-blur">
            Open in Meta Quest Browser for immersive VR
          </span>
        )}
        {xrSupported === true && (
          <span className="rounded-full bg-accent/80 px-3 py-1 text-[10px] font-semibold text-black backdrop-blur">
            VR ready — press Enter VR
          </span>
        )}
      </div>

      <button
        onClick={() => navigate({ to: "/" })}
        className="absolute right-4 top-4 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/80"
      >
        Exit
      </button>
    </div>
  );
}
