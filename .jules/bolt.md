## 2026-09-07 - Avoid Object Instantiation in Per-Frame Loops and Effect Dependency Arrays
**Learning:** Instantiating objects like `new THREE.Vector3(...)` inside `useFrame` or React `useEffect` dependency arrays creates thousands of transient objects per second, leading to GC pressure, frame drops, and constant effect re-subscription loops.
**Action:** Use pre-allocated module-level scratch vectors for per-frame math in `useFrame`, and pass primitive values (e.g. `x`, `z` coordinates) into React `useEffect` dependency arrays instead of newly created object instances.
