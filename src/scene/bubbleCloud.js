import * as THREE from "three";
import { createGlassMaterial } from "./glassMaterial.js";
import { readColorToken } from "./colors.js";
import { BUBBLE_SHELLS, BUBBLE_SIZE_SHARE } from "../settings.js";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 137.5°, spreads points evenly

// Evenly spread directions over a sphere (the "Fibonacci sphere").
// Like seeds in a sunflower: each point turns by the golden angle and moves down a little.
const spreadDirectionsOverSphere = (count, turnOffset) => {
  const directions = [];
  for (let pointIndex = 0; pointIndex < count; pointIndex++) {
    const height = 1 - ((pointIndex + 0.5) / count) * 2; // from top (1) to bottom (-1)
    const radiusAtHeight = Math.sqrt(1 - height * height);
    const angle = pointIndex * GOLDEN_ANGLE + turnOffset;
    directions.push(new THREE.Vector3(Math.cos(angle) * radiusAtHeight, height, Math.sin(angle) * radiusAtHeight));
  }
  return directions;
};

const smoothInOut = (value) => value * value * (3 - 2 * value);

// The bubbles: they wait inside the core, fly out into three shells around it on the in-breath,
// and come home on the out-breath.
export const createBubbleCloud = (parentGroup) => {
  const sphereShape = new THREE.SphereGeometry(1, 32, 24);
  const bubbles = [];

  BUBBLE_SHELLS.forEach((shell, shellIndex) => {
    const directions = spreadDirectionsOverSphere(shell.bubbleCount, shellIndex * 0.9);
    directions.forEach((direction, bubbleIndex) => {
      const material = createGlassMaterial({
        bodyColor: readColorToken("--bubble-body"),
        rimColor: readColorToken("--bubble-rim"),
        bodyOpacity: 0.32,
      });
      const bubble = new THREE.Mesh(sphereShape, material);
      bubble.renderOrder = 1; // sorted by distance together with the core
      bubble.userData = {
        direction,
        distanceShare: shell.distanceShare,
        startDelay: shell.startDelay,
        sizeShare: 0.85 + ((bubbleIndex * 7 + shellIndex * 3) % 5) * 0.06, // a little size variety
        bobOffset: Math.random() * Math.PI * 2, // so they don't all bob in sync
      };
      parentGroup.add(bubble);
      bubbles.push(bubble);
    });
  });

  // breathFullness: 0 = lungs empty, 1 = lungs full
  const update = (breathFullness, sceneSeconds, sizes, allowBobbing) => {
    const homeDistance = sizes.coreRadius * 0.4; // tucked inside the core

    bubbles.forEach((bubble) => {
      const { direction, distanceShare, startDelay, sizeShare, bobOffset } = bubble.userData;

      // Each shell starts a bit later than the one inside it, then catches up
      const ownProgress = smoothInOut(THREE.MathUtils.clamp((breathFullness - startDelay) / (1 - startDelay), 0, 1));

      const farthestDistance = sizes.cloudRadius * distanceShare;
      const bob = allowBobbing ? Math.sin(sceneSeconds * 1.1 + bobOffset) * sizes.coreRadius * 0.05 * ownProgress : 0;
      const distance = homeDistance + (farthestDistance - homeDistance) * ownProgress + bob;
      bubble.position.copy(direction).multiplyScalar(distance);

      // Grows on the way out (the original went from 30% to 150%)
      bubble.scale.setScalar(sizes.cloudRadius * BUBBLE_SIZE_SHARE * sizeShare * (0.3 + ownProgress * 0.7));

      // Invisible while tucked inside the core, fully visible once out
      bubble.material.uniforms.opacity.value = THREE.MathUtils.clamp((ownProgress - 0.05) * 3, 0, 1);
      bubble.visible = ownProgress > 0.02;
    });
  };

  const applyColors = () => {
    bubbles.forEach((bubble) => {
      bubble.material.uniforms.bodyColor.value = readColorToken("--bubble-body");
      bubble.material.uniforms.rimColor.value = readColorToken("--bubble-rim");
    });
  };

  return { update, applyColors };
};
