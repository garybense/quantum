import { describe, it, expect } from 'vitest';
import { createInitialState } from '../state';
import { updateMarble, applyRecoilImpulse } from '../systems/marble';
import { calculateOrbitRadius, calculateOrbitOmega, updateOrbit, launchOrbiter } from '../systems/orbit';
import { reflectArenaWall } from '../physics';
import { MARBLE_TUNING, ORBIT_TUNING } from '../tuning';

describe('Feel tests per MASTER_SPEC section 8', () => {
    it('marble at rest reaches 90% v_max in expected timing', () => {
        const state = createInitialState();
        const dt = 0.01;
        let time = 0;
        const targetVmax = MARBLE_TUNING.v_max;
        const target90Pct = 0.9 * targetVmax;

        while (state.marble.vx < target90Pct && time < 2.0) {
            updateMarble(state, targetVmax, 0, dt);
            time += dt;
        }

        expect(time).toBeGreaterThan(0.28);
        expect(time).toBeLessThan(0.34);
    });

    it('heavy vs light orbit radius and omega values match spec mechanics', () => {
        const lightMass = 2;
        const heavyMass = 15;

        const rLight = calculateOrbitRadius(lightMass);
        const rHeavy = calculateOrbitRadius(heavyMass);

        expect(rLight).toBeCloseTo(3.44, 2);
        expect(rHeavy).toBeCloseTo(6.3, 2);

        const omegaLight = calculateOrbitOmega(lightMass, rLight);
        const omegaHeavy = calculateOrbitOmega(heavyMass, rHeavy);

        expect(omegaLight).toBeGreaterThan(omegaHeavy);
        expect(omegaLight).toBeCloseTo(8.63, 1);
        expect(omegaHeavy).toBeCloseTo(1.72, 1);
    });

    it('mass 15 orbiter at full spin-up launches at expected velocity with tuning constants', () => {
        const state = createInitialState();
        state.solids[0].mass = 15;
        state.solids[0].active = true;

        state.orbitSlots[0] = { occupied: true, solidId: 0 };
        state.solids[0].orbitSlot = 0;

        updateOrbit(state, ORBIT_TUNING.SPINUP_TIME, true);

        const launch = launchOrbiter(state, 0);
        expect(launch).not.toBeNull();

        const speed = Math.sqrt(launch!.vx * launch!.vx + launch!.vz * launch!.vz);
        expect(speed).toBeCloseTo(27.44, 1);
    });

    it('recoil impulse correctly adjusts marble velocity', () => {
        const state = createInitialState();
        state.marble.vx = 0;
        state.marble.vz = 0;

        applyRecoilImpulse(state, 50, 0, 15);

        expect(state.marble.vx).toBeCloseTo(-5.25, 2);
        expect(state.marble.vz).toBe(0);
    });

    it('elastic reflection angle equals incident angle at arena boundary', () => {
        const state = createInitialState();
        state.marble.x = 0;
        state.marble.z = 48.5;
        state.marble.vx = 10;
        state.marble.vz = 10;

        const hit = reflectArenaWall(state.marble, 50, 1.0);
        expect(hit).toBe(true);

        expect(state.marble.vx).toBeCloseTo(10, 1);
        expect(state.marble.vz).toBeCloseTo(-10, 1);
    });
});
