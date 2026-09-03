# QuantumConfusion — Code Review Findings (2026-08-31)

Reviewed: `src/App.tsx` (3,575 lines), `src/components/*`, `src/audio.ts`, configs, repo layout.
This document is the evidence base for `MASTER_SPEC.md` and `JULES_PLAN.md`.

## A. Why the game stutters (root causes, in order of impact)

### A1. The entire App re-renders 30–60 times per second — this is the #1 problem
- `FusionSwarmScene` dispatches a `fusion-update` CustomEvent every 2nd frame
  (`src/App.tsx:1469`). App listens and calls `setFusionMetrics` (`src/App.tsx:2949`).
  **`fusionMetrics` is never rendered anywhere.** Result: the 3,575-line App component
  re-renders ~30×/sec at all times, even when idle. Every re-render re-reconciles the
  entire HUD DOM tree and the whole R3F scene graph.
- `InteractiveLocus` calls `onPointerMove` every frame ("heartbeat", `src/App.tsx:1185`).
  The guard in `handlePointerLocus` (`src/App.tsx:3026`) passes whenever `moveVel`
  changes by >0.12 — which is nearly every frame while the player moves. So during
  movement, App re-renders at up to 60 Hz on top of the 30 Hz above.
- The 200 ms game-logic `setInterval` (`src/App.tsx:2078`) does 2+ root setStates per
  tick, and its dependency array includes `locusData.*`, `voidHazards`, and
  `playerStats.combo`, so the interval is torn down and recreated almost continuously.
  Same for the spawn interval (`src/App.tsx:2189`, depends on `combo`).

### A2. Load-bearing accident: the game only works BECAUSE of the re-render storm
`CyberItemsAndHazards` mutates `item.position` / `hazard.position` arrays in place
inside `useFrame` and relies on React re-renders (caused by A1) to push those values
into the `<group position={...}>` props. **If you fix A1 naively, items/hazards/gates
freeze in place.** Any fix must move entity transforms to imperative updates
(refs / instanced meshes written in `useFrame`), not React props.

### A3. setState inside useFrame / per-frame React work
- `SolidObjectItem` calls `setShockwaves` every frame while any shockwave is alive
  (`src/App.tsx:408-414`) → per-frame re-render of each object, each spawning
  `<Ring>`, `<Torus>`, and a 18-count `Sparkles` per shockwave.
- `ShatterDebris` traverses 16 fragment groups per frame and mutates material
  opacity via `traverse()` (`src/App.tsx:228`).
- Durability/health handled via `useState` per object; collisions fire
  `setTimeout(0)` + multiple sounds + haptics + state updates per contact event.

### A4. Physics engine misuse
Rapier is used, but the orbit mechanics **teleport dynamic bodies with
`setTranslation()` every frame** (`src/App.tsx:485`, `551`) — fighting the solver,
paying WASM bridge cost per body per frame, and producing none of the benefits of
a physics engine. Almost all gameplay-relevant motion (player, orbits, items,
hazards, gates) is already hand-rolled kinematics on the XZ plane. Rapier is
effectively only providing gravity + ground bounce for ~6 solid objects.

### A5. GPU/draw-call load
- `FractalSingularity` alone renders ~51 meshes plus seven pre-allocated
  3–5k-point line geometries, with per-frame HSL material writes across dozens of
  materials. All 9 sector vortex layers are mounted (they do return `null` when
  inactive, which is good, but the always-on base layer is heavy).
- Heavy transparent overdraw: layered rings, shield bubble + wireframe + 2 rings,
  2 full-arena `gridHelper`s, 4+ point lights, `meshStandardMaterial` everywhere
  (per-pixel lighting on mobile GPUs).
- Emergency mitigations already in place (good): `dpr=[1,1.1]`, `antialias:false`,
  `shadows={false}`, EffectComposer disabled. Note: `castShadow`/`shadow-mapSize`
  props remain scattered around but are dead config since shadows are off.

### A6. Audio churn
- `playSpinningObjectWobble` fires per object up to every 110 ms; each call builds
  new oscillator/filter graphs. `updatePullDrone` is called every physics frame.
  Voice cap (6) exists, which is good; the construction rate is still high for
  Android WebView.

### A7. Bundle bloat (3.3 MB single JS chunk in dist/)
- Unused runtime deps: `matter-js`, `@google/genai`, `express`, `dotenv`
  (zero imports in `src/` or `index.html`).
- `@react-three/postprocessing` imported in App but the composer is disabled —
  still bundled.
- All modals, all 9 vortex components, lore, leaderboard, vault are eagerly bundled.
- `dist/` is committed to git.

## B. Bugs and dead code

1. **`handleAdvanceToNextSector` runs its entire body twice** — once inside a
   1200 ms `setTimeout` and once synchronously right after (`src/App.tsx:2664-2777`).
   Sector state, item/hazard/gate arrays are set twice; the "warp" animation is
   defeated because state resets immediately.
2. **`handleMotion` references `setGravityTilt`, which does not exist in App**
   (`src/App.tsx:2935-2946`). It's never registered as a listener, so it never
   crashes — pure dead code, along with the unused `keys`/`frameId` in that effect.
3. **`warpActive` FOV does nothing**: R3F's `camera` prop is initial-only, and
   `ResponsiveCameraRig` lerps FOV every frame anyway (`src/App.tsx:3134`).
4. **Side effects inside setState updaters**: `addScoreAndXP` calls
   `setSectorProgress`, `triggerFloatingText`, `soundEngine.*` inside the
   `setPlayerStats` updater (`src/App.tsx:2270-2375`). Updaters must be pure;
   this double-fires in StrictMode and makes logic untestable.
5. **`fractalMode` state is never set** (no `setFractalMode` caller) — the mode is
   derived from `sectorLevel` inline at `src/App.tsx:3143`.
6. **`ComboMultiplierHUD.tsx` is never imported** (unused component).
7. **`handleHazardHit` bypasses the scoring pipeline** — writes `score`/`highScore`
   directly without combo/multiplier logic and without persisting high score.
8. Seeded fake leaderboard entries (`INITIAL_LEADERBOARD`) present as real scores.

## C. Unused / stray artifacts in the repo

- `z/` — a full duplicate project (own package.json, lockfiles).
- `temp/nexus/` — abandoned Kotlin/Gradle experiment.
- `z_diff.patch`, `README 2.md`, `.artifacts/` (screenshots), `scratch/`,
  `dist/` — none belong in git history for a clean handoff.
- `README.md` is the AI Studio boilerplate (references a Gemini API key the app
  never uses).

## D. What is genuinely good (keep)

- The orbital slingshot concept and the 4-subsystem → shield-drop machine design.
- Zero-asset synthesized audio engine with voice cap and gain pool.
- `Joystick.tsx` is correctly written (ref-based, direct DOM transforms, no
  per-move React state) — the *pattern* to copy everywhere else.
- Sector definition data file (clean, data-driven).
- Rapier vector scratch objects (`_physObjPos` etc.) show awareness of GC pressure.
- Haptics integration and the general audiovisual ambition.
