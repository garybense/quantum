import { SimState } from '../state';

export function updateItems(state: SimState, dt: number): void {
    const marble = state.marble;

    for (const item of state.items) {
        if (!item.active) continue;

        const dx = marble.x - item.x;
        const dz = marble.z - item.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < 144 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const pullSpeed = 15 * (1 - dist / 12);
            item.x += (dx / dist) * pullSpeed * dt;
            item.z += (dz / dist) * pullSpeed * dt;
        }
    }
}
