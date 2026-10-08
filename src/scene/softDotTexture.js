import * as THREE from "three";

// A white dot that fades out towards its edge. Used for the glow behind the core
// and for the floating dust. Drawn once on a small canvas.
export const createSoftDotTexture = () => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const painter = canvas.getContext("2d");
  const gradient = painter.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  painter.fillStyle = gradient;
  painter.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
};
