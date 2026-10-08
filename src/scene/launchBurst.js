import * as THREE from "three";
import { createGlassMaterial } from "./glassMaterial.js";
import { readColorToken } from "./colors.js";

const SHOCKWAVE_SECONDS = 1.6; // how long the glass shell takes to expand and vanish
const HALO_SECONDS = 1.2; // how long each ring around the core lasts
const HALO_DELAYS = [0, 0.18, 0.36]; // three rings, one after another (like the original's ring, ring2, ring3)

// The burst when the bubbles break out of the core:
//  1. a thin glass shell that expands from the core and fades (a shockwave)
//  2. three rings around the core that always face you, flashing outwards like in the original app
export const createLaunchBurst = (scene, camera) => {
  // 1. Shockwave: nearly clear in the middle, so mostly its glowing edge shows
  const shockwaveMaterial = createGlassMaterial({
    bodyColor: readColorToken("--bubble-body"),
    rimColor: readColorToken("--bubble-rim"),
    bodyOpacity: 0.04,
  });
  const shockwave = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 48),
    shockwaveMaterial,
  );
  shockwave.renderOrder = 2;
  shockwave.visible = false;
  scene.add(shockwave);

  // 2. Halo rings
  const haloShape = new THREE.RingGeometry(0.94, 1, 128);
  const halos = HALO_DELAYS.map(() => {
    const material = new THREE.MeshBasicMaterial({
      color: readColorToken("--ripple"),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloShape, material);
    halo.renderOrder = 3; // drawn over the core, like the rings around the original play button
    halo.visible = false;
    scene.add(halo);
    return halo;
  });

  let burstStartedAt = -Infinity; // scene time of the last burst

  const fire = (sceneSeconds) => {
    burstStartedAt = sceneSeconds;
    shockwave.visible = true;
    halos.forEach((halo) => (halo.visible = true));
  };

  const update = (sceneSeconds, sizes) => {
    const secondsSinceBurst = sceneSeconds - burstStartedAt;

    // Shockwave: grows from the core to just past the bubble cloud, fading as it goes
    const shockwaveAge = secondsSinceBurst / SHOCKWAVE_SECONDS; // 0 … 1
    if (shockwave.visible) {
      if (shockwaveAge >= 1) {
        shockwave.visible = false;
      } else {
        const easedAge = 1 - Math.pow(1 - shockwaveAge, 3); // fast start, slow finish
        const radius =
          sizes.coreRadius +
          (sizes.cloudRadius * 1.15 - sizes.coreRadius) * easedAge;
        shockwave.scale.setScalar(radius);
        shockwaveMaterial.uniforms.opacity.value = (1 - shockwaveAge) * 0.9;
      }
    }

    // Halos: always turned towards the camera, so they stay round however the scene is rotated
    halos.forEach((halo, haloIndex) => {
      if (!halo.visible) return;
      const haloAge =
        (secondsSinceBurst - HALO_DELAYS[haloIndex]) / HALO_SECONDS;
      if (haloAge < 0) {
        halo.material.opacity = 0;
        return;
      }
      if (haloAge >= 1) {
        halo.visible = false;
        return;
      }
      halo.quaternion.copy(camera.quaternion);
      halo.scale.setScalar(sizes.coreRadius * (1 + haloAge * 1.6));
      halo.material.opacity = (1 - haloAge) * 0.85;
    });
  };

  const applyColors = () => {
    shockwaveMaterial.uniforms.bodyColor.value =
      readColorToken("--bubble-body");
    shockwaveMaterial.uniforms.rimColor.value = readColorToken("--bubble-rim");
    halos.forEach((halo) => (halo.material.color = readColorToken("--ripple")));
  };

  return { fire, update, applyColors };
};
