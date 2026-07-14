import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import type { Panorama, Hotspot } from "@/data/panoramas";
import { getPanorama } from "@/data/panoramas";
import { useHotspotStore } from "@/lib/hotspotStore";
import vrConfig from "@/config/vr.json";

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
    renderer.xr.setReferenceSpaceType(vrConfig.renderer.referenceSpace as XRReferenceSpaceType);
    renderer.xr.setFoveation?.(vrConfig.renderer.foveation);
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

    // ---- Snap-turn + smooth locomotion + teleport (config-driven) ----
    const loco = vrConfig.locomotion;
    let snapReady = true;
    function pollControllers(dt: number) {
      const session = renderer.xr.getSession();
      if (!session) return;
      for (const source of session.inputSources) {
        const gp = source.gamepad;
        if (!gp) continue;
        const x = gp.axes[2] ?? gp.axes[0] ?? 0;
        const y = gp.axes[3] ?? gp.axes[1] ?? 0;

        if (source.handedness === "right" && loco.snapTurnEnabled) {
          if (Math.abs(x) > 0.75 && snapReady) {
            rig.rotation.y -= Math.sign(x) * THREE.MathUtils.degToRad(loco.snapTurnDegrees);
            snapReady = false;
          } else if (Math.abs(x) < 0.3) {
            snapReady = true;
          }
        }

        if (source.handedness === "left" && loco.smoothEnabled) {
          // Smooth locomotion: move rig in the direction the camera is facing.
          const deadzone = 0.2;
          if (Math.abs(x) > deadzone || Math.abs(y) > deadzone) {
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
            const move = new THREE.Vector3()
              .addScaledVector(forward, -y * loco.smoothSpeed * dt)
              .addScaledVector(right, x * loco.smoothSpeed * dt);
            rig.position.add(move);
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
      pollControllers(dt);
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
          function drawArrow(ctx: CanvasRenderingContext2D, direction: Hotspot["arrow"] = "up") {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 22;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
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

          while (hotspotGroup.children.length) {
            const c = hotspotGroup.children.pop()!;
            (c as THREE.Mesh).geometry?.dispose?.();
            ((c as THREE.Mesh).material as THREE.Material)?.dispose?.();
          }
          for (const h of p.hotspots) {
            const target = getPanorama(h.targetId);
            const name = target?.title ?? h.label ?? "Location";

            // Blue disc with white up-arrow (canvas → texture on a plane)
            const discCanvas = document.createElement("canvas");
            discCanvas.width = 256;
            discCanvas.height = 256;
            const dctx = discCanvas.getContext("2d")!;
            dctx.beginPath();
            dctx.arc(128, 128, 110, 0, Math.PI * 2);
            dctx.fillStyle = "#1e5fbf";
            dctx.fill();
            dctx.lineWidth = 12;
            dctx.strokeStyle = "#ffffff";
            dctx.stroke();
            drawArrow(dctx, h.arrow);
            const discTex = new THREE.CanvasTexture(discCanvas);
            discTex.colorSpace = THREE.SRGBColorSpace;
            const discMat = new THREE.MeshBasicMaterial({
              map: discTex,
              transparent: true,
              depthTest: false,
              depthWrite: false,
            });
            const discGeom = new THREE.PlaneGeometry(1.4, 1.4);
            const disc = new THREE.Mesh(discGeom, discMat);

            const yaw = THREE.MathUtils.degToRad(h.yaw);
            const pit = THREE.MathUtils.degToRad(h.pitch);
            const r = 6;
            const pos = new THREE.Vector3(
              r * Math.cos(pit) * Math.sin(yaw),
              r * Math.sin(pit),
              -r * Math.cos(pit) * Math.cos(yaw),
            );
            disc.position.copy(pos);
            disc.lookAt(0, 0, 0);
            disc.userData.targetId = h.targetId;
            disc.renderOrder = 10;
            hotspotGroup.add(disc);

            // Label plane above the disc
            const labelCanvas = document.createElement("canvas");
            labelCanvas.width = 512;
            labelCanvas.height = 128;
            const lctx = labelCanvas.getContext("2d")!;
            lctx.font = "bold 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
            const textW = lctx.measureText(name).width;
            const padX = 28;
            const boxW = Math.min(labelCanvas.width, textW + padX * 2);
            const boxH = 96;
            const bx = (labelCanvas.width - boxW) / 2;
            const by = (labelCanvas.height - boxH) / 2;
            const radius = 14;
            lctx.fillStyle = "#ffffff";
            lctx.beginPath();
            lctx.moveTo(bx + radius, by);
            lctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, radius);
            lctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, radius);
            lctx.arcTo(bx, by + boxH, bx, by, radius);
            lctx.arcTo(bx, by, bx + boxW, by, radius);
            lctx.closePath();
            lctx.fill();
            lctx.strokeStyle = "rgba(0,33,71,0.2)";
            lctx.lineWidth = 2;
            lctx.stroke();
            lctx.fillStyle = "#002147";
            lctx.textAlign = "center";
            lctx.textBaseline = "middle";
            lctx.fillText(name, labelCanvas.width / 2, labelCanvas.height / 2);
            const labelTex = new THREE.CanvasTexture(labelCanvas);
            labelTex.colorSpace = THREE.SRGBColorSpace;
            const labelMat = new THREE.MeshBasicMaterial({
              map: labelTex,
              transparent: true,
              depthTest: false,
              depthWrite: false,
            });
            const labelAspect = labelCanvas.width / labelCanvas.height;
            const labelH = 0.6;
            const labelGeom = new THREE.PlaneGeometry(labelH * labelAspect, labelH);
            const label = new THREE.Mesh(labelGeom, labelMat);
            // Position slightly above the disc, along the same look direction
            const up = new THREE.Vector3(0, 1.15, 0);
            label.position.copy(pos).add(up);
            label.lookAt(0, 0, 0);
            label.renderOrder = 11;
            hotspotGroup.add(label);
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
