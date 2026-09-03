import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Torus } from '@react-three/drei';

interface MasterMachineApertureProps {
    active: boolean;
    onBreachSuccess?: () => void;
    onBreachBlocked?: () => void;
    protagonistPosRef?: React.MutableRefObject<THREE.Vector3 | null>;
    isPaused?: boolean;
}

export function MasterMachineAperture({
    active,
    onBreachSuccess,
    onBreachBlocked,
    protagonistPosRef,
    isPaused = false,
}: MasterMachineApertureProps) {
    const groupRef = useRef<THREE.Group>(null);
    const vanesGroupRef = useRef<THREE.Group>(null);
    const cooldownRef = useRef<number>(0);

    const [isOpen, setIsOpen] = useState(true);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const time = state.clock.getElapsedTime();

        // 3-second cycle for aperture shutters: 1.8s open, 1.2s closed
        const cycle = time % 3.0;
        const currentlyOpen = cycle < 1.8;
        if (currentlyOpen !== isOpen) {
            setIsOpen(currentlyOpen);
        }

        // Spin group and vanes
        if (groupRef.current) {
            groupRef.current.rotation.y = time * 0.9;
        }
        if (vanesGroupRef.current) {
            const targetZ = currentlyOpen ? 0.2 : 1.25;
            vanesGroupRef.current.rotation.z = THREE.MathUtils.lerp(vanesGroupRef.current.rotation.z, targetZ, 0.1);
        }

        // Check collision with protagonist
        if (cooldownRef.current > 0) {
            cooldownRef.current -= delta;
        } else if (protagonistPosRef && protagonistPosRef.current) {
            const pos = protagonistPosRef.current;
            const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            const heightDist = Math.abs(pos.y - 2.0);

            if (dist < 4.8 && heightDist < 6.0) {
                cooldownRef.current = 1.5;
                if (currentlyOpen) {
                    if (onBreachSuccess) onBreachSuccess();
                } else {
                    if (onBreachBlocked) onBreachBlocked();
                }
            }
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef} position={[0, 2, 0]}>
            {/* Outer Machine Aperture Ring */}
            <Torus args={[4.8, 0.35, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial 
                    color={isOpen ? "#f59e0b" : "#ef4444"} 
                    emissive={isOpen ? "#fbbf24" : "#f87171"} 
                    emissiveIntensity={isOpen ? 3.5 : 1.8} 
                />
            </Torus>

            {/* Outer Rotating Target Beacons */}
            <Torus args={[7.2, 0.15, 16, 48]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial 
                    color="#38bdf8" 
                    emissive="#0284c7" 
                    emissiveIntensity={2.0} 
                    wireframe 
                />
            </Torus>

            {/* Glowing Aperture Vanes */}
            <group ref={vanesGroupRef}>
                {[0, 1, 2, 3].map((i) => {
                    const rot = (i * Math.PI) / 2;
                    return (
                        <group key={`vane-${i}`} rotation={[0, rot, 0]}>
                            <mesh position={[2.4, 0, 0]}>
                                <boxGeometry args={[2.8, 0.25, 0.7]} />
                                <meshStandardMaterial 
                                    color={isOpen ? "#38bdf8" : "#dc2626"} 
                                    emissive={isOpen ? "#0284c7" : "#991b1b"} 
                                    emissiveIntensity={2.5} 
                                />
                            </mesh>
                        </group>
                    );
                })}
            </group>

            {/* Central Laser Alignment Pillar */}
            <mesh position={[0, 12, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 24, 16]} />
                <meshStandardMaterial 
                    color={isOpen ? "#fbbf24" : "#ef4444"} 
                    emissive={isOpen ? "#f59e0b" : "#dc2626"} 
                    emissiveIntensity={4.5} 
                    transparent 
                    opacity={0.7} 
                />
            </mesh>
        </group>
    );
}
