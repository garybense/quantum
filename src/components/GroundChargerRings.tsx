import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Ring, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface GroundChargerRingData {
    id: string;
    position: [number, number, number];
    radius: number;
    active: boolean;
}

interface GroundChargerRingsProps {
    rings: GroundChargerRingData[];
    locusPos: THREE.Vector3 | null;
    onChargePlayer: (chargeAmount: number) => void;
    isPaused?: boolean;
}

export function GroundChargerRings({
    rings,
    locusPos,
    onChargePlayer,
    isPaused = false,
}: GroundChargerRingsProps) {
    const ringGroupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (isPaused || !locusPos) return;

        const time = state.clock.getElapsedTime();

        rings.forEach((ring) => {
            if (!ring.active) return;

            const dx = locusPos.x - ring.position[0];
            const dz = locusPos.z - ring.position[2];
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < ring.radius + 1.2) {
                // Player is inside the ground charging circle! Charge overcharge ammo rapidly!
                onChargePlayer(delta * 75.0);
            }
        });

        if (ringGroupRef.current) {
            ringGroupRef.current.children.forEach((child, idx) => {
                child.rotation.y = time * (0.8 + idx * 0.3);
            });
        }
    });

    return (
        <group ref={ringGroupRef}>
            {rings.map((ring, idx) => {
                const isPlayerInside = locusPos 
                    ? Math.sqrt(Math.pow(locusPos.x - ring.position[0], 2) + Math.pow(locusPos.z - ring.position[2], 2)) < ring.radius + 1.2 
                    : false;

                const colorHex = isPlayerInside ? "#fbbf24" : "#06b6d4";
                const emissiveHex = isPlayerInside ? "#f59e0b" : "#38bdf8";

                return (
                    <group key={ring.id} position={ring.position}>
                        {/* Outer Glowing Floor Ring */}
                        <Ring args={[ring.radius, ring.radius + 0.6, 24]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshStandardMaterial 
                                color={colorHex} 
                                emissive={emissiveHex} 
                                emissiveIntensity={isPlayerInside ? 3.5 : 1.8} 
                                transparent 
                                opacity={isPlayerInside ? 0.9 : 0.6}
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </Ring>

                        {/* Inner Concentric Pulse Ring */}
                        <Ring args={[ring.radius * 0.4, ring.radius * 0.55, 18]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial 
                                color={colorHex} 
                                transparent 
                                opacity={isPlayerInside ? 0.95 : 0.45} 
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </Ring>

                        {/* Vertical Light Pillar when active/charging */}
                        <Cylinder args={[ring.radius * 0.85, ring.radius * 0.85, 8.0, 16]} position={[0, 4.0, 0]}>
                            <meshBasicMaterial 
                                color={colorHex} 
                                transparent 
                                opacity={isPlayerInside ? 0.35 : 0.1} 
                                side={THREE.DoubleSide}
                                depthWrite={false}
                            />
                        </Cylinder>
                    </group>
                );
            })}
        </group>
    );
}
