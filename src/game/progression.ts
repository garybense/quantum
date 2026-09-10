import { Preferences } from '@capacitor/preferences';

export type MedalTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface SectorMedalCriteria {
    goldTimeSec: number;
    silverTimeSec: number;
    goldMaxDamage: number;
    silverMaxDamage: number;
    goldMinPerfects: number;
    silverMinPerfects: number;
}

const DEFAULT_CRITERIA: SectorMedalCriteria = {
    goldTimeSec: 60,
    silverTimeSec: 120,
    goldMaxDamage: 20,
    silverMaxDamage: 50,
    goldMinPerfects: 3,
    silverMinPerfects: 1,
};

const SECTOR_CRITERIA: Record<number, SectorMedalCriteria> = {
    1: { goldTimeSec: 60, silverTimeSec: 120, goldMaxDamage: 20, silverMaxDamage: 50, goldMinPerfects: 2, silverMinPerfects: 1 },
    2: { goldTimeSec: 90, silverTimeSec: 150, goldMaxDamage: 30, silverMaxDamage: 60, goldMinPerfects: 3, silverMinPerfects: 2 },
    3: { goldTimeSec: 120, silverTimeSec: 180, goldMaxDamage: 40, silverMaxDamage: 80, goldMinPerfects: 4, silverMinPerfects: 2 },
};

export function calculateSectorMedal(
    sectorLevel: number,
    breachTimeSec: number,
    damageTaken: number,
    perfectReleases: number
): MedalTier {
    const criteria = SECTOR_CRITERIA[sectorLevel] || DEFAULT_CRITERIA;

    const timeGold = breachTimeSec <= criteria.goldTimeSec;
    const timeSilver = breachTimeSec <= criteria.silverTimeSec;

    const dmgGold = damageTaken <= criteria.goldMaxDamage;
    const dmgSilver = damageTaken <= criteria.silverMaxDamage;

    const perfGold = perfectReleases >= criteria.goldMinPerfects;
    const perfSilver = perfectReleases >= criteria.silverMinPerfects;

    if (timeGold && dmgGold && perfGold) {
        return 'gold';
    }

    const goldCount = (timeGold ? 1 : 0) + (dmgGold ? 1 : 0) + (perfGold ? 1 : 0);
    const silverCount = (timeSilver ? 1 : 0) + (dmgSilver ? 1 : 0) + (perfSilver ? 1 : 0);

    if (goldCount >= 2 || (timeSilver && dmgSilver && perfSilver)) {
        return 'silver';
    }

    if (goldCount >= 1 || silverCount >= 1) {
        return 'bronze';
    }

    return 'bronze';
}

export function getMedalBonusCredits(medal: MedalTier): number {
    switch (medal) {
        case 'gold':
            return 1000;
        case 'silver':
            return 500;
        case 'bronze':
            return 250;
        default:
            return 0;
    }
}

const MEDAL_STORAGE_KEY = 'sector_medals';

const MEDAL_RANK: Record<MedalTier, number> = {
    none: 0,
    bronze: 1,
    silver: 2,
    gold: 3,
};

export async function getSavedSectorMedals(): Promise<Record<number, MedalTier>> {
    try {
        const { value } = await Preferences.get({ key: MEDAL_STORAGE_KEY });
        if (value) {
            return JSON.parse(value);
        }
    } catch (e) {
        console.warn('Failed to load sector medals:', e);
    }
    return {};
}

export async function saveSectorMedal(sectorLevel: number, medal: MedalTier): Promise<Record<number, MedalTier>> {
    const currentMedals = await getSavedSectorMedals();
    const existingMedal = currentMedals[sectorLevel] || 'none';

    if (MEDAL_RANK[medal] > MEDAL_RANK[existingMedal]) {
        currentMedals[sectorLevel] = medal;
        try {
            await Preferences.set({
                key: MEDAL_STORAGE_KEY,
                value: JSON.stringify(currentMedals),
            });
        } catch (e) {
            console.warn('Failed to save sector medal:', e);
        }
    }

    return currentMedals;
}
