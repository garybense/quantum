import { SectorDefinition } from '../types';

export const SECTOR_DEFINITIONS: SectorDefinition[] = [
    {
        sectorLevel: 1,
        title: 'GRID SECTOR 1: NEURAL IGNITION',
        subtitle: 'Core Calibration & Sub-Grid Reconstruction',
        grandNarrative: 'THE RESTORATION OF THE CENTRAL GRID: Dark Void corruption has protected the central processing core behind a heavy spatial forcefield shield. You must collect Gates, Cyber Drops, Swarm Nodes, and build Combos to set the machine in motion, lower the shield, charge your kinetic ammo in ground rings, and fling objects to destroy the central core!',
        description: 'Set machine subsystems in motion by reaching collection thresholds. Hover in ground charging rings to overcharge kinetic ammo and fling projectiles to destroy the Central Singularity Core.',
        strategyTip: 'Collect 2 Gates, 3 Drops, 8 Nodes, and maintain a 2x Combo to unlock machine motion and lower the core shield! Hover in glowing ground circles to charge 3x Overcharge Ammo!',
        unlockedStateChange: {
            systemName: 'PLASMA EMP DISCHARGE MATRIX',
            description: 'Unlocks automated hazard neutralization and shockwave discharge capability (+50% EMP Blast Radius).',
        },
        targets: {
            gatesPassedTarget: 25,
            itemsCollectedTarget: 30,
            hazardsNeutralizedTarget: 10,
            comboTarget: 4,
            nodesAbsorbedTarget: 60,
            targetScore: 25000,
            gateThreshold: 12,
            dropThreshold: 15,
            comboThreshold: 3,
            nodeThreshold: 35,
            centralCoreMaxHealth: 1000,
        }
    },
    {
        sectorLevel: 2,
        title: 'GRID SECTOR 2: CHRONOS SYNCHRO-MESH ZONE',
        subtitle: 'Clockwork Gear Alignment & Core Disruption',
        grandNarrative: 'CHRONOS SYNCHRO-MESH ACTIVATION: The secondary core is guarded by counter-rotating clockwork cogs! Collect enough gates to engage the gear mesh, power up the outer rings with drops, and overcharge kinetic projectiles in ground rings to obliterate the Chronos Core.',
        description: 'Maneuver through counter-rotating Chronos Synchro-Mesh gears, activate all 4 machine subsystems, and fling heavy physics shapes at the central core.',
        strategyTip: 'When all 4 machine parts are moving, the central shield collapses! Use Overcharged projectiles to deal massive 3x damage to the core!',
        unlockedStateChange: {
            systemName: 'CHRONO-TACHYON OVERCHARGE CANNON (T-1 BEAM)',
            description: 'Weapon acquired at the end of Sector 2! Fires a high-frequency tachyon temporal pulse beam required to breach Sector 3 Quantum Resonance Shields.',
        },
        targets: {
            gatesPassedTarget: 35,
            itemsCollectedTarget: 40,
            hazardsNeutralizedTarget: 15,
            comboTarget: 5,
            nodesAbsorbedTarget: 80,
            targetScore: 45000,
            gateThreshold: 18,
            dropThreshold: 20,
            comboThreshold: 4,
            nodeThreshold: 45,
            centralCoreMaxHealth: 1500,
        }
    },
    {
        sectorLevel: 3,
        title: 'GRID SECTOR 3: QUANTUM RESONANCE RELAY',
        subtitle: 'Quantum Shield Penetration & Kinetic Bombardment',
        grandNarrative: 'QUANTUM RESONANCE DISRUPTION: High-frequency void data streams shield the relay core. Reaching collection thresholds accelerates machine rotors to maximum speed and exposes the core for total destruction.',
        description: 'Breach dense Void Resonance Shields by setting machine subsystems into high-speed motion, then fling overcharged projectiles directly into the relay core.',
        strategyTip: 'Collect drops and nodes rapidly! Higher collection counts incrementally speed up machine rotation, amplifying core damage output.',
        unlockedStateChange: {
            systemName: 'GRAVITON ATTRACTOR MAGNET FIELD',
            description: 'Pulls energy drops, swarm nodes, and kinetic power cells directly into your core from extended spatial distance.',
        },
        targets: {
            gatesPassedTarget: 45,
            itemsCollectedTarget: 50,
            hazardsNeutralizedTarget: 20,
            comboTarget: 6,
            nodesAbsorbedTarget: 100,
            targetScore: 70000,
            gateThreshold: 22,
            dropThreshold: 25,
            comboThreshold: 5,
            nodeThreshold: 55,
            centralCoreMaxHealth: 2200,
        }
    },
    {
        sectorLevel: 4,
        title: 'GRID SECTOR 4: XENON ION VORTEX',
        subtitle: 'Ion Jet Acceleration & High-Velocity Flinging',
        grandNarrative: 'XENON ION VORTEX ENGAGED: Xenon ion jets spin in tight orbital arcs around the core. Overcharge kinetic ammo in ground charging rings to pierce through residual shields and destroy the ion core.',
        description: 'Gather Xenon energy drops and shear gates to accelerate the Ion Vortex, charge up in ground circles, and launch high-mass physics shapes.',
        strategyTip: 'Overcharge Ammo can pierce partial shields even before all subsystems reach maximum speed!',
        unlockedStateChange: {
            systemName: 'XENON ION BOOST INJECTOR',
            description: 'Instantly charges ground resonance circles twice as fast and adds +40% fling impact velocity.',
        },
        targets: {
            gatesPassedTarget: 55,
            itemsCollectedTarget: 60,
            hazardsNeutralizedTarget: 25,
            comboTarget: 6,
            nodesAbsorbedTarget: 120,
            targetScore: 100000,
            gateThreshold: 28,
            dropThreshold: 30,
            comboThreshold: 5,
            nodeThreshold: 65,
            centralCoreMaxHealth: 3000,
        }
    },
    {
        sectorLevel: 5,
        title: 'GRID SECTOR 5: BIFURCATION HORIZON',
        subtitle: 'Dual-Vector Orbital Instability',
        grandNarrative: 'BIFURCATION HORIZON DISRUPTION: Twin orbital nodes split space-time around the central core. Synchronize all 4 machine subsystems to force the dual horizon into alignment and expose the central core.',
        description: 'Harmonize the dual bifurcation nodes by reaching node, gate, drop, and combo thresholds, then fling orbital shapes at the exposed core.',
        strategyTip: 'Maintain a 4x combo or higher to keep Subsystem 4 running at maximum RPM while slinging projectiles.',
        unlockedStateChange: {
            systemName: 'BIFURCATION GRAVITY COMPACTOR',
            description: 'Allows slung objects to pull secondary debris along with them for multi-impact core strikes.',
        },
        targets: {
            gatesPassedTarget: 65,
            itemsCollectedTarget: 70,
            hazardsNeutralizedTarget: 30,
            comboTarget: 7,
            nodesAbsorbedTarget: 140,
            targetScore: 140000,
            gateThreshold: 32,
            dropThreshold: 35,
            comboThreshold: 6,
            nodeThreshold: 80,
            centralCoreMaxHealth: 4000,
        }
    },
    {
        sectorLevel: 6,
        title: 'GRID SECTOR 6: HYPERARC CONDUIT',
        subtitle: 'Graviton Super-Collider Matrix',
        grandNarrative: 'HYPERARC SUPER-COLLIDER: High-voltage arc conduits encircle the core. Flinging objects through overcharged ground circles electrifies your projectiles with hyperarc plasma.',
        description: 'Charge up in ground resonance rings and fling plasma-electrified projectiles into the HyperArc core.',
        strategyTip: 'Hyperarc plasma projectiles explode on core impact, dealing collateral area damage to surrounding hazards.',
        unlockedStateChange: {
            systemName: 'HYPERARC PLASMA CHARGER',
            description: 'Amplifies ground charger ring energy output by +100% and extends overcharge duration.',
        },
        targets: {
            gatesPassedTarget: 75,
            itemsCollectedTarget: 80,
            hazardsNeutralizedTarget: 35,
            comboTarget: 7,
            nodesAbsorbedTarget: 160,
            targetScore: 190000,
            gateThreshold: 38,
            dropThreshold: 40,
            comboThreshold: 6,
            nodeThreshold: 95,
            centralCoreMaxHealth: 5000,
        }
    },
    {
        sectorLevel: 7,
        title: 'GRID SECTOR 7: HYDRA FRACTAL CORE',
        subtitle: 'Multi-Vector Triangular Resonance',
        grandNarrative: 'HYDRA FRACTAL CONTAINMENT: Triangular fractal blades protect the central node. Collect swarm nodes and shear gates to force the Hydra blades into a locked open state.',
        description: 'Force the Hydra fractal blades to retract by activating all 4 machine subsystems, then fling heavy spheres into the exposed core.',
        strategyTip: 'Collect 20 Swarm Nodes to unlock Hydra Rotor motion and speed up the blade retraction.',
        unlockedStateChange: {
            systemName: 'HYDRA FRACTAL REPEATER',
            description: 'Flinging a projectile creates a secondary kinetic echo projectile heading towards the central core.',
        },
        targets: {
            gatesPassedTarget: 85,
            itemsCollectedTarget: 90,
            hazardsNeutralizedTarget: 40,
            comboTarget: 7,
            nodesAbsorbedTarget: 180,
            targetScore: 250000,
            gateThreshold: 42,
            dropThreshold: 45,
            comboThreshold: 7,
            nodeThreshold: 110,
            centralCoreMaxHealth: 6500,
        }
    },
    {
        sectorLevel: 8,
        title: 'GRID SECTOR 8: TENSOR NETWORK CONTAINMENT',
        subtitle: 'Relativistic Tensor Field Stabilization',
        grandNarrative: 'TENSOR NETWORK CRUNCH: Relativistic polyhedral nodes form a dense tensor network around the core. Overcharge kinetic ammo in ground circles to shatter tensor links.',
        description: 'Break through the tensor network shield by reaching all subsystem collection targets and flinging heavy physics shapes.',
        strategyTip: 'Ground circles appear more frequently in Sector 8—use them to keep continuous Overcharge Ammo loaded!',
        unlockedStateChange: {
            systemName: 'TENSOR FIELD OVERRIDE',
            description: 'Reduces shield strength of all subsequent sector cores by 25%.',
        },
        targets: {
            gatesPassedTarget: 95,
            itemsCollectedTarget: 100,
            hazardsNeutralizedTarget: 45,
            comboTarget: 8,
            nodesAbsorbedTarget: 200,
            targetScore: 320000,
            gateThreshold: 48,
            dropThreshold: 50,
            comboThreshold: 7,
            nodeThreshold: 130,
            centralCoreMaxHealth: 8000,
        }
    },
    {
        sectorLevel: 9,
        title: 'GRID SECTOR 9: HYPER-RIEMANNIAN FOLD',
        subtitle: 'Dimensional Curvature Core Collapsing',
        grandNarrative: 'HYPER-RIEMANNIAN FOLD: Curvature in space-time creates intense gravitational drag around the core. Only high-velocity slung projectiles charged in ground rings can reach the center.',
        description: 'Overcome gravitational warp by overcharging kinetic ammo in ground rings and launching high-speed slung strikes.',
        strategyTip: 'Combine gravity tilt adjustments with kinetic slingshots to achieve maximum core impact velocity!',
        unlockedStateChange: {
            systemName: 'RIEMANNIAN GRAVITY DRIVE',
            description: 'Grants full orbital trajectory stabilization and maximum slinging force.',
        },
        targets: {
            gatesPassedTarget: 105,
            itemsCollectedTarget: 110,
            hazardsNeutralizedTarget: 50,
            comboTarget: 8,
            nodesAbsorbedTarget: 220,
            targetScore: 400000,
            gateThreshold: 52,
            dropThreshold: 55,
            comboThreshold: 8,
            nodeThreshold: 150,
            centralCoreMaxHealth: 10000,
        }
    },
    {
        sectorLevel: 10,
        title: 'GRID SECTOR 10: UNIFIED ABSOLUTE EVENT HORIZON',
        subtitle: 'Total Grid Restoration & Core Annihilation',
        grandNarrative: 'THE FINAL UNIFIED CORE: The central supercomputer core is operating at maximum void corruption! Activate all 4 machine subsystems, charge overcharge ammo in ground rings, and deliver the final kinetic blow to restore the neural grid forever!',
        description: 'Achieve total machine activation across all 4 subsystems, lower the final event horizon shield, and destroy the ultimate Singularity Core!',
        strategyTip: 'Utilize every tool in your arsenal—overcharge ground circles, slingshots, and combo multipliers—to obliterate the final core health bar!',
        unlockedStateChange: {
            systemName: 'APEX GRID MASTER SINGULARITY CORE',
            description: 'Full neural grid restoration achieved! Grants infinite combo resonance, maximum shield capacitor, and total system mastery.',
        },
        targets: {
            gatesPassedTarget: 120,
            itemsCollectedTarget: 120,
            hazardsNeutralizedTarget: 60,
            comboTarget: 9,
            nodesAbsorbedTarget: 250,
            targetScore: 500000,
            gateThreshold: 60,
            dropThreshold: 60,
            comboThreshold: 8,
            nodeThreshold: 180,
            centralCoreMaxHealth: 12500,
        }
    }
];

export function getSectorDefinition(level: number): SectorDefinition {
    const index = Math.min(level - 1, SECTOR_DEFINITIONS.length - 1);
    const base = SECTOR_DEFINITIONS[index];
    if (level <= SECTOR_DEFINITIONS.length) {
        return base;
    }
    const multiplier = level - 10;
    return {
        sectorLevel: level,
        title: `GRID SECTOR ${level}: HYPER-SINGULARITY ${level}`,
        subtitle: `Extreme Grid Restructure Tier ${multiplier + 1}`,
        grandNarrative: `NEURAL GRID RESTORATION TIER ${level}: Deep grid sector requiring advanced kinetic management to maintain core integrity against void degradation.`,
        description: `Deep grid sector with extreme Void Hazard density and erratic temporal distortions.`,
        strategyTip: `Leverage all synthesized systems (EMP, Chrono Stasis, Attractor Field) to survive high-speed hazard swarms and destroy the central core.`,
        unlockedStateChange: {
            systemName: `OVERCLOCK MODULE TIER ${multiplier + 1}`,
            description: `Boosts core performance, shield capacity, and score multiplier by +${(multiplier + 1) * 10}%.`,
        },
        targets: {
            gatesPassedTarget: 30 + multiplier * 4,
            itemsCollectedTarget: 30 + multiplier * 4,
            hazardsNeutralizedTarget: 20 + multiplier * 4,
            comboTarget: Math.min(10, 8 + Math.floor(multiplier / 2)),
            nodesAbsorbedTarget: 70 + multiplier * 10,
            targetScore: 100000 + multiplier * 25000,
            gateThreshold: Math.min(15, 8 + multiplier),
            dropThreshold: Math.min(15, 8 + multiplier),
            comboThreshold: Math.min(8, 7 + Math.floor(multiplier / 2)),
            nodeThreshold: Math.min(40, 30 + multiplier * 2),
            centralCoreMaxHealth: 300 + multiplier * 50,
        }
    };
}

