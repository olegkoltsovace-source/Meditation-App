import * as THREE from "three";
import { readColorToken } from "./colors.js";

const SPLASH_SECONDS = 0.8; // how long one splash ring lasts
const SPLASH_POOL_SIZE = 64; // enough for every bubble leaving at once, plus a few landing

// A small ring on the surface of the core wherever a bubble breaks through it
// (and again where it lands on the way back), like a drop leaving the surface of water.
export const createSurfaceSplashes = (parentGroup) => {
  const ringShape = new THREE.RingGeometry(0.82, 1, 48);
  const splashes = [];

  for (let splashIndex = 0; splashIndex < SPLASH_POOL_SIZE; splashIndex++) {
    const material = new THREE.MeshBasicMaterial({
      color: readColorToken("--ripple"),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const splash = new THREE.Mesh(ringShape, material);
    splash.visible = false;
    splash.userData = { startedAt: 0, direction: new THREE.Vector3() };
    parentGroup.add(splash);
    splashes.push(splash);
  }

  const origin = new THREE.Vector3(0, 0, 0);
  let nextSplashIndex = 0; // the pool is used in turn; the oldest splash is reused first

  // direction: which way the bubble is travelling (a unit vector from the core's centre)
  const splashAt = (direction, sceneSeconds) => {
    const splash = splashes[nextSplashIndex];
    nextSplashIndex = (nextSplashIndex + 1) % SPLASH_POOL_SIZE;
    splash.userData.startedAt = sceneSeconds;
    splash.userData.direction.copy(direction);
    splash.visible = true;
  };

  const update = (sceneSeconds, sizes) => {
    splashes.forEach((splash) => {
      if (!splash.visible) return;
      const age = (sceneSeconds - splash.userData.startedAt) / SPLASH_SECONDS; // 0 … 1
      if (age >= 1) {
        splash.visible = false;
        return;
      }
      // Sit on the core's surface, lying flat against it (facing outwards along the bubble's path)
      splash.position
        .copy(splash.userData.direction)
        .multiplyScalar(sizes.coreRadius * 1.01);
      splash.lookAt(origin);
      const easedAge = 1 - Math.pow(1 - age, 2);
      splash.scale.setScalar(sizes.coreRadius * (0.08 + easedAge * 0.32));
      splash.material.opacity = (1 - age) * 0.9;
    });
  };

  const applyColors = () =>
    splashes.forEach(
      (splash) => (splash.material.color = readColorToken("--ripple")),
    );

  return { splashAt, update, applyColors };
};
