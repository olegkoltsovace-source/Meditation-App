# Bubble Breath

A 3D breathing guide built with Three.js. Glass bubbles fly out of the core into a sphere as you breathe in and come home as you breathe out, while ripple rings and a soft soundscape follow your breath. Drag to turn the scene.

It's a rebuild of a CSS meditation app I made before AI tools: the same idea, now in real 3D.

## Features

- **Three breathing patterns:** Calm (4 · 4, the original rhythm), Box (4 · 4 · 4 · 4) and 4-7-8
- **Generated soundscapes:** soft chords made with the Web Audio API, so no audio files are needed. The sound opens up as you breathe in.
- **Drag to rotate**, with a gentle glide after you let go
- **Light and dark mode**, following your system setting
- **Works on phones**, and respects "reduce motion"

## Tech

- [Three.js](https://threejs.org/): custom glass shader (fresnel), Fibonacci-sphere bubble layout, OrbitControls
- Web Audio API for the sound
- [Vite](https://vitejs.dev/) for development and building
- Plain JavaScript, no framework

## Run it

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Where things are

| File | What it does |
| --- | --- |
| `src/settings.js` | All the numbers to tweak: patterns, soundscapes, sizes, speeds |
| `src/main.js` | Wires everything together: state, buttons, animation loop |
| `src/breathing.js` | The breathing timeline (which phase, how full the lungs are) |
| `src/soundscape.js` | The generated sound |
| `src/scene/createStage.js` | Renderer, camera, drag-to-rotate, screen sizing |
| `src/scene/core.js` | The glass sphere in the middle and its glow |
| `src/scene/bubbleCloud.js` | The bubbles and how they fly out and back |
| `src/scene/ripples.js` | The tilted rings that flow in and out |
| `src/scene/dust.js` | Floating specks that give the space depth |
| `src/scene/glassMaterial.js` | The glass / soap-bubble shader |
