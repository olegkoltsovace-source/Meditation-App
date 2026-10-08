import * as THREE from "three";
import { createSoftDotTexture } from "./softDotTexture.js";
import { readColorToken } from "./colors.js";
import { DUST_PARTICLE_COUNT } from "../settings.js";

// Hundreds of tiny specks floating in a large sphere around everything.
// Near specks move faster across the screen than far ones when the scene turns,
// which is what makes the space feel deep.
export const createDust = (scene) => {
  const positions = new Float32Array(DUST_PARTICLE_COUNT * 3);
  for (let particleIndex = 0; particleIndex < DUST_PARTICLE_COUNT; particleIndex++) {
    // a random point inside a sphere of radius 1 (cube root keeps them evenly spread, not bunched in the middle)
    const direction = new THREE.Vector3().randomDirection();
    const distance = 0.35 + Math.cbrt(Math.random()) * 0.65;
    positions.set([direction.x * distance, direction.y * distance, direction.z * distance], particleIndex * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    map: createSoftDotTexture(),
    color: readColorToken("--dust"),
    size: 0.09,
    sizeAttenuation: true, // far specks look smaller
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  const dust = new THREE.Points(geometry, material);
  scene.add(dust);

  const update = (breathFullness, secondsSinceLastFrame, sizes) => {
    // the dust cloud breathes a little too, and drifts slowly the other way round
    dust.scale.setScalar(sizes.cloudRadius * 2.2 * (1 + breathFullness * 0.06));
    dust.rotation.y -= secondsSinceLastFrame * 0.02;
  };

  const applyColors = () => (material.color = readColorToken("--dust"));

  return { update, applyColors };
};
