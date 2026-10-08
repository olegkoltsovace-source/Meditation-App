import * as THREE from "three";
import "./style.css";
import {
  BREATHING_PATTERN,
  PHASE_WORDS,
  SOUNDSCAPE_NOTES,
  CLOUD_SPIN_SPEED,
  CLOUD_TILT,
} from "./settings.js";
import { findCurrentStep, breathFullness as fullnessAt } from "./breathing.js";
import { createSoundscapePlayer } from "./soundscape.js";
import { createStage } from "./scene/createStage.js";
import { createCore } from "./scene/core.js";
import { createBubbleCloud } from "./scene/bubbleCloud.js";
import { createRipples } from "./scene/ripples.js";
import { createDust } from "./scene/dust.js";
import { createLaunchBurst } from "./scene/launchBurst.js";
import { createSurfaceSplashes } from "./scene/surfaceSplashes.js";
import { onThemeChange } from "./scene/colors.js";

// ───────────────────────────────────────────────────────────
// Page elements
// ───────────────────────────────────────────────────────────
const sceneCanvas = document.getElementById("scene");
const playButton = document.getElementById("playButton");
const playIconPath = document.getElementById("playIconPath");
const breathWord = document.getElementById("breathWord");
const breathDetail = document.getElementById("breathDetail");
const sessionStats = document.getElementById("sessionStats");

const PLAY_ICON = "M7 4.5v15l12-7.5z";
const PAUSE_ICON = "M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ───────────────────────────────────────────────────────────
// State
// ───────────────────────────────────────────────────────────
let isPlaying = false;
let secondsIntoSession = 0; // only counts while playing
let completedBreaths = 0;
let lastStepIndex = -1; // to notice when a new phase starts
let breathFullness = 0; // 0 = lungs empty, 1 = lungs full; drives the whole scene
let sceneSeconds = 0; // a clock that always runs (idle motion, ripples)

// ───────────────────────────────────────────────────────────
// 3D scene
// ───────────────────────────────────────────────────────────
let stage;
try {
  stage = createStage(sceneCanvas);
} catch (error) {
  const message = document.createElement("p");
  message.className = "webgl-missing";
  message.textContent =
    "This browser can't show 3D graphics (WebGL is turned off or unsupported).";
  document.body.appendChild(message);
  throw error;
}
const { renderer, scene, camera, sizes } = stage;

// The bubbles and ripples turn together as one cloud; the core sits still in the middle
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const core = createCore(scene);
const bubbleCloud = createBubbleCloud(cloudGroup);
const ripples = createRipples(cloudGroup);
const dust = createDust(scene);
const launchBurst = createLaunchBurst(scene, camera);
const surfaceSplashes = createSurfaceSplashes(cloudGroup);
const soundscapePlayer = createSoundscapePlayer();

onThemeChange(() =>
  [core, bubbleCloud, ripples, dust, launchBurst, surfaceSplashes].forEach(
    (part) => part.applyColors(),
  ),
);

// ───────────────────────────────────────────────────────────
// Breathing
// ───────────────────────────────────────────────────────────
const showBreathWord = (text) => {
  if (breathWord.textContent === text) return;
  breathWord.classList.add("changing"); // fade out…
  setTimeout(() => {
    breathWord.textContent = text;
    breathWord.classList.remove("changing"); // …and back in with the new word
  }, 250);
};

const formatMinutesAndSeconds = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const updateBreathing = (secondsSinceLastFrame) => {
  if (!isPlaying) {
    // Idle: the core breathes gently on its own and the bubbles stay home
    breathFullness = 0.06 + Math.sin(sceneSeconds * 0.8) * 0.04;
    return;
  }

  secondsIntoSession += secondsSinceLastFrame;
  const { step, stepIndex, progress, secondsLeft } = findCurrentStep(
    BREATHING_PATTERN,
    secondsIntoSession,
  );
  breathFullness = fullnessAt(step.phase, progress);

  // A new phase just started
  if (stepIndex !== lastStepIndex) {
    if (step.phase === "inhale") {
      // The bubbles are about to burst out: shockwave, halo rings, a wobble, and orbit rings flowing out
      if (!prefersReducedMotion) {
        launchBurst.fire(sceneSeconds);
        core.wobble(sceneSeconds);
        ripples.send("out", sceneSeconds);
      }
      if (lastStepIndex !== -1) completedBreaths++; // a full breath ends when the next one begins
    }
    // The bubbles are coming home: orbit rings flow back into the core
    if (step.phase === "exhale" && !prefersReducedMotion)
      ripples.send("in", sceneSeconds);
    lastStepIndex = stepIndex;
  }

  showBreathWord(PHASE_WORDS[step.phase]);
  breathDetail.textContent = String(Math.ceil(secondsLeft)); // countdown to the next phase
  const breathsLabel = completedBreaths === 1 ? "breath" : "breaths";
  sessionStats.textContent = `${completedBreaths} ${breathsLabel} · ${formatMinutesAndSeconds(secondsIntoSession)}`;
};

// ───────────────────────────────────────────────────────────
// Animation loop (once per screen refresh)
// ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();

const animate = () => {
  const secondsSinceLastFrame = Math.min(clock.getDelta(), 0.1); // a hidden tab doesn't jump ahead
  sceneSeconds += secondsSinceLastFrame;

  updateBreathing(secondsSinceLastFrame);
  soundscapePlayer.followBreath(breathFullness);

  // The cloud spins around the vertical axis and slowly rocks forward and back
  if (!prefersReducedMotion) {
    const spinSpeed = isPlaying
      ? CLOUD_SPIN_SPEED.playing
      : CLOUD_SPIN_SPEED.idle;
    cloudGroup.rotation.y += spinSpeed * secondsSinceLastFrame;
    cloudGroup.rotation.x = Math.sin(sceneSeconds * 0.25) * CLOUD_TILT;
  }

  core.update(breathFullness, sizes, sceneSeconds);

  // A splash on the core's surface wherever a bubble breaks out or lands back
  const { leftThisFrame, landedThisFrame } = bubbleCloud.update(
    breathFullness,
    sceneSeconds,
    sizes,
    !prefersReducedMotion,
  );
  if (!prefersReducedMotion) {
    [...leftThisFrame, ...landedThisFrame].forEach((direction) =>
      surfaceSplashes.splashAt(direction, sceneSeconds),
    );
  }

  ripples.update(sceneSeconds, sizes);
  launchBurst.update(sceneSeconds, sizes);
  surfaceSplashes.update(sceneSeconds, sizes);
  dust.update(breathFullness, secondsSinceLastFrame, sizes);

  renderer.render(scene, camera);
};

// ───────────────────────────────────────────────────────────
// Buttons
// ───────────────────────────────────────────────────────────
const setPlaying = (shouldPlay) => {
  isPlaying = shouldPlay;
  playIconPath.setAttribute("d", shouldPlay ? PAUSE_ICON : PLAY_ICON);
  playButton.setAttribute(
    "aria-label",
    shouldPlay ? "Pause" : "Start breathing",
  );

  if (shouldPlay) {
    soundscapePlayer.play(SOUNDSCAPE_NOTES);
  } else {
    soundscapePlayer.stop();
    showBreathWord("Paused");
  }
};

playButton.addEventListener("click", () => setPlaying(!isPlaying));

// Space bar = play / pause
window.addEventListener("keydown", (keyboardEvent) => {
  if (
    keyboardEvent.code === "Space" &&
    document.activeElement === document.body
  ) {
    keyboardEvent.preventDefault();
    setPlaying(!isPlaying);
  }
});

renderer.setAnimationLoop(animate);
