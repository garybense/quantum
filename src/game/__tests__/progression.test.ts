import { describe, it, expect } from 'vitest';
import { calculateSectorMedal, getMedalBonusCredits } from '../progression';

describe('Sector Progression & Medal System', () => {
    it('awards gold medal when time, damage, and perfect release criteria are met', () => {
        const medal = calculateSectorMedal(1, 45, 10, 3);
        expect(medal).toBe('gold');
    });

    it('awards silver medal when performance meets silver criteria', () => {
        const medal = calculateSectorMedal(1, 100, 40, 1);
        expect(medal).toBe('silver');
    });

    it('awards bronze medal when sector is cleared under basic conditions', () => {
        const medal = calculateSectorMedal(1, 200, 100, 0);
        expect(medal).toBe('bronze');
    });

    it('returns correct credit bonuses for medal tiers', () => {
        expect(getMedalBonusCredits('gold')).toBe(1000);
        expect(getMedalBonusCredits('silver')).toBe(500);
        expect(getMedalBonusCredits('bronze')).toBe(250);
        expect(getMedalBonusCredits('none')).toBe(0);
    });
});
