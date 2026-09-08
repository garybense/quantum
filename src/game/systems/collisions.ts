import { SimState } from '../state';
import { resolveCircleCollision, reflectShieldRing } from '../physics';

export interface SimContactEvent {
    type: 'item_collected' | 'hazard_hit' | 'gate_passed' | 'shield_hit' | 'solid_collision';
    entityId: number;
    extra?: any;
}

export function resolveCollisions(state: SimState, shieldActive = true, shieldRadius = 12): SimContactEvent[] {
    const events: SimContactEvent[] = [];
    const marble = state.marble;

    if (shieldActive) {
        if (reflectShieldRing(marble, shieldRadius)) {
            events.push({ type: 'shield_hit', entityId: -1 });
        }
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

        if (s1.orbitSlot < 0 && shieldActive) {
            reflectShieldRing(s1, shieldRadius);
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
