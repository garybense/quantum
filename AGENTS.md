# Global Guardrails & Rules

## Hard rules for all future code:
- Never call a React state setter from inside `useFrame`, `onCollisionEnter`, or any per-frame/per-contact path. Mutate refs/instances; surface to React ≤10 Hz.
- Never create objects, arrays, closures, or strings inside `useFrame`. Use module-level scratch vectors and preallocated pools.
- Entities (items, hazards, gates, debris, orbiters) live in fixed-capacity pools rendered via `InstancedMesh`. No React mount/unmount per entity.
- All gameplay constants live in `src/game/tuning.ts` and nowhere else.

## Tuning Lock Rule:
- Lock rule: after the values are signed off, agents may not change `tuning.ts` numbers unless the task explicitly says "retune X". Feel tests (§8) enforce this mechanically.
