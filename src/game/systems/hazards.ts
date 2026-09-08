import { SimState } from '../state';
import { integrate, reflectArenaWall } from '../physics';

export function updateHazards(state: SimState, dt: number): void {
    const marble = state.marble;

    for (const hazard of state.hazards) {
        if (!hazard.active) continue;

        const dx = marble.x - hazard.x;
        const dz = marble.z - hazard.z;
        const distSq = dx * dx + dz * dz;

        if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            const homingSpeed = 5.0;
            hazard.vx += (dx / dist * homingSpeed - hazard.vx) * 2.0 * dt;
            hazard.vz += (dz / dist * homingSpeed - hazard.vz) * 2.0 * dt;
        }

        integrate(hazard, dt);
        reflectArenaWall(hazard, 50);
    }
}
