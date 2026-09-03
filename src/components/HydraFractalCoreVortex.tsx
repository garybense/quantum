import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface HydraFractalCoreVortexProps {
    locusPos?: THREE.Vector3 | null;
    isPulling?: boolean;
    timeScale?: number;
    isRewinding?: boolean;
    onAlignSatellites?: (satelliteIndex: number) => void;
    active?: boolean;
    isPaused?: boolean;
    subsystem1Power?: number;
    subsystem2Power?: number;
    subsystem3Power?: number;
}

export function HydraFractalCoreVortex({
    locusPos,
    isPulling = false,
    timeScale = 1.0,
    isRewinding = false,
    onAlignSatellites,
    active = true,
    isPaused = false,
    subsystem1Power = 1.0,
    subsystem2Power = 1.0,
    subsystem3Power = 1.0,
}: HydraFractalCoreVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const outerGearRef = useRef<THREE.Group>(null);
    const sunGearRef = useRef<THREE.Group>(null);
    const carrierRef = useRef<THREE.Group>(null);
    const crownRef = useRef<THREE.Group>(null);

    const planetRefs = useRef<(THREE.Group | null)[]>([]);
    const planetCooldowns = useRef<number[]>([0, 0, 0, 0, 0, 0]);
    const [alignedPlanets, setAlignedPlanets] = useState<boolean[]>([false, false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;

        if (outerGearRef.current) outerGearRef.current.rotation.z = t * 0.2;
        if (sunGearRef.current) sunGearRef.current.rotation.z = -t * 0.6;
        if (crownRef.current) {
            crownRef.current.rotation.z = -t * 0.4;
        }

        const numPlanets = 6;
        const orbitR = 6.3; // Scaled for 3D world
        const planetSpeed = 0.2;
        const spinSpeed = -planetSpeed * (6.3 / 2.8);

        for (let i = 0; i < numPlanets; i++) {
            const pAngle = (i * Math.PI * 2) / numPlanets + t * planetSpeed;
            const px = Math.cos(pAngle) * orbitR;
            const py = Math.sin(pAngle) * orbitR;
            const pz = Math.sin(t * 2.5 + i) * 1.0;

            const planetGroup = planetRefs.current[i];
            if (planetGroup) {
                planetGroup.position.set(px, py, pz);
                planetGroup.rotation.z = t * spinSpeed + i * (Math.PI * 2 / numPlanets);
            }

            if (locusPos) {
                const worldPos = new THREE.Vector3(px, py, 0);
                const dist = locusPos.distanceTo(worldPos);
                if (dist < 3.5 && planetCooldowns.current[i] <= 0) {
                    planetCooldowns.current[i] = 2.0;
                    soundEngine.playChronosSynchroMeshSound();
                    setAlignedPlanets(prev => {
                        const next = [...prev];
                        next[i] = true;
                        return next;
                    });
                    if (onAlignSatellites) {
                        onAlignSatellites(i);
                    }
                }
            }
            if (planetCooldowns.current[i] > 0) {
                planetCooldowns.current[i] -= safeDelta;
            }
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Z -6.5 Layer: Outer Ring Gear */}
            <group ref={outerGearRef} position={[0, 0, -6.5]}>
                <Torus args={[25, 0.4, 16, 32]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Sun Gear Layer */}
            <group ref={sunGearRef} position={[0, 0, -2.0]}>
                <mesh>
                    <cylinderGeometry args={[3.5, 3.5, 1.2, 12]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* 6 Planet Gears */}
            <group position={[0, 0, 0]}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <group key={i} ref={el => planetRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[2.8, 2.8, 0.8, 8]} />
                            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={1.2} wireframe />
                        </mesh>
                        {alignedPlanets[i] && (
                            <DreiSparkles count={12} scale={5} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>

            {/* Z +6.5 Layer: Hexagonal Crown & Arcs */}
            <group ref={crownRef} position={[0, 0, 6.5]}>
                <Torus args={[8.5, 0.3, 16, 6]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>
        </group>
    );
}
