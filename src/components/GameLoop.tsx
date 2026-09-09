import React from 'react';
import { useFrame } from '@react-three/fiber';
import { simState } from '../game/state';
import { gameRefs } from '../game/refs';
import { updateMarble } from '../game/systems/marble';
import { updateSolids } from '../game/systems/solids';
import { updateItems } from '../game/systems/items';
import { updateHazards } from '../game/systems/hazards';
import { updateGates } from '../game/systems/gates';
import { resolveCollisions, SimContactEvent } from '../game/systems/collisions';

interface GameLoopProps {
    onEvents?: (events: SimContactEvent[]) => void;
    timeScale?: number;
    subsystemsPowered?: number;
}

export const GameLoop: React.FC<GameLoopProps> = ({ onEvents, timeScale = 1.0, subsystemsPowered = 4 }) => {
    useFrame((_, rawDt) => {
        const jx = gameRefs.joystickVector.active ? gameRefs.joystickVector.gx : 0;
        const jz = gameRefs.joystickVector.active ? gameRefs.joystickVector.gz : 0;
        const targetVx = jx * 34;
        const targetVz = jz * 34;

        const effectiveTimeScale = simState.boss.slowmoTimer > 0 ? 0.85 * timeScale : timeScale;
        const dt = Math.min(rawDt, 0.05) * effectiveTimeScale;

        updateMarble(simState, targetVx, targetVz, dt);
        updateSolids(simState, dt, gameRefs.isPulling);
        updateItems(simState, dt);
        updateHazards(simState, dt);
        updateGates(simState, dt);

        const events = resolveCollisions(simState, dt, subsystemsPowered);

        if (events.length > 0 && onEvents) {
            onEvents(events);
        }

        gameRefs.locusPos.x = simState.marble.x;
        gameRefs.locusPos.z = simState.marble.z;
        const speed = Math.sqrt(simState.marble.vx * simState.marble.vx + simState.marble.vz * simState.marble.vz);
        gameRefs.moveVel = speed;
        gameRefs.isMoving = speed > 0.5;
    });

    return null;
};
