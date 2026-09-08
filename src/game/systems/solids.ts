import { SimState } from '../state';
import { integrate, reflectArenaWall } from '../physics';
import { updateOrbit } from './orbit';

export function updateSolids(state: SimState, dt: number, isSpinningUp = false): void {
    for (const solid of state.solids) {
        if (!solid.active || solid.orbitSlot >= 0) continue;

        integrate(solid, dt);
        reflectArenaWall(solid, 50);

        if (solid.rotationsCompleted >= 2) {
            solid.orbitSlot = -1;
            solid.rotationsCompleted = 0;
            solid.spinTime = 0;
        }
    }

    updateOrbit(state, dt, isSpinningUp);
}
