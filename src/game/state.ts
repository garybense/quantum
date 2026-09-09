export interface CircleBody {
    x: number;
    z: number;
    vx: number;
    vz: number;
    radius: number;
    mass: number;
    active: boolean;
}

export interface MarbleState extends CircleBody {
    carriedMass: number;
}

export interface SolidBody extends CircleBody {
    id: number;
    orbitSlot: number; // -1 if free
    spinTime: number;
    rotationAngle: number; // current angle around marble if captured
    rotationsCompleted: number;
}

export interface ItemEntity {
    id: number;
    x: number;
    z: number;
    type: string;
    active: boolean;
    overcharged: boolean;
}

export interface HazardEntity extends CircleBody {
    id: number;
}

export interface GateEntity {
    id: number;
    x: number;
    z: number;
    active: boolean;
}

export interface OrbitSlot {
    occupied: boolean;
    solidId: number;
}

export interface ShieldPanelState {
    id: number;
    angleOffset: number;
    span: number;
    hp: number;
    maxHp: number;
    alive: boolean;
    regenTimer: number;
    scale: number;
}

export interface WarningArc {
    id: number;
    x: number;
    z: number;
    angle: number;
    radius: number;
    timer: number;
    duration: number;
    type: 'shockwave' | 'turret';
    active: boolean;
}

export interface BossState {
    ringRadius: number;
    ringRotation: number;
    spinSpeed: number;
    coreHp: number;
    maxCoreHp: number;
    sectorLevel: number;
    panels: ShieldPanelState[];
    warningArcs: WarningArc[];
    isVulnerable: boolean;
    vulnerabilityTimer: number;
    isEnraged: boolean;
    slowmoTimer: number;
}

export interface SimState {
    marble: MarbleState;
    solids: SolidBody[];  // max 16
    items: ItemEntity[];   // max 16
    hazards: HazardEntity[]; // max 16
    gates: GateEntity[];   // max 8
    orbitSlots: OrbitSlot[]; // max 4
    boss: BossState;
}

export function createInitialState(): SimState {
    const solids: SolidBody[] = [];
    for (let i = 0; i < 16; i++) {
        solids.push({
            id: i,
            x: 0,
            z: 0,
            vx: 0,
            vz: 0,
            radius: 1.2,
            mass: 5,
            active: false,
            orbitSlot: -1,
            spinTime: 0,
            rotationAngle: 0,
            rotationsCompleted: 0,
        });
    }

    const items: ItemEntity[] = [];
    for (let i = 0; i < 16; i++) {
        items.push({ id: i, x: 0, z: 0, type: 'aether', active: false, overcharged: false });
    }

    const hazards: HazardEntity[] = [];
    for (let i = 0; i < 16; i++) {
        hazards.push({ id: i, x: 0, z: 0, vx: 0, vz: 0, radius: 1.2, mass: 2, active: false });
    }

    const gates: GateEntity[] = [];
    for (let i = 0; i < 8; i++) {
        gates.push({ id: i, x: 0, z: 0, active: false });
    }

    const orbitSlots: OrbitSlot[] = [];
    for (let i = 0; i < 4; i++) {
        orbitSlots.push({ occupied: false, solidId: -1 });
    }

    const panels: ShieldPanelState[] = [];
    for (let i = 0; i < 6; i++) {
        panels.push({
            id: i,
            angleOffset: (Math.PI * 2 / 6) * i,
            span: (Math.PI * 2 / 6) * 0.85, // ~51 degrees arc
            hp: 400,
            maxHp: 400,
            alive: true,
            regenTimer: 0,
            scale: 1.0,
        });
    }

    const warningArcs: WarningArc[] = [];
    for (let i = 0; i < 8; i++) {
        warningArcs.push({
            id: i,
            x: 0,
            z: 0,
            angle: 0,
            radius: 0,
            timer: 0,
            duration: 0.6,
            type: 'shockwave',
            active: false,
        });
    }

    const boss: BossState = {
        ringRadius: 9.5,
        ringRotation: 0,
        spinSpeed: 0.5,
        coreHp: 1000,
        maxCoreHp: 1000,
        sectorLevel: 1,
        panels,
        warningArcs,
        isVulnerable: false,
        vulnerabilityTimer: 0,
        isEnraged: false,
        slowmoTimer: 0,
    };

    return {
        marble: {
            x: 0,
            z: 0,
            vx: 0,
            vz: 0,
            radius: 1.7,
            mass: 10,
            active: true,
            carriedMass: 0,
        },
        solids,
        items,
        hazards,
        gates,
        orbitSlots,
        boss,
    };
}

export const simState: SimState = createInitialState();
