import { createRNG } from './rng';

export interface MissionStats {
    hazardsNeutralized: number;
    perfectReleases: number;
    damageTaken: number;
    gatesPassed: number;
    itemsCollected: number;
    broadsideCount: number;
    nearMisses: number;
    sectorCleared?: boolean;
}

export interface MissionDefinition {
    id: string;
    description: string;
    creditReward: number;
    checkPredicate: (stats: MissionStats) => boolean;
}

export interface ActiveMission {
    id: string;
    description: string;
    creditReward: number;
    isCompleted: boolean;
}

export const ALL_MISSION_DEFINITIONS: MissionDefinition[] = [
    {
        id: 'smash_hazards_5',
        description: 'Smash 5 hazards with slung objects',
        creditReward: 300,
        checkPredicate: (stats) => stats.hazardsNeutralized >= 5,
    },
    {
        id: 'perfect_releases_3',
        description: 'Execute 3 perfect orbital releases',
        creditReward: 400,
        checkPredicate: (stats) => stats.perfectReleases >= 3,
    },
    {
        id: 'no_damage_sector',
        description: 'Clear sector taking 0 damage',
        creditReward: 500,
        checkPredicate: (stats) => stats.damageTaken === 0 && !!stats.sectorCleared,
    },
    {
        id: 'pass_gates_5',
        description: 'Pass 5 gates at high speed',
        creditReward: 250,
        checkPredicate: (stats) => stats.gatesPassed >= 5,
    },
    {
        id: 'collect_items_10',
        description: 'Collect 10 energy drops',
        creditReward: 200,
        checkPredicate: (stats) => stats.itemsCollected >= 10,
    },
    {
        id: 'full_broadside_1',
        description: 'Perform 1 full broadside burst (3+ slung)',
        creditReward: 350,
        checkPredicate: (stats) => stats.broadsideCount >= 1,
    },
    {
        id: 'near_miss_3',
        description: 'Execute 3 near-miss hazard dodges',
        creditReward: 300,
        checkPredicate: (stats) => stats.nearMisses >= 3,
    },
];

export function selectActiveMissions(seed: number = Date.now()): ActiveMission[] {
    const rng = createRNG(seed);
    const pool = [...ALL_MISSION_DEFINITIONS];
    const selected: MissionDefinition[] = [];

    while (selected.length < 3 && pool.length > 0) {
        const index = Math.floor(rng() * pool.length);
        selected.push(pool.splice(index, 1)[0]);
    }

    return selected.map((m) => ({
        id: m.id,
        description: m.description,
        creditReward: m.creditReward,
        isCompleted: false,
    }));
}

export function evaluateMissions(
    activeMissions: ActiveMission[],
    stats: MissionStats
): { newlyCompleted: ActiveMission[]; totalCreditsEarned: number; updatedMissions: ActiveMission[] } {
    const newlyCompleted: ActiveMission[] = [];
    let totalCreditsEarned = 0;

    const updatedMissions = activeMissions.map((mission) => {
        if (mission.isCompleted) return mission;

        const def = ALL_MISSION_DEFINITIONS.find((d) => d.id === mission.id);
        if (def && def.checkPredicate(stats)) {
            const completedMission = { ...mission, isCompleted: true };
            newlyCompleted.push(completedMission);
            totalCreditsEarned += mission.creditReward;
            return completedMission;
        }

        return mission;
    });

    return { newlyCompleted, totalCreditsEarned, updatedMissions };
}
