# QuantumConfusion — Implementation Plan for Google Jules

How to use this file:
- Give Jules **one task at a time, in order**. Each "PROMPT" block below is
  self-contained and copy-pasteable. Review + merge each PR before starting the
  next task — later tasks assume earlier ones are merged.
- Every task's prompt tells Jules to read `docs/MASTER_SPEC.md` and
  `docs/CODE_REVIEW.md` (they are in the repo) and to verify with
  `npm install && npm run lint && npm run build`.
- **Do not reorder.** M1 (performance) intentionally precedes all feature work:
  the review found the game currently *depends* on accidental 30–60 Hz React
  re-renders, so features built before M1 would be built on sand.

Global guardrails (repeated inside every prompt; also enforced via `AGENTS.md`
created in Task 0):

> Never call a React state setter from inside `useFrame` or collision callbacks.
> Never allocate objects/arrays/closures in per-frame code. Entities render via
> InstancedMesh pools, not per-entity React components. All gameplay constants
> go in `src/game/tuning.ts`. Do not change tuning values unless the task says
> "retune". Keep `Canvas` settings (`dpr`, `antialias:false`, no
> post-processing). Run `npm run lint` and `npm run build` before finishing.

---

## Milestone 0 — Repo hygiene & guardrails (1 task, small)

### Task 0.1 — Clean the repo and add AGENTS.md

PROMPT:
```
Read docs/CODE_REVIEW.md sections B, C and docs/MASTER_SPEC.md section 3.5.

1. Delete from the repository (git rm): the z/ directory, temp/, scratch/,
   .artifacts/, z_diff.patch, "README 2.md", and dist/. Add dist/, .artifacts/,
   scratch/ to .gitignore.
2. Remove unused dependencies from package.json: matter-js, @types/matter-js,
   @google/genai, express, @types/express, dotenv, tsx. Verify with a repo-wide
   grep that nothing imports them. Do NOT remove @react-three/rapier yet.
3. Remove the unused import of EffectComposer/Bloom/Vignette from src/App.tsx
   and remove @react-three/postprocessing from package.json (the composer is
   already disabled).
4. Delete dead code identified in docs/CODE_REVIEW.md section B: the
   handleMotion function and unused keys/frameId in the App useEffect
   (src/App.tsx ~line 2933-2979 keeps only the fusion-update, supernova, keydown,
   keyup listeners); the unused ComboMultiplierHUD component file; the unused
   fractalMode useState (inline the 'unified' literal fallback).
5. Fix the duplicated body of handleAdvanceToNextSector (src/App.tsx
   ~2658-2777): the sector-advance logic currently runs both inside a
   setTimeout(1200) and again synchronously. Keep ONE execution: play the warp
   flash, then perform the advance inside the timeout only. Behavior after: the
   next sector is set up exactly once.
6. Replace README.md with a short real description of the game (top-down
   kinetic-orbital arcade game, React + three.js + Capacitor for Android; dev
   commands: npm run dev / build / lint; android via npx cap sync android).
7. Create AGENTS.md at the repo root containing the "Global guardrails" and the
   tuning lock rule from docs/MASTER_SPEC.md sections 2 and 7, verbatim.

Verification: npm install && npm run lint && npm run build must pass. The game
must still run (npm run dev) with identical behavior apart from fix #5.
```

---

## Milestone 1 — Kill the re-render storm (3 tasks — the performance core)

### Task 1.1 — Session store + stop App-level per-frame setState

PROMPT:
```
Read docs/CODE_REVIEW.md section A (especially A1 and A2 — note the load-bearing
accident: item/hazard movement currently depends on App re-rendering constantly)
and docs/MASTER_SPEC.md section 3.1.

Goal: zero React re-renders of the App component per frame during gameplay.

1. Create src/game/sessionStore.ts: a minimal external store (subscribe /
   getSnapshot / mutate helpers, used with React's useSyncExternalStore — no new
   npm dependency) holding HUD-facing values: score, highScore, combo, level,
   xp, shield, coreIntegrity, chronoEnergy, timeScaleLabel, overchargeAmmo,
   sectorProgress counters, centralCoreHealth, isShieldActive, activeAugments.
2. Create src/game/refs.ts exporting a module-level mutable object for hot
   shared data: locusPos {x,z}, isPulling, isMoving, moveVel, plus the joystick
   vector. InteractiveLocus writes into it every frame WITHOUT calling any
   setState. Components that need it per-frame read it inside their own
   useFrame.
3. Delete the fusion-update CustomEvent dispatch in FusionSwarmScene and the
   fusionMetrics state + listener in App (the value is never rendered).
4. Replace the locusData React state in App with the refs.ts object. Components
   currently receiving locusData/locusPos as props (FractalSingularity,
   CyberItemsAndHazards, SolidPhysicsObjects, GroundChargerRings,
   MasterMachineAperture) instead import the ref object and read it in their
   useFrame. Keep their public behavior identical.
   CRITICAL: CyberItemsAndHazards mutates item.position arrays in place and
   currently relies on App re-renders to show movement. As part of this task,
   change it to write positions imperatively: give each rendered entity group a
   ref (or apply positions to children in its useFrame via group.children) so
   entities keep moving with zero React re-renders. A full instancing rewrite
   comes in a later task — the minimal imperative fix is enough here.
5. Move the 200ms game-logic interval (App ~line 2078) and the spawn interval
   (~line 2189) into stable effects that do NOT depend on frequently-changing
   values: read hot values from refs.ts/sessionStore getters inside the tick
   instead of closing over React state. Their setStates move to sessionStore
   mutations.
6. Rewrite the HUD pills (score, shield, core, level, timeScale, combo, ammo,
   sector objective HUD) as small components subscribing to individual
   sessionStore slices via useSyncExternalStore. App itself must not re-render
   when these values change.
7. Keep React useState ONLY for: gameState phase, open modals, gesture control
   mode, mute, banners/floaters (floaters capped at 3 concurrent).

Acceptance criteria:
- With React DevTools Profiler recording during active play (moving, collecting,
  slinging), the App component renders 0 times per second (banners/modal changes
  excepted); HUD leaf components render at most ~10 times/second.
- Items, hazards, gates still move, attract, and collect exactly as before.
- npm run lint && npm run build pass.
```

### Task 1.2 — Purge setState/allocation from frame paths in entities

PROMPT:
```
Read docs/CODE_REVIEW.md section A3 and docs/MASTER_SPEC.md section 2 (hard
rules). In src/App.tsx:

1. SolidObjectItem: remove the shockwaves useState (currently set inside
   useFrame). Replace with a preallocated fixed array of 3 shockwave slots per
   object, animated imperatively via refs (scale/opacity written in useFrame).
   Remove the setTimeout(0) wrappers in onCollisionEnter; call sound/haptics
   directly with the existing rate-limit refs.
2. SolidObjectItem: replace durability useState with a ref + a small imperative
   health-bar update (write scale.x of the fill mesh in useFrame). isShattered
   may remain state (it changes rarely).
3. ShatterDebris: stop calling traverse() per fragment per frame; store material
   refs once (useMemo) and write opacity directly.
4. InteractiveLocus: remove the per-frame onPointerMove callback entirely
   (superseded by refs.ts from Task 1.1). Remove the bumpFlash useState; drive
   the flash by writing emissive/color on stored material refs with a decay
   timer in useFrame.
5. Sweep every useFrame in src/components/ for per-frame allocations (new
   THREE.Vector3/Color, array literals, .clone()) and hoist them to
   module-level scratch objects. Do not change any animation behavior or any
   numeric constant.

Acceptance criteria: no setState call reachable from any useFrame or collision
callback (grep-verifiable); gameplay visually unchanged; lint + build pass.
```

### Task 1.3 — Draw-call diet & lazy loading

PROMPT:
```
Read docs/MASTER_SPEC.md section 3.4 and docs/CODE_REVIEW.md A5, A7.

1. Add a dev-only perf overlay (visible when import.meta.env.DEV): fps and
   renderer.info.render.calls / triangles, updated 2x per second.
2. FractalSingularity: reduce the always-on base layer to <=25 draw calls while
   keeping the silhouette: the 3 core spheres, ONE outer ring + ONE counter
   ring, the shield visuals, and ONE decorative line geometry may stay; merge or
   delete the remaining decorative arcs/teeth/orbiter/thread/tensor layers
   (they may be deleted outright — they are decoration, spec pillar 4).
   Restrict per-frame material color writes to at most 6 hero materials.
3. Convert all meshStandardMaterial to meshBasicMaterial or meshLambertMaterial
   everywhere EXCEPT: marble, core spheres, shield panels/bubble. Remove dead
   castShadow/receiveShadow/shadow-* props (shadows are globally off). Reduce
   point lights to at most 1 (plus ambient + directional).
4. Remove the second (sub-surface) gridHelper and its two under-floor point
   lights; keep the single main grid.
5. Lazy-load with React.lazy + Suspense: all modal components
   (LevelUp/Leaderboard/GameOver/SectorComplete/SectorBriefing/QuantumVault/
   LoreBriefing) and the 9 sector vortex components inside FractalSingularity
   (render the lazy one only when its mode is active).
6. Report before/after: bundle size from vite build, and draw calls from the
   overlay while playing sector 1.

Acceptance criteria: draw calls <=120 during sector-1 play; main JS chunk
shrinks meaningfully (target <=1.2 MB gzip); visual identity preserved (dark
arena, glowing core, rotating rings); lint + build pass.
```

---

## Milestone 2 — Bespoke physics core (2 tasks)

### Task 2.1 — simulation core + tuning + feel tests (no rendering changes)

PROMPT:
```
Read docs/MASTER_SPEC.md sections 3.2, 3.3, 5.3 and 7 fully.

1. Create src/game/tuning.ts with every constant from spec section 7, grouped
   and commented.
2. Create the pure simulation core (no three.js, no React imports):
   - src/game/state.ts — mutable sim state: marble body, fixed-capacity pools
     for solids(16), items(16), hazards(16), gates(8), orbit slots(4+1).
   - src/game/physics.ts — circle bodies on XZ: integrate(dt), elastic
     circle-circle impulse response with RESTITUTION, arena wall reflection,
     shield-ring reflection.
   - src/game/systems/marble.ts — acceleration-driven movement per spec 5.3
     including carried-mass weight penalty and recoil impulse hook.
   - src/game/systems/orbit.ts — capture into slots, mass-driven radius/omega,
     spin-up ramp, tangential launch velocity = omega*r*LAUNCH_K, per spec 5.4
     (implement capture/spin/launch math only; input wiring comes later).
   - src/game/rng.ts — seedable deterministic RNG (mulberry32 is fine).
3. Add vitest as a devDependency with an npm "test" script. Write feel tests
   per spec section 8: acceleration-to-90%-vmax timing, heavy-vs-light orbit
   radius and omega values, launch speed for mass 15 at full spin-up, recoil
   magnitude, elastic reflection angle. Assert numbers with tolerances.
4. Do NOT wire any of this into the running game yet. No rendering changes.

Acceptance criteria: npm test passes; npm run lint && npm run build pass; zero
behavior change in the running game.
```

### Task 2.2 — Swap the live game onto the sim core, remove Rapier

PROMPT:
```
Read docs/MASTER_SPEC.md sections 3.2, 3.3 and docs/CODE_REVIEW.md A4. Tasks
1.1-2.1 are merged: sessionStore/refs exist, sim core + tests exist.

1. Create a GameLoop component (inside Canvas) with the single ordered useFrame
   from spec 3.2: readInput -> stepSimulation(dt clamped, timeScale applied
   centrally) -> resolveCollection -> applyFeedback -> syncRenderables.
2. Move marble movement (InteractiveLocus math), solid-object free flight,
   orbital capture (replacing the setTranslation-per-frame code), item
   attraction/pickup, hazard drift/homing, and gate pass checks into sim
   systems operating on src/game/state.ts. Y-axis bobbing stays cosmetic in
   renderers.
3. syncRenderables writes sim positions into the existing meshes/groups via
   refs each frame (rendering architecture otherwise unchanged; instancing is
   Task 1.3/3.x scope).
4. Remove @react-three/rapier: delete Physics/RigidBody/colliders usage; ground
   contact becomes a simple y>=floor clamp with bounce in physics.ts; replace
   onCollisionEnter effects (sound/haptics/damage) with contact events emitted
   by the sim.
5. Solid-object orbital behavior now follows spec 5.4 mechanics via
   systems/orbit.ts, EXCEPT: keep an automatic release after 2 full rotations
   for now (parity with current behavior) — manual hold/release input arrives
   in Task 3.1. Remove the outer-ring (radius 52) auto-capture orbit for
   objects and player entirely (spec drops it).
6. The old per-object React orbit/cooldown state in SolidObjectItem is deleted;
   visuals (orbit halo torus, wobble) key off sim state via refs.

Acceptance criteria: game plays end-to-end: move, capture, auto-sling, damage
core when shield logic allows, collect items, hit hazards, pass gates; no
@react-three/rapier in package.json; feel tests still pass; lint/build/test
pass; report fps + draw calls from the dev overlay.
```

---

## Milestone 3 — Sling 2.0 + controls (2 tasks)

### Task 3.1 — Controls: dynamic stick + sling button (hold/release/tap)

PROMPT:
```
Read docs/MASTER_SPEC.md section 4 and 5.4 (spin-up, revolver). The sim core
(src/game/systems/orbit.ts) already implements capture/spin/launch math.

1. Create src/components/TouchControls.tsx implementing the dynamic virtual
   stick: pointer-down anywhere in the left 65% of the screen spawns the stick
   base at that point; drag sets direction/magnitude; release hides it. Copy
   the zero-React-state pattern from the existing Joystick.tsx (refs + direct
   DOM style writes; write output into the shared input ref in
   src/game/refs.ts). Multi-touch safe: track pointerId so the stick and the
   sling button work simultaneously.
2. Add the SLING button (right thumb zone, large hit target >=72px):
   pointer-down => spinUp=true in the input ref; pointer-up => release event
   (fire newest orbiter); quick tap while holding multiple orbiters => revolver
   fire one (min 90ms between). Wire these to orbit.ts.
3. Marble movement consumes the stick vector through the existing acceleration
   model (no teleporting).
4. Remove the old control plumbing: gestureControlMode state and toggle button,
   swipe handlers on the root div, MobileGestureGravityHUD, the old fixed
   Joystick component, and the pointer-follow raycast path in InteractiveLocus.
   Keyboard stays: WASD move, Space = hold/release sling, R = rewind.
5. Update the Sector 1 tutorial hint texts to teach: "drag to steer" and "hold
   to spin, release to fire".

Acceptance criteria: on a touch device (Chrome device emulation acceptable),
one thumb steers with momentum while the other holds/releases the sling;
revolver taps fire sequentially; no React re-renders per move (Profiler);
lint/build/test pass.
```

### Task 3.2 — Tracer line, target lock, perfect release

PROMPT:
```
Read docs/MASTER_SPEC.md section 5.4 (tracer, perfect release, revolver bonus)
and section 5.1 (color language).

1. Tracer: while >=1 orbiter is captured, render its tangent ray as a
   preallocated fading dashed line (single BufferGeometry, ~12 segments,
   updated imperatively in useFrame; no allocations). It sweeps as the orbit
   spins. Brightness scales with spin-up level.
2. Target lock: each frame, cheap angular test of the tangent ray against
   (a) the exposed core, or (b) open shield gaps (until Milestone 4 lands,
   treat shield-down as "everything open"). On lock: tracer color snaps to
   cyan-green (#22d3ee..#34d399 family), leading orbiter flashes, one short
   tick sound (rate-limited), 10ms haptic.
3. Perfect release: if the release happens within PERFECT_WINDOW_MS of lock
   being true, mark the projectile crit=true: CRIT_MULT damage, hit-stop
   (freeze sim timeScale to 0 for HIT_STOP_MS, audio keeps running), "PERFECT"
   floater, distinct sound. Constants from tuning.ts only.
4. Remove the automatic release-after-2-rotations from Task 2.2 — release is
   now fully manual (orbit decay after DECAY_AFTER_S stays).
5. FULL BROADSIDE: firing >=3 orbiters within 1.5s each hitting core/panels
   grants a bonus (score + floater + sound).
6. Add feel tests: lock-window math (given omega and gap angle, lock duration
   in ms), crit applies exactly CRIT_MULT.

Acceptance criteria: visible sweeping tracer that flashes on alignment; perfect
releases reliably reproducible by timing; lint/build/test pass.
```

---

## Milestone 4 — Boss rework: shield panels & vulnerability (1 task)

### Task 4.1 — Layered destructible shield + counterattacks

PROMPT:
```
Read docs/MASTER_SPEC.md section 5.5 fully, plus 5.1 (color states).

1. Replace the binary shield bubble in FractalSingularity with 6 shield panels:
   one InstancedMesh (or 6 cloned meshes max) of curved plates in a hexagonal
   ring (radius ~9.5) rotating slowly around the core. Sim-side state in
   src/game/state.ts: per-panel HP (PANEL_HP * sector), angular span, alive/
   regenerating/regenTimer.
2. Damage: slung objects hitting a panel apply 0.5*m*v^2*DMG_K (crit doubles);
   marble contact = existing recoil + reduced self-damage (use tuning value,
   not 120). Panel death: instanced debris burst (reuse/adapt ShatterDebris as
   a pooled instanced system), heavy haptic, bass impact sound, panel gap opens
   and the Task 3.2 target-lock now recognizes real gaps by angle.
3. Regeneration: dead panels rebuild after PANEL_REGEN_S with a visible scale-up
   knit animation; each powered machine subsystem (existing s1-s4 powers) slows
   regen by REGEN_SLOW_PER_SUBSYS (replaces the current binary
   all-subsystems -> shield-off rule; delete that rule and its supernova
   announcement).
4. Vulnerability window: when >=VULN_PANELS panels are simultaneously dead, the
   core becomes damageable: core + gaps shift to the reserved cyan-green state,
   timeScale dips to SLOWMO_SCALE for 1s, music/drone swells (one gain ramp).
   Core HP and destruction flow (sector complete) otherwise unchanged.
5. Counterattacks, telegraphed >=600ms with red warning arcs, escalating by
   sector level: sector>=2 radial shockwave on panel death (dodgeable, damages
   marble in a ring); sector>=3 gap turret pulse aimed at marble position
   (slow projectile from the sim pool); sector>=5 enrage below ENRAGE_AT core
   HP (panel ring spin speed x1.6, regen x1.5).
6. Update SectorObjectiveHUD copy: subsystems now "suppress shield
   regeneration" instead of "lower the shield".

Acceptance criteria: panels individually shatter and regrow; core only takes
damage during vulnerability windows; counterattacks telegraph then fire; feel
tests extended (panel dies to exactly 2 full-spin-up heavy hits); draw calls
still <=120; lint/build/test pass.
```

---

## Milestone 5 — Protagonist identity & game feel (1 task)

### Task 5.1 — Hero marble: look, squash-stretch, trail, collection bounce

PROMPT:
```
Read docs/MASTER_SPEC.md sections 5.1 and 5.2.

1. Rebuild the protagonist visual in InteractiveLocus: inner white emissive
   core sphere + thin dark shell with warm amber fresnel rim (a small custom
   ShaderMaterial or an onBeforeCompile fresnel is acceptable — this is one of
   the <=5 hero materials), ground light disc kept. DELETE the pink satellite
   sphere and the gyroscopic wobble torus (they camouflage the hero among
   decorations). The marble must be the only white/warm object in the scene —
   audit other always-on materials and desaturate any white/amber ones to the
   slate/blue neutral family.
2. Trail: single preallocated triangle-strip ribbon (~24 segments) in
   white->amber gradient, length/width scaling with speed, written imperatively.
3. Squash & stretch on the render mesh only: stretch along velocity at high
   speed, squash on impacts (150ms spring), scale-pop on collection.
4. Collection bounce: any pickup triggers a cosmetic Y-hop + squash + pitch-
   laddered note (existing harmonicScale ladder keyed to combo) + light haptic;
   bigger for overcharged pickups.
5. Weight visualization: carried orbit mass thickens the trail and lowers the
   bob frequency (values from tuning.ts).
6. Global screen-shake budget: single module (src/game/feel.ts) through which
   ALL shake requests route, clamping amplitude to SHAKE_MAX with exponential
   decay; replace direct cameraShake setStates with it (ResponsiveCameraRig
   reads it via ref).

Acceptance criteria: a first-time viewer can identify the player instantly in a
screenshot; motion reads weighty (stretch at speed, squash on hit); no new
per-frame allocations; draw calls budget holds; lint/build/test pass.
```

---

## Milestone 6 — Dopamine & retention systems (2 tasks)

### Task 6.1 — Medals, missions, daily seed, meta shop

PROMPT:
```
Read docs/MASTER_SPEC.md section 5.7.

1. Sector medals: track breach time, damage taken, perfect releases per sector;
   award bronze/silver/gold (thresholds in a new src/game/progression.ts, data-
   driven). Show medal on SectorCompleteModal and persist best-per-sector via
   Capacitor Preferences.
2. Side missions: src/game/missions.ts with a data-driven list (id, description,
   predicate over sim/session counters, credit reward). 3 active per run,
   evaluated at 10Hz by the session ticker; completion => floater + sound +
   credits. Show them collapsed in the objectives pill.
3. Real economy: credits earned = floor(score/1000) + medal bonus (0/250/500/
   1000). QuantumVaultModal becomes functional: src/game/metaUpgrades.ts defines
   permanent upgrades (start-shield +25, magnet +5, 5th orbit slot, 2 trail
   color cosmetics) with costs; purchases persist via Preferences and apply on
   run start. Remove the current fake purchase handler.
4. Daily challenge: seed the sim RNG (src/game/rng.ts) from the date string;
   "DAILY" entry point on the briefing modal runs sector 3 with a fixed
   modifier (heavy-objects-only); store local daily best + consecutive-day
   streak; show streak on the briefing modal.
5. Remove the fake seeded INITIAL_LEADERBOARD entries; local leaderboard starts
   empty with a friendly empty-state.

Acceptance criteria: medals/missions/credits/daily all function and persist
across app restarts; lint/build/test pass.
```

### Task 6.2 — Audio director & final feel pass

PROMPT:
```
Read docs/MASTER_SPEC.md section 5.8 and CODE_REVIEW.md A6.

1. In src/audio.ts add a music director: 4 continuously-running cheap loop
   layers (pad, pulse, arp, percussion) built from oscillators/noise with
   per-layer GainNodes; intensity 0-3 (from: subsystems powered, combo tier,
   vulnerability window) crossfades layer gains (never restarts oscillators).
   Master music gain ducks -6dB for 150ms on big impacts (sidechain).
2. Global SFX rate limiter: minimum 60ms between voice starts across all play*
   methods (keep the 6-voice cap). Reduce playSpinningObjectWobble to at most
   1 concurrent wobble voice globally.
3. Near-miss whoosh: hazard passing within 2 units without hitting => filtered
   noise sweep + tiny haptic + small score bonus ("NEAR MISS").
4. Slow-mo + zoom pulse on core destruction (timeScale 0.3 for 600ms, camera
   dips 10% closer via the feel module).
5. Floater discipline: cap concurrent floating texts at 3; only high-value
   events float (perfect, broadside, panel break, near miss, level up, medal);
   routine pickups just do sound+bounce.

Acceptance criteria: music intensity audibly follows gameplay state without
pops/restarts; SFX never crackle under spam; lint/build/test pass.
```

---

## Milestone 7 — Device validation (manual, you + optionally Jules)

Not a Jules code task. Checklist after each milestone merge, on a real
mid-range Android phone via `npx cap sync android && npx cap run android`:

- [ ] 60 fps steady in sector 1 & 3 (enable the dev overlay in a debug build)
- [ ] no hitch when: panel shatters, 4 orbiters held, EMP clears hazards
- [ ] touch controls: stick + sling simultaneously, no ghost touches
- [ ] battery/thermals acceptable over a 10-minute session
- [ ] cold start <= 3s; Preferences persist across force-stop

If a budget fails, file a targeted Jules task referencing the failing metric
and docs/MASTER_SPEC.md section 2 — do not proceed to the next milestone on a
red budget.

---

## Suggested Jules task order recap

0.1 hygiene → 1.1 store → 1.2 frame-path purge → 1.3 draw-call diet →
2.1 sim core+tests → 2.2 swap+remove rapier → 3.1 controls → 3.2 tracer/perfect
→ 4.1 shield panels → 5.1 hero marble → 6.1 retention → 6.2 audio.

Each is one PR. After 1.3 the game should already feel dramatically smoother on
device — validate on hardware before investing in Milestones 2+.
