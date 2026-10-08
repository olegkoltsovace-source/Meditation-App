import * as THREE from "three";
import { readColorToken } from "./colors.js";

const RIPPLE_COUNT = 6; // rings that can be on screen at once
const RIPPLE_SECONDS = 3; // how long one ring takes to travel
const RINGS_PER_WAVE = [0, 0.45, 0.9]; // three rings per breath, this many seconds apart

// Thin rings that flow out of the core on the out-breath and into it on the in-breath
// (the original's ring animations). Each ring is tilted differently, like the orbits of an atom.
export const createRipples = (parentGroup) => {
  const ringShape = new THREE.RingGeometry(0.985, 1, 128);
  const ripples = [];

  for (let rippleIndex = 0; rippleIndex < RIPPLE_COUNT; rippleIndex++) {
    const material = new THREE.MeshBasicMaterial({
      color: readColorToken("--ripple"),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide, // visible from behind too, as the scene turns
      depthWrite: false,
    });
    const ripple = new THREE.Mesh(ringShape, material);
    ripple.visible = false;
    ripple.userData = { startsAt: 0, direction: "out" };
    parentGroup.add(ripple);
    ripples.push(ripple);
  }

  // direction: "out" (from the core outwards) or "in" (towards the core)
  const send = (direction, sceneSeconds) => {
    RINGS_PER_WAVE.forEach((delaySeconds, ringNumber) => {
      const freeRipple = ripples.find((ripple) => !ripple.visible) ?? ripples[ringNumber];
      freeRipple.userData.startsAt = sceneSeconds + delaySeconds;
      freeRipple.userData.direction = direction;
      freeRipple.rotation.set(
        THREE.MathUtils.randFloat(-1.1, 1.1), // tilt forward / back
        THREE.MathUtils.randFloat(-1.1, 1.1), // tilt left / right
        0,
      );
      freeRipple.visible = true;
    });
  };

  const update = (sceneSeconds, sizes) => {
    ripples.forEach((ripple) => {
      if (!ripple.visible) return;
      const { startsAt, direction } = ripple.userData;
      const age = (sceneSeconds - startsAt) / RIPPLE_SECONDS; // 0 = just started, 1 = done

      if (age < 0) {
        ripple.material.opacity = 0; // waiting for its turn
        return;
      }
      if (age >= 1) {
        ripple.visible = false;
        return;
      }

      const smallest = sizes.coreRadius * 0.95;
      const largest = sizes.cloudRadius * 1.05;
      const travelled = (largest - smallest) * age;
      ripple.scale.setScalar(direction === "out" ? smallest + travelled : largest - travelled);
      ripple.material.opacity = Math.sin(age * Math.PI) * 0.55; // fade in, then out
    });
  };

  const applyColors = () => ripples.forEach((ripple) => (ripple.material.color = readColorToken("--ripple")));

  return { send, update, applyColors };
};
