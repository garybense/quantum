import { describe, it, expect } from 'vitest';
import { feelManager } from '../feel';
import { getDailySeed } from '../rng';

describe('Audio & Feel Systems', () => {
    it('feelManager triggerZoomPulse sets and decays zoom pulse factor', () => {
        feelManager.triggerZoomPulse(0.12);
        expect(feelManager.getZoomPulse()).toBeCloseTo(0.12);

        feelManager.update(0.1);
        expect(feelManager.getZoomPulse()).toBeLessThan(0.12);
    });

    it('getDailySeed returns consistent deterministic seed for date strings', () => {
        const seed1 = getDailySeed('2026-08-31');
        const seed2 = getDailySeed('2026-08-31');
        const seed3 = getDailySeed('2026-09-01');

        expect(seed1).toBe(seed2);
        expect(seed1).not.toBe(seed3);
        expect(seed1).toBeGreaterThan(0);
    });
});
