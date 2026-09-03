import * as THREE from 'three';

export type CyberItemType = 'shield' | 'multiplier' | 'emp' | 'magnet' | 'nanite';

export interface CyberItemDrop {
    id: string;
    type: CyberItemType;
    position: [number, number, number];
    createdAt: number;
    size: number;
    chargeLevel?: number; // Accumulates over time (1.0 to 2.5x) for double rewards!
}

export interface CyberAugment {
    id: string;
    name: string;
    description: string;
    category: 'defense' | 'offense' | 'utility' | 'graviton';
    statBoost: string;
    icon: string;
}

export interface RogueVoidHazard {
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
    size: number;
    speed: number;
    pulsePhase: number;
}

export interface DimensionalShearGate {
    id: string;
    position: [number, number, number];
    rotation: number;
    passed: boolean;
    age?: number;
    chargeLevel?: number;
    imploded?: boolean;
}

export interface PlayerStats {
    coreIntegrity: number;
    maxCore: number;
    shield: number;
    maxShield: number;
    shieldRegenRate: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    score: number;
    highScore: number;
    combo: number;
    comboTimer: number;
    highestCombo: number;
    moveSpeed: number;
    gravitonForce: number;
    magnetRadius: number;
    empShocks: number;
    activeItems: { type: CyberItemType; expiresAt: number }[];
    augments: string[];
}

export type DynamicTimeScale = number;

export interface TemporalState {
    timeScale: DynamicTimeScale;
    chronoEnergy: number;
    maxChronoEnergy: number;
    isRewinding: boolean;
    rewindTimer: number;
    activeModeLabel: string;
}

export interface LeaderboardEntry {
    id: string;
    pilotName: string;
    score: number;
    level: number;
    highestCombo: number;
    date: string;
    rank: number;
    title: string;
}

export interface SectorObjectiveTarget {
    gatesPassedTarget: number;
    itemsCollectedTarget: number;
    hazardsNeutralizedTarget: number;
    comboTarget: number;
    nodesAbsorbedTarget: number;
    targetScore?: number;
    // Subsystem Activation Thresholds (Minimum required before machinework begins motion)
    gateThreshold: number;
    dropThreshold: number;
    comboThreshold: number;
    nodeThreshold: number;
    // Central Core Destruction Objectives
    centralCoreMaxHealth: number;
}

export interface RequiredStateChange {
    systemName: string;
    description: string;
    requirementReason?: string;
}

export interface SectorDefinition {
    sectorLevel: number;
    title: string;
    subtitle: string;
    description: string;
    grandNarrative: string;
    strategyTip: string;
    unlockedStateChange: RequiredStateChange;
    targets: SectorObjectiveTarget;
}

export interface SectorProgress {
    sectorLevel: number;
    gatesPassed: number;
    itemsCollected: number;
    hazardsNeutralized: number;
    maxComboAchieved: number;
    nodesAbsorbed: number;
    sectorScore: number;
    // Central Core Integrity & Overcharge Ammunition
    centralCoreHealth: number;
    overchargeAmmo: number;
    isShieldActive: boolean;
}

