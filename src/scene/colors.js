import * as THREE from "three";

// The scene's colours live in style.css as CSS variables (--bubble-body, --glow, …),
// so light and dark mode are defined in one place.

export const readColorToken = (tokenName) =>
  new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim());

// Calls `applyColors` whenever the system switches between light and dark mode
export const onThemeChange = (applyColors) => {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyColors);
};
