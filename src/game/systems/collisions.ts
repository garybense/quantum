import { SimState } from '../state';
import { resolveCircleCollision, reflectShieldRing } from '../physics';
import { getPanelAtAngle, damageShieldPanel, damageBossCore, updateBoss, BossContactEvent } from './boss';
import { SLING_TUNING } from '../tuning';

export interface SimContactEvent {
    type: 'item_collected' | 'hazard_hit' | 'gate_passed' | 'shield_hit' | 'solid_collision' | 'panel_hit' | 'panel_shattered' | 'core_hit' | 'vulnerability_started' | 'counterattack_triggered';
    entityId: number;
    extra?: any;
}

export function resolveCollisions(state: SimState, dt = 0.016, subsystemsPowered = 4): SimContactEvent[] {
    const events: SimContactEvent[] = [];
    const marble = state.marble;

    // Update Boss System
    const bossEvents = updateBoss(state, dt, subsystemsPowered);
    for (const be of bossEvents) {
        events.push({
            type: be.type,
            entityId: be.panelIndex ?? -1,
            extra: { damage: be.damage, crit: be.crit }
        });
    }

    // Marble vs Shield Ring Collision
    const distMarble = Math.sqrt(marble.x * marble.x + marble.z * marble.z);
    const ringR = state.boss.ringRadius;
    if (distMarble >= ringR - 1.2 && distMarble <= ringR + 1.2) {
        const marbleAngle = Math.atan2(marble.z, marble.x);
        const panelIdx = getPanelAtAngle(state, marbleAngle);
        if (panelIdx !== -1) {
            // Hit an active shield panel -> reflect & modest self-damage
            if (reflectShieldRing(marble, ringR)) {
                events.push({ type: 'shield_hit', entityId: panelIdx, extra: { damage: 25 } });
            }
        }
    } else if (distMarble <= 2.5) {
        // Marble near core -> bounce
        reflectShieldRing(marble, 2.5);
    }

    for (const item of state.items) {
        if (!item.active) continue;
        const dx = marble.x - item.x;
        const dz = marble.z - item.z;
        const minDist = marble.radius + 1.0;
        if (dx * dx + dz * dz <= minDist * minDist) {
            item.active = false;
            events.push({ type: 'item_collected', entityId: item.id, extra: { itemType: item.type, overcharged: item.overcharged } });
        }
    }

    for (const hazard of state.hazards) {
        if (!hazard.active) continue;
        const dx = marble.x - hazard.x;
        const dz = marble.z - hazard.z;
        const minDist = marble.radius + 1.2;
        if (dx * dx + dz * dz <= minDist * minDist) {
            hazard.active = false;
            events.push({ type: 'hazard_hit', entityId: hazard.id });
        }
    }

    for (const gate of state.gates) {
        if (!gate.active) continue;
        const dx = marble.x - gate.x;
        const dz = marble.z - gate.z;
        const minDist = marble.radius + 2.5;
        if (dx * dx + dz * dz <= minDist * minDist) {
            events.push({ type: 'gate_passed', entityId: gate.id });
        }
    }

    for (let i = 0; i < state.solids.length; i++) {
        const s1 = state.solids[i];
        if (!s1.active) continue;

        // Slung Object vs Shield Ring / Core
        if (s1.orbitSlot < 0) {
            const distSolid = Math.sqrt(s1.x * s1.x + s1.z * s1.z);
            if (distSolid >= ringR - 1.5 && distSolid <= ringR + 1.5) {
                const angle = Math.atan2(s1.z, s1.x);
                const panelIdx = getPanelAtAngle(state, angle);
                if (panelIdx !== -1) {
                    // Hit active panel! Calculate kinetic energy damage
                    const speedSq = s1.vx * s1.vx + s1.vz * s1.vz;
                    const damage = 0.5 * s1.mass * speedSq * SLING_TUNING.DMG_K * SLING_TUNING.DMG_SCALE;
                    const pEvents = damageShieldPanel(state, panelIdx, damage, false);
                    for (const pe of pEvents) {
                        events.push({
                            type: pe.type,
                            entityId: panelIdx,
                            extra: { damage: pe.damage, crit: pe.crit }
                        });
                    }
                    reflectShieldRing(s1, ringR);
                }
            } else if (distSolid <= 3.0) {
                // Slung object reached core through gap
                const speedSq = s1.vx * s1.vx + s1.vz * s1.vz;
                const damage = 0.5 * s1.mass * speedSq * SLING_TUNING.DMG_K * SLING_TUNING.DMG_SCALE;
                const cEvents = damageBossCore(state, damage, false);
                for (const ce of cEvents) {
                    events.push({
                        type: ce.type,
                        entityId: -1,
                        extra: { damage: ce.damage, crit: ce.crit }
                    });
                }
                reflectShieldRing(s1, 3.0);
            }
        }

        for (let j = i + 1; j < state.solids.length; j++) {
            const s2 = state.solids[j];
            if (!s2.active) continue;
            if (s1.orbitSlot < 0 || s2.orbitSlot < 0) {
                if (resolveCircleCollision(s1, s2)) {
                    events.push({ type: 'solid_collision', entityId: s1.id, extra: { otherId: s2.id } });
                }
            }
        }
    }

    return events;
}
