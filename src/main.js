import * as THREE from "three";
import "./style.css";
import { BREATHING_PATTERNS, PHASE_WORDS, SOUNDSCAPES, CLOUD_SPIN_SPEED, CLOUD_TILT } from "./settings.js";
import { findCurrentStep, breathFullness as fullnessAt } from "./breathing.js";
import { createSoundscapePlayer } from "./soundscape.js";
import { createStage } from "./scene/createStage.js";
import { createCore } from "./scene/core.js";
import { createBubbleCloud } from "./scene/bubbleCloud.js";
import { createRipples } from "./scene/ripples.js";
import { createDust } from "./scene/dust.js";
import { onThemeChange } from "./scene/colors.js";

// ───────────────────────────────────────────────────────────
// Page elements
// ───────────────────────────────────────────────────────────
const sceneCanvas = document.getElementById("scene");
const playButton = document.getElementById("playButton");
const playIconPath = document.getElementById("playIconPath");
const previousSoundButton = document.getElementById("previousSoundButton");
const nextSoundButton = document.getElementById("nextSoundButton");
const breathWord = document.getElementById("breathWord");
const breathDetail = document.getElementById("breathDetail");
const sessionStats = document.getElementById("sessionStats");
const patternPicker = document.getElementById("patternPicker");

const PLAY_ICON = "M7 4.5v15l12-7.5z";
const PAUSE_ICON = "M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ───────────────────────────────────────────────────────────
// State
// ───────────────────────────────────────────────────────────
let isPlaying = false;
let activePatternIndex = 0;
let activeSoundscapeIndex = 0;
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
  message.textContent = "This browser can't show 3D graphics (WebGL is turned off or unsupported).";
  document.body.appendChild(message);
  throw error;
}
const { renderer, scene, camera, controls, sizes } = stage;

// The bubbles and ripples turn together as one cloud; the core sits still in the middle
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const core = createCore(scene);
const bubbleCloud = createBubbleCloud(cloudGroup);
const ripples = createRipples(cloudGroup);
const dust = createDust(scene);
const soundscapePlayer = createSoundscapePlayer();

onThemeChange(() => [core, bubbleCloud, ripples, dust].forEach((part) => part.applyColors()));

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

const currentSoundscapeName = () => SOUNDSCAPES[activeSoundscapeIndex].name;

const updateBreathing = (secondsSinceLastFrame) => {
  if (!isPlaying) {
    // Idle: the core breathes gently on its own and the bubbles stay home
    breathFullness = 0.06 + Math.sin(sceneSeconds * 0.8) * 0.04;
    return;
  }

  secondsIntoSession += secondsSinceLastFrame;
  const { step, stepIndex, progress, secondsLeft } = findCurrentStep(
    BREATHING_PATTERNS[activePatternIndex],
    secondsIntoSession,
  );
  breathFullness = fullnessAt(step.phase, progress);

  // A new phase just started
  if (stepIndex !== lastStepIndex) {
    if (step.phase === "inhale") {
      if (!prefersReducedMotion) ripples.send("in", sceneSeconds);
      if (lastStepIndex !== -1) completedBreaths++; // a full breath ends when the next one begins
    }
    if (step.phase === "exhale" && !prefersReducedMotion) ripples.send("out", sceneSeconds);
    lastStepIndex = stepIndex;
  }

  showBreathWord(PHASE_WORDS[step.phase]);
  breathDetail.textContent = `${Math.ceil(secondsLeft)} · Soundscape: ${currentSoundscapeName()}`;
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
    const spinSpeed = isPlaying ? CLOUD_SPIN_SPEED.playing : CLOUD_SPIN_SPEED.idle;
    cloudGroup.rotation.y += spinSpeed * secondsSinceLastFrame;
    cloudGroup.rotation.x = Math.sin(sceneSeconds * 0.25) * CLOUD_TILT;
  }

  core.update(breathFullness, sizes);
  bubbleCloud.update(breathFullness, sceneSeconds, sizes, !prefersReducedMotion);
  ripples.update(sceneSeconds, sizes);
  dust.update(breathFullness, secondsSinceLastFrame, sizes);

  controls.update(); // applies the glide after a drag
  renderer.render(scene, camera);
};

// ───────────────────────────────────────────────────────────
// Buttons
// ───────────────────────────────────────────────────────────
const setPlaying = (shouldPlay) => {
  isPlaying = shouldPlay;
  playIconPath.setAttribute("d", shouldPlay ? PAUSE_ICON : PLAY_ICON);
  playButton.setAttribute("aria-label", shouldPlay ? "Pause" : "Start breathing");

  if (shouldPlay) {
    soundscapePlayer.play(SOUNDSCAPES[activeSoundscapeIndex]);
  } else {
    soundscapePlayer.stop();
    showBreathWord("Paused");
  }
};

playButton.addEventListener("click", () => setPlaying(!isPlaying));

// -1 = previous, +1 = next (wraps around)
const switchSoundscape = (step) => {
  activeSoundscapeIndex = (activeSoundscapeIndex + step + SOUNDSCAPES.length) % SOUNDSCAPES.length;
  breathDetail.textContent = `Soundscape: ${currentSoundscapeName()}`;
  if (isPlaying) soundscapePlayer.play(SOUNDSCAPES[activeSoundscapeIndex]); // cross-fades
};

previousSoundButton.addEventListener("click", () => switchSoundscape(-1));
nextSoundButton.addEventListener("click", () => switchSoundscape(1));

// Pattern picker: one chip per pattern, with its timing on the small line
const patternChips = BREATHING_PATTERNS.map((pattern, patternIndex) => {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "pattern";
  chip.id = `pattern-${patternIndex}`;
  chip.setAttribute("role", "radio");
  chip.setAttribute("aria-checked", String(patternIndex === activePatternIndex));

  const timing = pattern.steps.map((step) => step.seconds).join(" · ");
  chip.innerHTML = `<span>${pattern.name}</span><small>${timing} s</small>`;

  chip.addEventListener("click", () => {
    activePatternIndex = patternIndex;
    secondsIntoSession = 0; // start the new pattern with an in-breath
    completedBreaths = 0;
    lastStepIndex = -1;
    patternChips.forEach((otherChip, otherIndex) =>
      otherChip.setAttribute("aria-checked", String(otherIndex === patternIndex)),
    );
  });

  patternPicker.appendChild(chip);
  return chip;
});

// Space bar = play / pause
window.addEventListener("keydown", (keyboardEvent) => {
  if (keyboardEvent.code === "Space" && document.activeElement === document.body) {
    keyboardEvent.preventDefault();
    setPlaying(!isPlaying);
  }
});

renderer.setAnimationLoop(animate);
