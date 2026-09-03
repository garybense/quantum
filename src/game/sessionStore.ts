import { useSyncExternalStore } from 'react';

export interface SessionState {
    score: number;
    highScore: number;
    combo: number;
    level: number;
    xp: number;
    shield: number;
    coreIntegrity: number;
    chronoEnergy: number;
    timeScaleLabel: string;
    overchargeAmmo: number;
    gatesPassed: number;
    itemsCollected: number;
    hazardsNeutralized: number;
    maxComboAchieved: number;
    nodesAbsorbed: number;
    sectorScore: number;
    centralCoreHealth: number;
    isShieldActive: boolean;
    activeAugments: string[];
}

const defaultState: SessionState = {
    score: 0,
    highScore: 0,
    combo: 1,
    level: 1,
    xp: 0,
    shield: 100,
    coreIntegrity: 100,
    chronoEnergy: 100,
    timeScaleLabel: '1.0x',
    overchargeAmmo: 0,
    gatesPassed: 0,
    itemsCollected: 0,
    hazardsNeutralized: 0,
    maxComboAchieved: 1,
    nodesAbsorbed: 0,
    sectorScore: 0,
    centralCoreHealth: 100,
    isShieldActive: true,
    activeAugments: [],
};

let currentState: SessionState = { ...defaultState };
const listeners = new Set<() => void>();

export const sessionStore = {
    getSnapshot(): SessionState {
        return currentState;
    },
    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    setState(partial: Partial<SessionState> | ((prev: SessionState) => Partial<SessionState>)): void {
        const nextPartial = typeof partial === 'function' ? partial(currentState) : partial;
        let changed = false;
        for (const key in nextPartial) {
            const k = key as keyof SessionState;
            if (currentState[k] !== nextPartial[k]) {
                changed = true;
                break;
            }
        }
        if (changed) {
            currentState = { ...currentState, ...nextPartial };
            listeners.forEach(fn => fn());
        }
    },
    reset(): void {
        currentState = { ...defaultState };
        listeners.forEach(fn => fn());
    }
};

export function useSessionStore<T>(selector: (state: SessionState) => T): T {
    return useSyncExternalStore(
        sessionStore.subscribe,
        () => selector(sessionStore.getSnapshot()),
        () => selector(defaultState)
    );
}
