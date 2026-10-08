import * as THREE from "three";
import { createGlassMaterial } from "./glassMaterial.js";
import { createSoftDotTexture } from "./softDotTexture.js";
import { readColorToken } from "./colors.js";

// The big glass sphere in the middle, with a soft glow behind it.
// It swells slightly on the in-breath, like the original's grow / shrink animation.
export const createCore = (scene) => {
  const sphereMaterial = createGlassMaterial({
    bodyColor: readColorToken("--core-body"),
    rimColor: readColorToken("--bubble-rim"),
    bodyOpacity: 0.55,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), sphereMaterial);
  sphere.renderOrder = 1;
  scene.add(sphere);

  // A sprite always faces the camera, so the glow looks the same from every angle
  const glowMaterial = new THREE.SpriteMaterial({
    map: createSoftDotTexture(),
    color: readColorToken("--glow"),
    transparent: true,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.renderOrder = 0; // drawn first, behind everything
  scene.add(glow);

  const update = (breathFullness, sizes) => {
    sphere.scale.setScalar(sizes.coreRadius * (0.9 + breathFullness * 0.1));
    glow.scale.setScalar(sizes.coreRadius * (2.6 + breathFullness * 1.8));
    glowMaterial.opacity = 0.55 + breathFullness * 0.35;
  };

  const applyColors = () => {
    sphereMaterial.uniforms.bodyColor.value = readColorToken("--core-body");
    sphereMaterial.uniforms.rimColor.value = readColorToken("--bubble-rim");
    glowMaterial.color = readColorToken("--glow");
  };

  return { update, applyColors };
};
