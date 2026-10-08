// All the numbers you might want to tweak, in one place.

// Each pattern is a list of steps:
//   "inhale" – lungs fill, bubbles fly out
//   "hold"   – lungs stay full
//   "exhale" – lungs empty, bubbles come home
//   "rest"   – lungs stay empty
export const BREATHING_PATTERNS = [
  {
    name: "Calm", // the original app's rhythm
    steps: [
      { phase: "inhale", seconds: 4 },
      { phase: "exhale", seconds: 4 },
    ],
  },
  {
    name: "Box",
    steps: [
      { phase: "inhale", seconds: 4 },
      { phase: "hold", seconds: 4 },
      { phase: "exhale", seconds: 4 },
      { phase: "rest", seconds: 4 },
    ],
  },
  {
    name: "4-7-8",
    steps: [
      { phase: "inhale", seconds: 4 },
      { phase: "hold", seconds: 7 },
      { phase: "exhale", seconds: 8 },
    ],
  },
];

export const PHASE_WORDS = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  rest: "Rest",
};

// Soundscapes: soft chords made in the browser (no audio files needed).
// The numbers are note frequencies in Hz.
export const SOUNDSCAPES = [
  { name: "Lagoon", notes: [110.0, 164.81, 220.0, 277.18, 329.63] }, // A major, open
  { name: "Drift", notes: [73.42, 110.0, 146.83, 174.61, 220.0] }, // D minor, warm
  { name: "Deep", notes: [55.0, 82.41, 110.0, 130.81, 164.81] }, // low A minor drone
];
export const SOUND_VOLUME = 0.16; // overall loudness (0–1)
export const SOUND_FADE_SECONDS = 1.5;

// Bubbles fly out in three shells around the core, like the original's three waves.
// distanceShare: how far out the shell sits (1 = the full cloud radius)
// startDelay: how late this shell leaves, as a share of the in-breath
export const BUBBLE_SHELLS = [
  { bubbleCount: 14, distanceShare: 0.6, startDelay: 0 },
  { bubbleCount: 16, distanceShare: 0.8, startDelay: 0.12 },
  { bubbleCount: 18, distanceShare: 1.0, startDelay: 0.24 },
];

export const CLOUD_RADIUS_SHARE = 0.36; // the outer shell reaches 36% of the smaller screen side
export const CORE_RADIUS_PX = { min: 92, preferredShare: 0.15, max: 130 }; // the core's size on screen
export const BUBBLE_SIZE_SHARE = 0.075; // bubble size relative to the cloud radius

export const CLOUD_SPIN_SPEED = { playing: 0.22, idle: 0.05 }; // radians per second around the vertical axis
export const CLOUD_TILT = 0.35; // how far the cloud rocks forward and back (radians)
export const DUST_PARTICLE_COUNT = 400; // tiny specks floating around, for depth
