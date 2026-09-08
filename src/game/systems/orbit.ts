import { SimState, SolidBody } from '../state';
import { ORBIT_TUNING } from '../tuning';
import { applyRecoilImpulse } from './marble';

export function calculateOrbitRadius(mass: number): number {
    return ORBIT_TUNING.R_BASE + mass * ORBIT_TUNING.R_PER_MASS;
}

export function calculateOrbitOmega(mass: number, radius: number): number {
    return ORBIT_TUNING.OMEGA_K / (radius * Math.sqrt(mass));
}

export function updateOrbit(state: SimState, dt: number, isSpinningUp = false): void {
    const marble = state.marble;

    // 1. Check free active solids for capture if slots available
    for (const solid of state.solids) {
        if (!solid.active || solid.orbitSlot >= 0) continue;

        const dx = solid.x - marble.x;
        const dz = solid.z - marble.z;
        const distSq = dx * dx + dz * dz;

        if (distSq <= ORBIT_TUNING.CAPTURE_RADIUS * ORBIT_TUNING.CAPTURE_RADIUS) {
            // Find empty slot
            const slotIdx = state.orbitSlots.findIndex(s => !s.occupied);
            if (slotIdx >= 0) {
                state.orbitSlots[slotIdx] = { occupied: true, solidId: solid.id };
                solid.orbitSlot = slotIdx;
                solid.spinTime = 0;
                solid.rotationsCompleted = 0;
                solid.rotationAngle = Math.atan2(dz, dx);
            }
        }
    }

    // 2. Update captured orbiter positions and spin
    const numSlots = ORBIT_TUNING.SLOTS;
    for (let i = 0; i < numSlots; i++) {
        const slot = state.orbitSlots[i];
        if (!slot.occupied) continue;

        const solid = state.solids.find(s => s.id === slot.solidId && s.active);
        if (!solid) {
            slot.occupied = false;
            slot.solidId = -1;
            continue;
        }

        const radius = calculateOrbitRadius(solid.mass);
        const baseOmega = calculateOrbitOmega(solid.mass, radius);

        if (isSpinningUp) {
            solid.spinTime = Math.min(solid.spinTime + dt, ORBIT_TUNING.SPINUP_TIME);
        } else {
            solid.spinTime = Math.max(solid.spinTime - dt, 0);
        }

        const spinProgress = solid.spinTime / ORBIT_TUNING.SPINUP_TIME;
        const currentOmega = baseOmega * (1 + (ORBIT_TUNING.SPINUP_MAX - 1) * spinProgress);

        const prevAngle = solid.rotationAngle;
        solid.rotationAngle += currentOmega * dt;
        solid.rotationsCompleted += (solid.rotationAngle - prevAngle) / (2 * Math.PI);

        const slotAngleOffset = (i / numSlots) * 2 * Math.PI;
        const totalAngle = solid.rotationAngle + slotAngleOffset;

        solid.x = marble.x + Math.cos(totalAngle) * radius;
        solid.z = marble.z + Math.sin(totalAngle) * radius;

        const tanSpeed = currentOmega * radius;
        solid.vx = -Math.sin(totalAngle) * tanSpeed;
        solid.vz = Math.cos(totalAngle) * tanSpeed;
    }
}

export function launchOrbiter(state: SimState, slotIndex: number): { vx: number; vz: number } | null {
    if (slotIndex < 0 || slotIndex >= state.orbitSlots.length) return null;
    const slot = state.orbitSlots[slotIndex];
    if (!slot.occupied) return null;

    const solid = state.solids.find(s => s.id === slot.solidId && s.active);
    if (!solid) return null;

    const radius = calculateOrbitRadius(solid.mass);
    const baseOmega = calculateOrbitOmega(solid.mass, radius);
    const spinProgress = solid.spinTime / ORBIT_TUNING.SPINUP_TIME;
    const currentOmega = baseOmega * (1 + (ORBIT_TUNING.SPINUP_MAX - 1) * spinProgress);

    const slotAngleOffset = (slotIndex / ORBIT_TUNING.SLOTS) * 2 * Math.PI;
    const totalAngle = solid.rotationAngle + slotAngleOffset;

    const launchSpeed = currentOmega * radius * ORBIT_TUNING.LAUNCH_K;
    const launchVx = -Math.sin(totalAngle) * launchSpeed + state.marble.vx;
    const launchVz = Math.cos(totalAngle) * launchSpeed + state.marble.vz;

    solid.vx = launchVx;
    solid.vz = launchVz;
    solid.orbitSlot = -1;
    solid.spinTime = 0;
    solid.rotationsCompleted = 0;

    slot.occupied = false;
    slot.solidId = -1;

    applyRecoilImpulse(state, launchVx, launchVz, solid.mass);

    return { vx: launchVx, vz: launchVz };
}
