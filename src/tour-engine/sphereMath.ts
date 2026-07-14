import * as THREE from "three";

/**
 * ONE — and only one — spherical → world conversion for the whole app.
 *
 * Convention (matches Photo Sphere Viewer, so old panorama data works
 * unchanged): yaw increases clockwise looking down; pitch is +up.
 *
 *   x = -r · cos(pitch) · sin(yaw)
 *   y =  r · sin(pitch)
 *   z = -r · cos(pitch) · cos(yaw)
 *
 * Do NOT re-derive this anywhere else. Import this function.
 */
export function yawPitchToVec3(
  yawDeg: number,
  pitchDeg: number,
  radius: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const yaw = THREE.MathUtils.degToRad(yawDeg);
  const pit = THREE.MathUtils.degToRad(pitchDeg);
  out.set(
    -radius * Math.cos(pit) * Math.sin(yaw),
    radius * Math.sin(pit),
    -radius * Math.cos(pit) * Math.cos(yaw),
  );
  return out;
}

/** Inverse — world unit vector → { yaw, pitch } in degrees. */
export function vec3ToYawPitch(v: THREE.Vector3): { yaw: number; pitch: number } {
  const n = v.clone().normalize();
  const pitch = Math.asin(THREE.MathUtils.clamp(n.y, -1, 1));
  const yaw = Math.atan2(-n.x, -n.z);
  return {
    yaw: ((THREE.MathUtils.radToDeg(yaw) % 360) + 360) % 360,
    pitch: THREE.MathUtils.radToDeg(pitch),
  };
}
