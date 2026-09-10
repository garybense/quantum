import { describe, it, expect } from 'vitest';
import { selectActiveMissions, evaluateMissions, ActiveMission, MissionStats } from '../missions';

describe('Side Missions System', () => {
    it('selects exactly 3 active missions from pool', () => {
        const missions = selectActiveMissions(12345);
        expect(missions.length).toBe(3);
        expect(missions[0].id).not.toBe(missions[1].id);
    });

    it('evaluates and completes missions when predicates are satisfied', () => {
        const activeMissions: ActiveMission[] = [
            { id: 'smash_hazards_5', description: 'Smash 5 hazards', creditReward: 300, isCompleted: false },
            { id: 'perfect_releases_3', description: '3 perfect releases', creditReward: 400, isCompleted: false },
        ];

        const stats: MissionStats = {
            hazardsNeutralized: 6,
            perfectReleases: 1,
            damageTaken: 10,
            gatesPassed: 2,
            itemsCollected: 4,
            broadsideCount: 0,
            nearMisses: 0,
        };

        const result = evaluateMissions(activeMissions, stats);
        expect(result.newlyCompleted.length).toBe(1);
        expect(result.newlyCompleted[0].id).toBe('smash_hazards_5');
        expect(result.totalCreditsEarned).toBe(300);
        expect(result.updatedMissions[0].isCompleted).toBe(true);
        expect(result.updatedMissions[1].isCompleted).toBe(false);
    });
});
