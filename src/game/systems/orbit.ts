import { SimState, SolidBody } from '../state';
import { ORBIT_TUNING, SLING_TUNING } from '../tuning';
import { applyRecoilImpulse } from './marble';

export interface TracerLockState {
    hasOrbiter: boolean;
    leadingOrbiter: SolidBody | null;
    isLocked: boolean;
    lastLockTime: number;
    rayOrigin: { x: number; z: number };
    rayDir: { x: number; z: number };
}

const currentLockState: TracerLockState = {
    hasOrbiter: false,
    leadingOrbiter: null,
    isLocked: false,
    lastLockTime: 0,
    rayOrigin: { x: 0, z: 0 },
    rayDir: { x: 0, z: 0 },
};

export function calculateOrbitRadius(mass: number): number {
    return ORBIT_TUNING.R_BASE + mass * ORBIT_TUNING.R_PER_MASS;
}

export function calculateOrbitOmega(mass: number, radius: number): number {
    return ORBIT_TUNING.OMEGA_K / (radius * Math.sqrt(mass));
}

export function getLeadingOrbiter(state: SimState): SolidBody | null {
    let leading: SolidBody | null = null;
    let maxSlot = -1;
    for (let i = state.orbitSlots.length - 1; i >= 0; i--) {
        if (state.orbitSlots[i].occupied) {
            const solid = state.solids.find(s => s.id === state.orbitSlots[i].solidId && s.active);
            if (solid) {
                if (!leading || i > maxSlot) {
                    leading = solid;
                    maxSlot = i;
                }
            }
        }
    }
    return leading;
}

export function evaluateTracerLock(state: SimState, isShieldActive = true): TracerLockState {
    const leading = getLeadingOrbiter(state);
    if (!leading) {
        currentLockState.hasOrbiter = false;
        currentLockState.leadingOrbiter = null;
        currentLockState.isLocked = false;
        return currentLockState;
    }

    currentLockState.hasOrbiter = true;
    currentLockState.leadingOrbiter = leading;
    currentLockState.rayOrigin = { x: leading.x, z: leading.z };

    // Tangent direction vector
    const speed = Math.sqrt(leading.vx * leading.vx + leading.vz * leading.vz);
    let dirX = 0;
    let dirZ = 0;
    if (speed > 0.001) {
        dirX = leading.vx / speed;
        dirZ = leading.vz / speed;
    } else {
        const dx = leading.x - state.marble.x;
        const dz = leading.z - state.marble.z;
        const rad = Math.sqrt(dx * dx + dz * dz);
        if (rad > 0.001) {
            dirX = -dz / rad;
            dirZ = dx / rad;
        }
    }
    currentLockState.rayDir = { x: dirX, z: dirZ };

    // Perpendicular distance d from origin (0, 0) to ray
    const perpDist = Math.abs(leading.x * dirZ - leading.z * dirX);
    // Parametric distance along ray toward origin
    const tClosest = -(leading.x * dirX + leading.z * dirZ);

    let locked = false;
    const coreTargetRadius = isShieldActive ? 4.5 : 8.0;

    if (tClosest > 0 && perpDist <= coreTargetRadius) {
        locked = true;
    }

    // Also check active hazards along ray path
    if (!locked) {
        for (const hazard of state.hazards) {
            if (!hazard.active) continue;
            const hdx = hazard.x - leading.x;
            const hdz = hazard.z - leading.z;
            const tProj = hdx * dirX + hdz * dirZ;
            if (tProj > 0 && tProj < 60) {
                const perpHz = Math.abs(hdx * dirZ - hdz * dirX);
                if (perpHz <= hazard.radius + 1.2) {
                    locked = true;
                    break;
                }
            }
        }
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (locked) {
        currentLockState.isLocked = true;
        currentLockState.lastLockTime = now;
    } else {
        currentLockState.isLocked = false;
    }

    return currentLockState;
}

export function getTracerLockState(): TracerLockState {
    return currentLockState;
}

export function updateOrbit(state: SimState, dt: number, isSpinningUp = false, isShieldActive = true): void {
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

    // 3. Evaluate tracer line & target lock
    evaluateTracerLock(state, isShieldActive);
}

export function launchOrbiter(
    state: SimState,
    slotIndex: number
): { vx: number; vz: number; isCrit: boolean; solidId: number; x: number; z: number } | null {
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

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const isCrit = currentLockState.lastLockTime > 0 && (now - currentLockState.lastLockTime) <= SLING_TUNING.PERFECT_WINDOW_MS;

    if (isCrit) {
        // Double launch speed / damage multiplier on perfect release crit
        solid.vx = launchVx * SLING_TUNING.CRIT_MULT;
        solid.vz = launchVz * SLING_TUNING.CRIT_MULT;
    } else {
        solid.vx = launchVx;
        solid.vz = launchVz;
    }

    const launchX = solid.x;
    const launchZ = solid.z;
    const launchedId = solid.id;

    solid.orbitSlot = -1;
    solid.spinTime = 0;
    solid.rotationsCompleted = 0;

    slot.occupied = false;
    slot.solidId = -1;

    applyRecoilImpulse(state, launchVx, launchVz, solid.mass);

    return { vx: solid.vx, vz: solid.vz, isCrit, solidId: launchedId, x: launchX, z: launchZ };
}
