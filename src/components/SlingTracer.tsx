import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { simState } from '../game/state';
import { evaluateTracerLock } from '../game/systems/orbit';

const TRACER_DOT_COUNT = 12;
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

interface SlingTracerProps {
    isShieldActive?: boolean;
    onLockFlash?: () => void;
}

export const SlingTracer: React.FC<SlingTracerProps> = ({ isShieldActive = true, onLockFlash }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const prevLockedRef = useRef<boolean>(false);

    useFrame(() => {
        if (!meshRef.current) return;

        const lockState = evaluateTracerLock(simState, isShieldActive);

        if (!lockState.hasOrbiter || !lockState.leadingOrbiter) {
            meshRef.current.count = 0;
            prevLockedRef.current = false;
            return;
        }

        // Trigger lock flash event on transition to locked state
        if (lockState.isLocked && !prevLockedRef.current) {
            if (onLockFlash) onLockFlash();
        }
        prevLockedRef.current = lockState.isLocked;

        const originX = lockState.rayOrigin.x;
        const originZ = lockState.rayOrigin.z;
        const dirX = lockState.rayDir.x;
        const dirZ = lockState.rayDir.z;

        const isLocked = lockState.isLocked;
        const baseColor = isLocked ? '#22d3ee' : '#f59e0b';
        const dotSpacing = 2.2;

        meshRef.current.count = TRACER_DOT_COUNT;

        for (let i = 0; i < TRACER_DOT_COUNT; i++) {
            const dist = (i + 1) * dotSpacing;
            const px = originX + dirX * dist;
            const pz = originZ + dirZ * dist;

            const scaleFade = Math.max(0.15, 1.0 - (i / TRACER_DOT_COUNT) * 0.75);
            const size = (isLocked ? 0.45 : 0.35) * scaleFade;

            tempMatrix.makeScale(size, size, size);
            tempMatrix.setPosition(px, 3.5, pz);
            meshRef.current.setMatrixAt(i, tempMatrix);

            tempColor.set(baseColor);
            if (isLocked) {
                tempColor.multiplyScalar(1.5);
            }
            meshRef.current.setColorAt(i, tempColor);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, TRACER_DOT_COUNT]}
            frustumCulled={false}
        >
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
        </instancedMesh>
    );
};
