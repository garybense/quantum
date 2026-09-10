import { Preferences } from '@capacitor/preferences';

export interface MetaUpgradeDefinition {
    id: string;
    name: string;
    description: string;
    costCredits: number;
    category: 'start_shield' | 'magnet' | 'fifth_orbit' | 'trail_cosmetic';
    value: number | string;
    badge: string;
    perk: string;
}

export const META_UPGRADES: MetaUpgradeDefinition[] = [
    {
        id: 'start_shield_25',
        name: 'Nanoshield Core Buffer',
        description: 'Permanently increases starting shield capacity by +25.',
        costCredits: 1000,
        category: 'start_shield',
        value: 25,
        badge: 'SHIELD BOOST',
        perk: '+25 Starting Shield',
    },
    {
        id: 'magnet_boost_5',
        name: 'Quantum Attraction Field',
        description: 'Permanently expands item collection magnet radius by +5 units.',
        costCredits: 1500,
        category: 'magnet',
        value: 5,
        badge: 'MAGNET EXPANSION',
        perk: '+5 Magnet Radius',
    },
    {
        id: 'fifth_orbit_slot',
        name: 'Penta-Orbital Ring Array',
        description: 'Permanently unlocks a 5th orbital capture slot around the marble.',
        costCredits: 3000,
        category: 'fifth_orbit',
        value: 5,
        badge: 'ORBIT CAPACITY',
        perk: '5th Orbital Slot',
    },
    {
        id: 'trail_cyan',
        name: 'Cyber-Cyan Vector Trail',
        description: 'Cosmetic trail upgrade: High-frequency cyan matrix energy ribbon.',
        costCredits: 2000,
        category: 'trail_cosmetic',
        value: 'cyan',
        badge: 'TRAIL COSMETIC',
        perk: 'Cyan Neon Ribbon',
    },
    {
        id: 'trail_gold',
        name: 'Solar-Gold Resonance Trail',
        description: 'Cosmetic trail upgrade: Hyper-intense amber gold flame ribbon.',
        costCredits: 2000,
        category: 'trail_cosmetic',
        value: 'gold',
        badge: 'TRAIL COSMETIC',
        perk: 'Solar Gold Ribbon',
    },
];

const KEYS = {
    UPGRADES: 'meta_upgrades_purchased',
    CREDITS: 'player_credits',
    SELECTED_TRAIL: 'selected_trail_cosmetic',
};

export async function getSavedPurchasedUpgrades(): Promise<string[]> {
    try {
        const { value } = await Preferences.get({ key: KEYS.UPGRADES });
        if (value) {
            return JSON.parse(value);
        }
    } catch (e) {
        console.warn('Failed to load purchased upgrades:', e);
    }
    return [];
}

export async function savePurchasedUpgrades(upgrades: string[]): Promise<void> {
    try {
        await Preferences.set({
            key: KEYS.UPGRADES,
            value: JSON.stringify(upgrades),
        });
    } catch (e) {
        console.warn('Failed to save purchased upgrades:', e);
    }
}

export async function getSavedPlayerCredits(): Promise<number> {
    try {
        const { value } = await Preferences.get({ key: KEYS.CREDITS });
        if (value !== null && value !== undefined) {
            return parseInt(value, 10) || 0;
        }
    } catch (e) {
        console.warn('Failed to load player credits:', e);
    }
    return 0;
}

export async function savePlayerCredits(credits: number): Promise<void> {
    try {
        await Preferences.set({
            key: KEYS.CREDITS,
            value: Math.max(0, Math.floor(credits)).toString(),
        });
    } catch (e) {
        console.warn('Failed to save player credits:', e);
    }
}

export async function getSavedSelectedTrailCosmetic(): Promise<string> {
    try {
        const { value } = await Preferences.get({ key: KEYS.SELECTED_TRAIL });
        if (value) return value;
    } catch (e) {
        console.warn('Failed to load selected trail cosmetic:', e);
    }
    return 'default';
}

export async function saveSelectedTrailCosmetic(trailId: string): Promise<void> {
    try {
        await Preferences.set({
            key: KEYS.SELECTED_TRAIL,
            value: trailId,
        });
    } catch (e) {
        console.warn('Failed to save selected trail cosmetic:', e);
    }
}

export interface AppliedMetaEffects {
    extraShield: number;
    extraMagnetRadius: number;
    maxOrbitSlots: number;
    selectedTrail: string;
}

export function getAppliedMetaEffects(
    purchasedUpgrades: string[],
    selectedTrail: string = 'default'
): AppliedMetaEffects {
    let extraShield = 0;
    let extraMagnetRadius = 0;
    let maxOrbitSlots = 4;

    if (purchasedUpgrades.includes('start_shield_25')) {
        extraShield += 25;
    }
    if (purchasedUpgrades.includes('magnet_boost_5')) {
        extraMagnetRadius += 5;
    }
    if (purchasedUpgrades.includes('fifth_orbit_slot')) {
        maxOrbitSlots = 5;
    }

    return {
        extraShield,
        extraMagnetRadius,
        maxOrbitSlots,
        selectedTrail,
    };
}
