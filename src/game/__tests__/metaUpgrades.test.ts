import { describe, it, expect } from 'vitest';
import { getAppliedMetaEffects } from '../metaUpgrades';

describe('Meta Upgrades System', () => {
    it('applies default effects when no upgrades are purchased', () => {
        const effects = getAppliedMetaEffects([]);
        expect(effects.extraShield).toBe(0);
        expect(effects.extraMagnetRadius).toBe(0);
        expect(effects.maxOrbitSlots).toBe(4);
        expect(effects.selectedTrail).toBe('default');
    });

    it('applies starting shield, magnet, 5th slot, and trail cosmetic bonuses when purchased', () => {
        const purchased = ['start_shield_25', 'magnet_boost_5', 'fifth_orbit_slot'];
        const effects = getAppliedMetaEffects(purchased, 'cyan');
        expect(effects.extraShield).toBe(25);
        expect(effects.extraMagnetRadius).toBe(5);
        expect(effects.maxOrbitSlots).toBe(5);
        expect(effects.selectedTrail).toBe('cyan');
    });
});
