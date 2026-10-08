import * as THREE from "three";
import { CLOUD_RADIUS_SHARE, CORE_RADIUS_PX } from "../settings.js";

// The stage: renderer, camera, and the sizes everything else uses.
export const createStage = (canvas) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // sharp, but not too heavy on phones

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // Sizes in scene units, recalculated whenever the window changes
  const sizes = {
    coreRadius: 1, // the big sphere in the middle
    cloudRadius: 1, // how far the outer bubbles fly
  };

  const fitToScreen = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // How much of the scene fits on screen at the core's distance from the camera
    const visibleHeight =
      2 *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.position.length();
    const visibleWidth = visibleHeight * camera.aspect;
    const sceneUnitsPerPixel = visibleHeight / height;

    // The core is sized in pixels, so the play button always fits inside it
    const coreRadiusPx = THREE.MathUtils.clamp(
      Math.min(width, height) * CORE_RADIUS_PX.preferredShare,
      CORE_RADIUS_PX.min,
      CORE_RADIUS_PX.max,
    );
    sizes.coreRadius = coreRadiusPx * sceneUnitsPerPixel;
    document.documentElement.style.setProperty(
      "--core-radius-px",
      `${coreRadiusPx}px`,
    );

    // The bubble cloud fills part of the screen, but always reaches clearly past the core
    sizes.cloudRadius = Math.max(
      Math.min(visibleWidth, visibleHeight) * CLOUD_RADIUS_SHARE,
      sizes.coreRadius * 1.9,
    );
  };

  window.addEventListener("resize", fitToScreen);
  fitToScreen();

  return { renderer, scene, camera, sizes };
};
