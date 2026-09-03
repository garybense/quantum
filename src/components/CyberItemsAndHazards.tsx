import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Torus, Octahedron, Ring, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { CyberItemDrop, RogueVoidHazard, DimensionalShearGate } from '../types';

interface CyberItemsAndHazardsProps {
    items: CyberItemDrop[];
    hazards: RogueVoidHazard[];
    gates: DimensionalShearGate[];
    locusPos: THREE.Vector3 | null;
    isPulling: boolean;
    isMoving: boolean;
    magnetRadius: number;
    timeScale?: number;
    isRewinding?: boolean;
    isPaused?: boolean;
    onCollectItem: (item: CyberItemDrop, chargeLevel: number) => void;
    onHazardHit: (hazard: RogueVoidHazard) => void;
    onGatePass: (gate: DimensionalShearGate, chargeLevel: number) => void;
}

export function CyberItemsAndHazards({
    items,
    hazards,
    gates,
    locusPos,
    isPulling,
    isMoving,
    magnetRadius,
    timeScale = 1.0,
    isRewinding = false,
    isPaused = false,
    onCollectItem,
    onHazardHit,
    onGatePass,
}: CyberItemsAndHazardsProps) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (isPaused || !locusPos) return;

        const clockTime = state.clock.getElapsedTime();
        const effDelta = delta * timeScale;
        const pPos = locusPos;
        const pickupDist = 2.4 + (magnetRadius > 0 ? magnetRadius : 0);

        // 1. Process 3D Cyber Item Drops (Dynamic Sine Levitation + Overcharge Growth)
        items.forEach((item) => {
            // Accumulate Quantum Charge Level over time (1.0x to 2.5x overcharge)
            if (!item.chargeLevel) item.chargeLevel = 1.0;
            item.chargeLevel = Math.min(2.5, item.chargeLevel + effDelta * 0.15);
            
            // Dynamic sine levitation oscillation
            item.position[1] = 2.5 + Math.sin(clockTime * 3.5 + item.createdAt) * 0.6;

            const dx = item.position[0] - pPos.x;
            const dy = item.position[1] - pPos.y;
            const dz = item.position[2] - pPos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Attract towards player if within magnet range or pulling
            if (dist < pickupDist * 3.5 || (isPulling && dist < 25)) {
                if (dist > 0.001) {
                    const invDist = 1.0 / dist;
                    const pullDirX = -dx * invDist;
                    const pullDirZ = -dz * invDist;
                    const speed = (25 - dist) * 0.18 * effDelta;
                    item.position[0] += pullDirX * speed;
                    item.position[2] += pullDirZ * speed;
                }
            }

            // Collection check with active Overcharge multiplier passed
            if (dist < pickupDist) {
                onCollectItem(item, item.chargeLevel);
            }
        });

        // 2. Process Rogue Void Hazards Physics & Collisions
        hazards.forEach((hazard) => {
            const hx = hazard.position[0];
            const hy = hazard.position[1];
            const hz = hazard.position[2];

            const dx = hx - pPos.x;
            const dy = hy - pPos.y;
            const dz = hz - pPos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (isRewinding) {
                // CHRONO REWIND: Reverse hazard movement away from player in spatial loop!
                if (dist > 0.001) {
                    const invDist = 1.0 / dist;
                    hazard.velocity[0] = dx * invDist * 14;
                    hazard.velocity[2] = dz * invDist * 14;
                }
            } else if (!isMoving && !isPulling) {
                // If left alone/idle, void hazards home in on the stationary singularity (accelerating 10x slower)
                if (dist > 0.001) {
                    const invDist = 1.0 / dist;
                    const dirX = -dx * invDist;
                    const dirZ = -dz * invDist;
                    hazard.velocity[0] += dirX * 1.2 * effDelta;
                    hazard.velocity[2] += dirZ * 1.2 * effDelta;
                    
                    const speedSq = hazard.velocity[0] * hazard.velocity[0] + hazard.velocity[2] * hazard.velocity[2];
                    if (speedSq > 144) {
                        const factor = 12 / Math.sqrt(speedSq);
                        hazard.velocity[0] *= factor;
                        hazard.velocity[2] *= factor;
                    }
                }
            }

            // Drift velocity scaled by time continuum factor
            hazard.position[0] += hazard.velocity[0] * effDelta;
            hazard.position[1] += hazard.velocity[1] * effDelta;
            hazard.position[2] += hazard.velocity[2] * effDelta;

            // Bounce on boundaries
            if (Math.abs(hazard.position[0]) > 45) hazard.velocity[0] *= -1;
            if (Math.abs(hazard.position[2]) > 45) hazard.velocity[2] *= -1;

            if (dist < hazard.size + 1.4) {
                onHazardHit(hazard);
            }
        });

        // 3. Process Dimensional Shear Gates (Dynamic Orbital Chrono-Lenses)
        gates.forEach((gate) => {
            if (!gate.chargeLevel) gate.chargeLevel = 1.0;
            if (!gate.age) gate.age = 0;

            gate.age += effDelta;
            gate.rotation += effDelta * 0.8;

            if (!gate.passed) {
                // Charge builds up to 3.0x over time
                gate.chargeLevel = Math.min(3.0, 1.0 + gate.age * 0.12);

                const dx = gate.position[0] - pPos.x;
                const dy = gate.position[1] - pPos.y;
                const dz = gate.position[2] - pPos.z;
                const gDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                // Unpassed Gate Implosion Threat: If left ignored > 15s, forms micro-gravity well pulling nearby objects
                if (gate.age > 15 && !gate.imploded) {
                    gate.imploded = true;
                }

                if (gate.imploded && gDist < 20) {
                    // Pull player toward imploded gate instability
                    if (gDist > 0.001) {
                        const pullDirX = dx / gDist;
                        const pullDirZ = dz / gDist;
                        pPos.x += pullDirX * 0.08 * effDelta;
                        pPos.z += pullDirZ * 0.08 * effDelta;
                    }
                }

                if (gDist < 4.8) {
                    gate.passed = true;
                    onGatePass(gate, gate.chargeLevel);
                }
            }
        });
    });

    return (
        <group ref={groupRef}>
            {/* Render Cyber Item Drops with Dynamic Quantum Overcharge Visuals */}
            {items.map((item) => {
                const colors: Record<string, string> = {
                    shield: '#38bdf8',
                    multiplier: '#f59e0b',
                    emp: '#a855f7',
                    magnet: '#10b981',
                    nanite: '#ec4899',
                };
                const colorHex = colors[item.type] || '#38bdf8';
                const chargeScale = item.chargeLevel || 1.0;
                const isOvercharged = chargeScale > 1.8;

                return (
                    <group key={item.id} position={item.position} scale={[chargeScale, chargeScale, chargeScale]}>
                        {/* Overcharge Quantum Aura Halo */}
                        {isOvercharged && (
                            <Sphere args={[1.4, 10, 10]}>
                                <meshBasicMaterial color={colorHex} transparent opacity={0.35} wireframe />
                            </Sphere>
                        )}

                        {item.type === 'shield' && (
                            <Sphere args={[0.9, 10, 10]}>
                                <meshLambertMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.5 * chargeScale} />
                            </Sphere>
                        )}
                        {item.type === 'multiplier' && (
                            <Box args={[1.2, 1.2, 1.2]}>
                                <meshLambertMaterial color={colorHex} emissive={colorHex} emissiveIntensity={3 * chargeScale} />
                            </Box>
                        )}
                        {item.type === 'emp' && (
                            <Octahedron args={[1.1]}>
                                <meshLambertMaterial color={colorHex} emissive={colorHex} emissiveIntensity={3.5 * chargeScale} />
                            </Octahedron>
                        )}
                        {item.type === 'magnet' && (
                            <Torus args={[0.8, 0.3, 8, 16]}>
                                <meshLambertMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.8 * chargeScale} />
                            </Torus>
                        )}
                        {item.type === 'nanite' && (
                            <Sphere args={[1.0, 10, 10]}>
                                <meshLambertMaterial color={colorHex} emissive={colorHex} emissiveIntensity={4 * chargeScale} wireframe />
                            </Sphere>
                        )}
                    </group>
                );
            })}

            {/* Render Rogue Void Hazards with Pulsing Satellite Spikes */}
            {hazards.map((hazard) => (
                <group key={hazard.id} position={hazard.position}>
                    <Sphere args={[hazard.size, 12, 12]}>
                        <meshLambertMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={4} />
                    </Sphere>
                    <Torus args={[hazard.size * 1.5, 0.18, 8, 16]} rotation={[Math.PI / 4, 0, 0]}>
                        <meshBasicMaterial color="#f87171" transparent opacity={0.85} />
                    </Torus>
                </group>
            ))}

            {/* Render Dynamic Dimensional Shear Gates (Multi-Ring Chrono-Lenses) */}
            {gates.map((gate) => {
                const chargeScale = gate.chargeLevel || 1.0;
                const isOvercharged = chargeScale > 2.0;

                return (
                    <group key={gate.id} position={gate.position} rotation={[0, gate.rotation, 0]}>
                        {/* Vertical Chrono-Prism Beam Column */}
                        <Cylinder args={[0.2, 3.5, 12, 16]} position={[0, 6, 0]}>
                            <meshBasicMaterial 
                                color={gate.passed ? '#10b981' : (isOvercharged ? '#f59e0b' : '#f43f5e')} 
                                transparent 
                                opacity={gate.passed ? 0.08 : (isOvercharged ? 0.35 : 0.2)} 
                                wireframe
                                depthWrite={false}
                            />
                        </Cylinder>

                        {/* Outer Concentric Energy Field Ring */}
                        <Ring args={[3.2, 4.2 * (gate.passed ? 1.0 : chargeScale * 0.8), 32]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial 
                                color={gate.passed ? '#10b981' : (isOvercharged ? '#f59e0b' : '#f43f5e')} 
                                side={THREE.DoubleSide} 
                                transparent 
                                opacity={gate.passed ? 0.25 : 0.85} 
                                depthWrite={false}
                            />
                        </Ring>

                        {/* Inner Rotating Gyroscope Gate Ring */}
                        {!gate.passed && (
                            <Torus args={[2.5, 0.2, 12, 32]} rotation={[gate.rotation * 1.5, 0, 0]}>
                                <meshLambertMaterial color={isOvercharged ? "#fbbf24" : "#f43f5e"} emissive={isOvercharged ? "#f59e0b" : "#e11d48"} emissiveIntensity={3.5 * chargeScale} />
                            </Torus>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

