# Interactive Particle Earth

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A realistic particle-earth visual system built on **Three.js**. The planet's
particles morph in real time according to **MediaPipe hand-gesture recognition**,
delivering an immersive, fully static experience with zero external requests.

## Features

- 🌍 **Realistic earth** — built from Natural Earth 1:10m vector data
  (world-atlas TopoJSON), not a texture-mapped sphere
- ✋ **Gesture-driven** — MediaPipe GestureRecognizer tracks palm landmarks and
  maps them to the planet's shape in real time
- 🎨 **Live morphing** — seven gestures: Open_Palm / Closed_Fist / Pointing_Up /
  Thumb_Up / Thumb_Down / Victory / ILoveYou
- 🚀 **High performance** — 2048×1024 particle canvas, d3-geo projection,
  three.js r160 + UnrealBloom glow
- 📱 **Mobile-friendly** — gesture, touch and mouse input all supported

## Live demo

- Static site: https://sitong-zhang.github.io/particle-earth/

## Run locally

```bash
python3 -m http.server 8000
```

> A local HTTP server is required (`file://` is blocked by CORS).
> Then open http://localhost:8000/.

## Tech stack

| Area | Technology |
| --- | --- |
| 3D rendering | Three.js r160 + custom GLSL shaders + OrbitControls + EffectComposer/UnrealBloomPass |
| Geo data | TopoJSON (Natural Earth 1:10m, 3 MB) + d3-geo projection |
| Gesture recognition | MediaPipe GestureRecognizer (in-browser bundle + task + wasm) |
| Particles | Canvas particles + geographic mapping + color/height morphing |
| PWA | Service Worker offline cache (CACHE = zjt-earth-v8) |

## Project layout

```
index.html        Main page (HTML + CSS + gesture module + particle system)
sw.js             Service Worker: CACHE = zjt-earth-v8
README.md         This document
vendor/
  land-10m.json    Natural Earth 1:10m TopoJSON (3.0 MB)
  topojson-client.min.js   TopoJSON → GeoJSON
  d3-geo.min.js            Projections (render/base)
  d3-array.min.js          d3-geo dependency
  three/                   three.js r160 + OrbitControls + post-processing
  mediapipe/               GestureRecognizer for browser (bundle + task + wasm×2)
  gesture-icons/           Twemoji gesture SVGs (270b/270a/270c/1f44d/1f44e/261d/1f91f/1f590)
```

---

> Roadmap: more gesture shapes, flowing ocean particles, additional themes.
