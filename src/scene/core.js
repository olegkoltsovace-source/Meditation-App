import * as THREE from "three";
import { createGlassMaterial } from "./glassMaterial.js";
import { readColorToken } from "./colors.js";

// The big glass sphere in the middle.
// It swells slightly on the in-breath, like the original's grow / shrink animation.
export const createCore = (scene) => {
  const sphereMaterial = createGlassMaterial({
    bodyColor: readColorToken("--core-body"),
    rimColor: readColorToken("--bubble-rim"),
    bodyOpacity: 0.55,
    shineStrength: 0, // no shine spot on the core
  });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    sphereMaterial,
  );
  sphere.renderOrder = 1;
  scene.add(sphere);

  // Wobble: a quick jelly-like bounce when the bubbles burst out, fading over about a second
  const WOBBLE_SPEED = 18; // how fast it bounces back and forth
  const WOBBLE_FADE = 3.5; // how quickly it settles
  let wobbleStartedAt = -1000; // long ago, so there is no wobble at the start

  const wobble = (sceneSeconds) => {
    wobbleStartedAt = sceneSeconds;
  };

  const update = (breathFullness, sizes, sceneSeconds) => {
    const secondsSinceWobble = sceneSeconds - wobbleStartedAt;
    const wobbleAmount =
      Math.sin(secondsSinceWobble * WOBBLE_SPEED) *
      Math.exp(-secondsSinceWobble * WOBBLE_FADE) *
      0.06;

    // Squash and stretch: wider while shorter, and the other way round
    const baseScale = sizes.coreRadius * (0.9 + breathFullness * 0.1);
    sphere.scale.set(
      baseScale * (1 + wobbleAmount),
      baseScale * (1 - wobbleAmount),
      baseScale * (1 + wobbleAmount),
    );
  };

  const applyColors = () => {
    sphereMaterial.uniforms.bodyColor.value = readColorToken("--core-body");
    sphereMaterial.uniforms.rimColor.value = readColorToken("--bubble-rim");
  };

  return { update, wobble, applyColors };
};
