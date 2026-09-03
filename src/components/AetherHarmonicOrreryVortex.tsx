import * as THREE from 'three';
const _scratchVec = new THREE.Vector3();
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface AetherHarmonicOrreryVortexProps {
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

export function AetherHarmonicOrreryVortex({
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
}: AetherHarmonicOrreryVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const outerGearRef = useRef<THREE.Group>(null);
    const midGearRef = useRef<THREE.Group>(null);
    const cubeRingRef = useRef<THREE.Group>(null);
    const sunGearRef = useRef<THREE.Group>(null);
    const planetsCarrierRef = useRef<THREE.Group>(null);

    const planetRefs = useRef<(THREE.Group | null)[]>([]);
    const planetCooldowns = useRef<number[]>([0, 0, 0, 0, 0]);
    const [alignedPlanets, setAlignedPlanets] = useState<boolean[]>([false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;

        if (outerGearRef.current) outerGearRef.current.rotation.z = -t * 0.15;
        if (midGearRef.current) {
            midGearRef.current.rotation.x = t * 0.4;
            midGearRef.current.rotation.y = t * 0.3;
        }
        if (cubeRingRef.current) {
            cubeRingRef.current.rotation.y = -t * 0.5;
            cubeRingRef.current.rotation.z = t * 0.2;
        }
        if (sunGearRef.current) sunGearRef.current.rotation.z = -t * 0.8;

        const numPlanets = 5;
        const orbitR = 7.5; // Scaled for 3D world
        const orbitSpeed = t * 0.6;
        const planetSpin = -orbitSpeed * (7.5 / 3.0);

        for (let i = 0; i < numPlanets; i++) {
            const pa = (i * Math.PI * 2) / numPlanets + orbitSpeed;
            const px = Math.cos(pa) * orbitR;
            const py = Math.sin(pa) * orbitR;
            const pz = Math.sin(t * 3 + i * 1.2) * 2.5;

            const planetGroup = planetRefs.current[i];
            if (planetGroup) {
                planetGroup.position.set(px, py, pz);
                planetGroup.rotation.z = pa + planetSpin;
            }

            if (locusPos) {
                _scratchVec.set(px, py, 0); const worldPos = _scratchVec;
                const dist = locusPos.distanceTo(worldPos);
                if (dist < 3.8 && planetCooldowns.current[i] <= 0) {
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
            {/* Outer Gear Ring */}
            <group ref={outerGearRef} position={[0, 0, -7.0]}>
                <Torus args={[22, 0.4, 16, 36]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Mid Gimbal Gear Ring */}
            <group ref={midGearRef} position={[0, 0, -3.5]}>
                <Torus args={[18, 0.35, 16, 24]}>
                    <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={1.0} wireframe />
                </Torus>
            </group>

            {/* Cube Orbiting Ring */}
            <group ref={cubeRingRef} position={[0, 0, 0]}>
                <Torus args={[14, 0.25, 16, 32]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
                {Array.from({ length: 4 }).map((_, k) => {
                    const ka = (k * Math.PI / 2);
                    const kx = Math.cos(ka) * 14;
                    const ky = Math.sin(ka) * 14;
                    return (
                        <group key={k} position={[kx, ky, 0]}>
                            <Box args={[1.8, 1.8, 1.8]}>
                                <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1.5} wireframe />
                            </Box>
                        </group>
                    );
                })}
            </group>

            {/* Central Sun Gear */}
            <group ref={sunGearRef} position={[0, 0, 2.0]}>
                <mesh>
                    <cylinderGeometry args={[4.5, 4.5, 1.5, 15]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* 5 Planet Orbits */}
            <group position={[0, 0, 4.0]}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <group key={i} ref={el => planetRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[3.0, 3.0, 1.0, 10]} />
                            <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.2} wireframe />
                        </mesh>
                        {alignedPlanets[i] && (
                            <DreiSparkles count={12} scale={5} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>
        </group>
    );
}
