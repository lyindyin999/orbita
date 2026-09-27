# ORBITA

A cinematic interactive 3D Solar System built for the web.

## Concept

ORBITA is an experimental space atlas: fly through a stylized Solar System, select planets, and inspect real physical parameters without leaving the 3D scene.

Planetary distances and radii are intentionally compressed for navigation. The data panel uses NASA/JPL values.

## Features

- Interactive Three.js scene
- Eight planets and the Sun
- Orbit visualization
- Cinematic star field and space dust
- Planet fly-to navigation
- Free movement with WASD + vertical controls
- Mouse orbit / zoom
- Planetary data panel
- Optional constellation guide layer
- Responsive HUD

## Stack

- Next.js 16
- React 19
- TypeScript
- Three.js
- React Three Fiber
- Drei

## Run

```bash
git clone https://github.com/lyindyin999/orbita.git
cd orbita
npm install
npm run dev
```

Open http://localhost:3000

## Controls

- **W A S D** — move
- **Q / E** — down / up
- **Shift** — boost
- **Drag** — rotate view
- **Scroll** — zoom
- **Click a planet** — cinematic focus

## Data

Planetary physical parameters are based on NASA/JPL Solar System Dynamics planetary tables and NASA Solar System material.

## License

MIT
