import { SimState } from '../state';
import { MARBLE_TUNING, ORBIT_TUNING } from '../tuning';
import { integrate } from '../physics';

export function updateMarble(state: SimState, targetVx: number, targetVz: number, dt: number): void {
    const marble = state.marble;

    // Calculate carried mass from occupied orbit slots / solids
    let carriedMass = 0;
    for (const slot of state.orbitSlots) {
        if (slot.occupied) {
            const solid = state.solids.find(s => s.id === slot.solidId && s.active);
            if (solid) {
                carriedMass += solid.mass;
            }
        }
    }
    marble.carriedMass = carriedMass;

    // v_max_eff = v_max / (1 + carriedMass * W_SPEED)
    const vMaxEff = MARBLE_TUNING.v_max / (1 + carriedMass * MARBLE_TUNING.W_SPEED);
    const kAccel = MARBLE_TUNING.k_accel / (1 + carriedMass * MARBLE_TUNING.W_SPEED);

    // Target velocity clamped to vMaxEff
    const targetSpeedSq = targetVx * targetVx + targetVz * targetVz;
    let tvx = targetVx;
    let tvz = targetVz;

    if (targetSpeedSq > vMaxEff * vMaxEff && targetSpeedSq > 0) {
        const scale = vMaxEff / Math.sqrt(targetSpeedSq);
        tvx *= scale;
        tvz *= scale;
    }

    // Acceleration driven: dv/dt = (v_target - v) * k_accel
    marble.vx += (tvx - marble.vx) * kAccel * dt;
    marble.vz += (tvz - marble.vz) * kAccel * dt;

    integrate(marble, dt);
}

export function applyRecoilImpulse(state: SimState, launchVx: number, launchVz: number, mass: number): void {
    const marble = state.marble;
    const recoilMag = ORBIT_TUNING.RECOIL_K * mass;
    const launchSpeed = Math.sqrt(launchVx * launchVx + launchVz * launchVz);

    if (launchSpeed > 0) {
        const dirX = launchVx / launchSpeed;
        const dirZ = launchVz / launchSpeed;
        marble.vx -= dirX * recoilMag;
        marble.vz -= dirZ * recoilMag;
    }
}
