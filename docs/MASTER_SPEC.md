# QuantumConfusion — Master Specification v1.0

Status: authoritative design + technical spec. `JULES_PLAN.md` implements this.
`CODE_REVIEW.md` explains why the technical mandates below exist.

---

## 1. Vision

**One sentence:** You are a white-hot kinetic marble in a dark machine-arena; you
catch debris into orbit around yourself, spin it up, and release it with perfect
timing to shatter the shield panels of a living central core — then unload
everything through the vulnerability window before it heals.

**Design pillars (every change must serve at least one, and violate none):**

1. **Butter or nothing.** Locked 60 fps on a mid-range Android phone. Any feature
   that costs the frame budget is cut or downgraded, no exceptions.
2. **The marble is the star.** The protagonist must be identifiable in one glance
   by a new player: the only white/warm-core object in a cool dark world, with
   weight, squash-and-stretch, and a trail.
3. **Physics is the game.** Momentum, mass, and centrifugal force are not
   decoration — they are the skill ceiling. Tuning values are sacred
   (see §7, `src/game/tuning.ts`).
4. **Readable, then pretty.** Every pixel must answer "threat, tool, or target?"
   Decoration that muddies that answer gets deleted, no matter how cool.
5. **Easy to learn, hard to master.** One finger plays the game. Perfect-timing
   releases, revolver bursts, and gap-threading reward the top 1%.

---

## 2. Performance budget (non-negotiable, enforced before any feature work)

| Metric | Budget | How measured |
|---|---|---|
| Frame rate | 60 fps sustained, 0 hitches >50 ms during normal play | Chrome DevTools perf trace on Android WebView / `chrome://inspect` |
| React re-renders of `App` during gameplay | **0 per frame** (HUD updates ≤10 Hz via subscriptions) | React Profiler |
| Draw calls | ≤120 total | Spector.js or `renderer.info.render.calls` |
| Triangles | ≤150k | `renderer.info` |
| JS heap allocation in the frame loop | ~0 (no per-frame object/array/closure creation in hot paths) | Allocation timeline |
| Main bundle | ≤1.2 MB gzipped, modals/vortexes lazy-loaded | `vite build` output |
| Cold start to interactive | ≤3 s on mid-range device | manual |

**Hard rules for all future code (also in `AGENTS.md`):**
- Never call a React state setter from inside `useFrame`, `onCollisionEnter`, or
  any per-frame/per-contact path. Mutate refs/instances; surface to React ≤10 Hz.
- Never create objects, arrays, closures, or strings inside `useFrame`. Use
  module-level scratch vectors and preallocated pools.
- Entities (items, hazards, gates, debris, orbiters) live in fixed-capacity pools
  rendered via `InstancedMesh`. No React mount/unmount per entity.
- All gameplay constants live in `src/game/tuning.ts` and nowhere else.

---

## 3. Technical architecture

### 3.1 State model — three tiers

1. **Simulation state (hot, per-frame):** plain mutable module singleton
   `src/game/state.ts` — player position/velocity, entity pools, orbit slots,
   combo timer, shield panel HP, core HP. Read/written only by the game loop.
   Never touches React.
2. **Session state (warm, ≤10 Hz):** a tiny external store (Zustand, or a
   hand-rolled `subscribe`/`getSnapshot` store — no new dependency required) for
   HUD numbers: score, combo, shield %, core %, ammo, sector progress. A 10 Hz
   ticker copies from simulation state. HUD components subscribe to individual
   slices with selectors so a score change re-renders one `<span>`, not App.
3. **App state (cold):** React `useState` only for: which modal is open, game
   phase (`briefing | playing | sectorComplete | gameover`), settings. These
   change a few times per minute — React is the right tool here.

### 3.2 The game loop

One driver component inside `<Canvas>` owns a single `useFrame` that calls, in
order: `readInput() → stepSimulation(dt) → resolveCollection() → applyFeedback()
→ syncRenderables()`. Sub-systems are plain functions in `src/game/systems/*.ts`
operating on the simulation state — unit-testable with no React or three.js
imports (positions are `{x,z}` numbers, not `THREE.Vector3`, in the sim core).

`dt` is clamped to 50 ms and multiplied by `timeScale` centrally, so bullet-time
and overclock apply everywhere consistently (today each system re-implements it).

### 3.3 Physics: replace Rapier with a bespoke 2.5D kinetic core

Justification (see review §A4): the game is functionally a 2D top-down physics
game on the XZ plane; Rapier is already being fought with per-frame
`setTranslation`. A bespoke core removes the WASM bridge, gives deterministic
tuning, and makes "impeccable momentum" achievable and testable.

`src/game/physics.ts` implements exactly what the game needs:
- **Circle bodies** with mass, radius, velocity on the XZ plane. Y is cosmetic
  (bob/bounce animation), not simulated.
- **Marble movement**: acceleration-driven (`a = (v_target − v) · k_accel`),
  with `k_accel` reduced by carried orbit mass → **weight transitions** (§5.3).
- **Elastic collisions**: circle-vs-circle impulse exchange with restitution
  from tuning; arena wall reflection; shield-ring reflection with energy return
  (predictable deflection, pillar 3).
- **Verlet-free, closed-form orbits** for captured objects (§5.4) — orbit is a
  constraint, not a force, so it can never destabilize.
- Deterministic: seedable RNG, fixed-order iteration → replay/daily-seed ready
  and regression-testable ("feel tests", §8).

Rendering keeps three.js/R3F. Only `@react-three/rapier` is removed.

### 3.4 Rendering plan

- **Entity pools → InstancedMesh:** one instanced mesh per entity family
  (items ×5 types via per-instance color + a type ring, hazards, gates’ rings,
  debris shards, orbit tracer dots). Capacities fixed (e.g. 16 items,
  16 hazards, 8 gates, 48 debris). Hide = scale 0.
- **Materials:** `meshBasicMaterial`/`meshLambertMaterial` for everything except
  ≤5 hero materials (marble, core, shield panels). Kill per-frame `setHSL` on
  dozens of materials; animate ≤6 hero materials only.
- **FractalSingularity diet:** keep the silhouette (core spheres, one outer ring
  pair, shield), delete or merge decorative layers until the whole centerpiece
  is ≤25 draw calls. Sector vortex layers stay one-at-a-time (already true) but
  become `React.lazy` chunks.
- **Lights:** 1 ambient + 1 directional + ≤1 point light. No shadows.
- Keep: `dpr [1, 1.5]` (raise cap only after budget is green), `antialias:false`,
  no post-processing. Bloom is faked with additive sprites on hero objects.

### 3.5 Repo hygiene

Remove `z/`, `temp/`, `scratch/`, `.artifacts/`, `z_diff.patch`, `README 2.md`,
`dist/` from git; drop unused deps (`matter-js`, `@google/genai`, `express`,
`dotenv`, `@react-three/postprocessing`, `@react-three/rapier` after §3.3);
rewrite README for the actual game; add `AGENTS.md` with the hard rules and the
tuning lock.

---

## 4. Controls

**Primary scheme — "Touch-Drive + Sling Button" (replaces the 3-mode toggle):**

- **Movement — dynamic virtual stick:** touching anywhere in the left ~65% of
  the screen spawns the stick base at the touch point (no fixed joystick corner,
  no reaching). Drag direction/magnitude = target velocity. Implementation
  copies the existing `Joystick.tsx` pattern (refs + direct DOM writes, zero
  React state per move). Marble responds through the acceleration model, so it
  keeps its weight — never teleport-follows the finger.
- **Sling button — right thumb, one button, three verbs:**
  - **Hold:** spin-up — orbiting objects accelerate (§5.4), tracer brightens.
  - **Release:** fire the newest orbiter along the tangent.
  - **Tap (with multiple orbiters):** revolver — fire one per tap, rhythm-burst.
- **Keyboard (dev/testing):** WASD move, Space hold/release sling, R rewind.

The follow-finger raycast mode and the swipe mode are removed. One scheme,
tutorialized in Sector 1, no toggles to explain.

---

## 5. Game design

### 5.1 Readability color language (strict)

| Role | Look |
|---|---|
| Protagonist | The ONLY white-hot object: white core, warm amber fresnel rim, long amber-white trail |
| Collectibles / power | Gold / amber |
| Threats (hazards, active shield, counterattacks) | Red / magenta |
| Neutral machine & arena | Desaturated deep blue / slate, low emissive |
| Vulnerability / "GO NOW" | Saturated cyan-green, reserved exclusively for exposed core + open gaps |

Everything currently cyan-glowing that is not interactive gets desaturated.

### 5.2 The protagonist

- Sphere, ~1.7 radius, layered: inner white emissive core, thin dark shell with
  warm fresnel rim, ground light-disc, and a ribbon **trail** whose length/width
  scale with speed (single triangle-strip mesh, preallocated).
- **Squash & stretch:** scale deforms along velocity axis with speed; on
  impact, squash perpendicular to contact normal (150 ms spring). This is
  cosmetic scale on the render mesh only — physics stays a circle.
- **Collection bounce:** collecting anything triggers a small hop (cosmetic Y
  bounce + squash), +haptic tick, +pitch-laddered pickup note. Big pickups =
  bigger hop. (User-requested "bouncing triggered by collecting".)
- Carried orbit mass visibly weighs it down: trail thickens, bob frequency
  drops, turn radius widens (§5.3).

### 5.3 Marble movement & weight (the "impeccable momentum" contract)

- `v` approaches `v_target` via exponential accel; heavier loadout lowers
  `k_accel` and `v_max` (`v_max_eff = v_max / (1 + carriedMass · W_SPEED)`).
- Releasing a heavy orbiter gives an equal-and-opposite **recoil impulse** to
  the marble — firing heavy objects physically kicks you back. Skilled players
  will sling-recoil to dodge.
- Elastic deflection off shields/walls returns energy at `RESTITUTION` (0.75) —
  predictable angle-in/angle-out.
- All constants in `tuning.ts`; regression "feel tests" (§8) freeze behavior so
  future agents cannot silently retune it.

### 5.4 Orbit & sling 2.0 (the core loop)

**Capture:** flying near a free object (< `CAPTURE_RADIUS`) sucks it into an
orbit slot. Up to **4 slots**, spaced evenly (planetary ring look).

**Mass-driven orbit (user idea B, adopted):**
- Orbit radius `r = R_BASE + mass · R_PER_MASS` (light ≈ 3.5, heavy ≈ 7).
- Angular velocity `ω = OMEGA_K / (r · √mass)` — light objects whirl tight and
  fast, heavy ones swing wide and slow. Different pickups = different mental
  rhythm.

**Spin-up (hold):** while held, `ω` ramps toward `ω · SPINUP_MAX` (≈2.2×) over
`SPINUP_TIME` (≈1.2 s), with rising audio pitch + tightening haptic pulses.

**Release velocity is honest physics:** `v_launch = ω · r · LAUNCH_K`, damage
`= ½ m v²` scaled. A spun-up heavy object is devastating; an instant flick of a
light one is fast but weak. No hidden clamps that flatten the skill curve.

**Tracer line (user idea A, adopted):** while ≥1 orbiter is held, render the
tangent ray from the leading orbiter (preallocated line, ~12 fading dashes,
sweeping like a radar as the orbit spins). When the ray intersects an **open
gap / exposed core**, the tracer snaps to bright cyan-green + the orbiter
flashes + a tick sound + 10 ms haptic: that is the release cue.

**Perfect release:** releasing within `PERFECT_WINDOW_MS` (≈70 ms) of
lock-flash = **crit**: 2× damage, 90 ms hit-stop + micro slow-mo, distinct
sound, "PERFECT" floater. This one mechanic converts the orbit from RNG
frustration to a rhythm skill.

**Revolver burst:** with 2–4 orbiters, taps fire them sequentially (min 90 ms
apart). Firing all ≥3 within 1.5 s through a gap = "FULL BROADSIDE" bonus.

**Auto-launch is deleted.** Objects never self-release after N rotations; orbit
persists (slow decay after 12 s → gentle drop, so hoarding has a cost).

### 5.5 Central core & layered shield (boss rework)

Replaces the binary shield bubble:

- **6 geometric shield panels** arranged in a slowly rotating hexagonal ring
  around the core, each with its own HP bar (thin arc above it).
- Panels take damage from slung objects only (`½mv²`); marble contact = recoil
  + modest self-damage (unchanged idea, tuned down from 120).
- A destroyed panel **shatters** (instanced debris burst, big haptic, bass
  impact) leaving an **open gap** that the tracer can lock through.
- **Regeneration:** destroyed panels rebuild after `PANEL_REGEN_S` (12 s) with
  a visible knitting animation — creating urgency, not a static victory.
- **Vulnerability window:** destroying 3+ panels (or all, per sector
  difficulty) exposes the core: color state flips to cyan-green, time briefly
  dips to 0.85×, music layer swells. Core takes full damage only now.
- **Counterattacks (escalating by sector):** panel-gap turret pulses aimed at
  the marble; radial shockwave when a panel dies; core "enrage" spin-speed-up
  below 30% HP. All telegraphed ≥600 ms with red warning arcs.
- The 4-subsystem thresholds (nodes/gates/drops/combo) are kept but re-aimed:
  each powered subsystem now **slows panel regeneration by 25%** — objectives
  feed the boss fight instead of gating a binary shield.

### 5.6 Supporting cast

- **Items (5 types) keep their roles**, rendered instanced, spawn budget-capped.
  Overcharge (grow-over-time) stays — it's a good risk/reward "let it ripen".
- **Hazards** keep homing-when-idle behavior; add **hazard-vs-slung-object**
  collisions: a slung object smashes hazards for combo credit (satisfying
  bowling moment, nearly free with the new physics core).
- **Gates** stay as combo/charge fuel; passing a gate at high speed (> 80% of
  `v_max`) doubles its charge (risk-reward for committing momentum).
- **Ground charger rings** stay (overcharge ammo → 2× core damage next hit).

### 5.7 Progression, economy, retention

- **Session shape:** one sector = 3–6 minutes. Death = run over (roguelite),
  sector reached persists as best-progress.
- **Sector medals:** bronze/silver/gold per sector by (breach time, damage
  taken, perfect-release count). Medals shown on the sector map; gold requires
  mastery. This is the "hard to master" surface.
- **Augment draft** (already half-built): 3-choice draft after each sector;
  smart-pick removed — the *choice* is the dopamine.
- **Quantum Vault becomes real meta:** credits earned per run (score ÷ 1000 +
  medal bonus) buy permanent small upgrades (start shield +25, magnet +5,
  5th orbit slot, trail cosmetics). Data-driven in `metaUpgrades.ts`, persisted
  via Capacitor Preferences.
- **Daily seed challenge:** date-seeded RNG (deterministic sim makes this
  trivial), fixed sector + modifier ("heavy objects only"), local best + streak
  counter. Streak display on the main menu.
- **Side missions:** 3 rotating per run ("smash 5 hazards with slung objects",
  "3 perfect releases in one sector", "breach without touching a shield") →
  credit bonuses. Data-driven list, checked by the mission system at 10 Hz.
- **Dopamine polish inventory:** pitch-ladder combo notes (exists — keep),
  hit-stop on panel break, slow-mo + zoom pulse on core kill, floater text
  budget (≤3 concurrent, high-value events only), near-miss whoosh when a
  hazard passes < 2 units, milestone haptics. Screen-shake gets a single
  global budget (max amplitude, decay) so stacked events can't nauseate.

### 5.8 Audio

- Keep the zero-asset synth engine. Add a **layered music director**:
  4 loops (pad / pulse / arp / percussion) as cheap oscillator patterns, gain
  keyed to game intensity (subsystems powered, combo, vulnerability window).
  Crossfade layers, never restart them.
- Sidechain: master music gain ducks 150 ms on big impacts.
- Combo pickup notes climb the existing `harmonicScale`; reset on combo drop.
- All SFX rate-limited globally (≥60 ms between voice starts, keep 6-voice cap).

### 5.9 HUD

Keep the pill aesthetic, but: HUD numbers subscribe to the session store
(§3.1-2); floater text capped at 3; the tracer/lock replaces most instructional
text; sector objectives collapse to a single tappable pill (exists). Remove the
compass HUD (obsolete with new controls).

---

## 6. Explicitly rejected / deferred

- **Rapier keep-and-tune** — rejected: the game fights it (review §A4).
- **Camera-relative "screen-space" controls** — deferred; top-down fixed camera
  makes world-space stick correct today.
- **Online leaderboards, ads, IAP** — out of scope for this spec; local first.
  Remove fake seeded leaderboard names before any store release.
- **Post-processing bloom** — rejected on perf; additive sprite glow instead.

---

## 7. Tuning contract

`src/game/tuning.ts` is the single home of every gameplay constant, grouped and
commented. Initial values (starting points, to be play-tuned ONCE, then locked):

```
MARBLE: v_max 34, k_accel 7.5, radius 1.7, W_SPEED 0.02, RESTITUTION 0.75
ORBIT:  CAPTURE_RADIUS 6.5, R_BASE 3.0, R_PER_MASS 0.22, OMEGA_K 42,
        SPINUP_MAX 2.2, SPINUP_TIME 1.2, LAUNCH_K 1.15, RECOIL_K 0.35,
        SLOTS 4, DECAY_AFTER_S 12
SLING:  PERFECT_WINDOW_MS 70, CRIT_MULT 2.0, DMG_K 0.5 (½mv² scale 0.08)
SHIELD: PANELS 6, PANEL_HP 400·sector, PANEL_REGEN_S 12, REGEN_SLOW_PER_SUBSYS 0.25
CORE:   HP per sectorDefinitions, VULN_PANELS 3, ENRAGE_AT 0.3
FEEL:   HIT_STOP_MS 90, SHAKE_MAX 1.6, SLOWMO_SCALE 0.85
```

**Lock rule (also in `AGENTS.md`):** after the values are signed off, agents may
not change `tuning.ts` numbers unless the task explicitly says "retune X".
Feel tests (§8) enforce this mechanically.

## 8. Verification

- `npm run lint` (tsc) must pass on every change.
- **Feel tests** (`vitest`, sim core only, no DOM): numeric regression tests,
  e.g. "marble at rest reaches 90% v_max in 0.31±0.02 s", "mass-15 orbiter at
  full spin-up launches at 54±1 u/s", "panel dies to exactly 2 spun-up heavy
  hits". If a tuning constant changes, a test fails — by design.
- Perf smoke: a debug overlay (dev-only) showing fps, draw calls,
  `renderer.info` — assert budgets manually per milestone.
