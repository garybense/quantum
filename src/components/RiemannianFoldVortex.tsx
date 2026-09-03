import * as THREE from 'three';
const _scratchVec = new THREE.Vector3();
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface RiemannianFoldVortexProps {
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

export function RiemannianFoldVortex({
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
}: RiemannianFoldVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const topRingRef = useRef<THREE.Group>(null);
    const bottomRingRef = useRef<THREE.Group>(null);
    const midRingRef = useRef<THREE.Group>(null);
    const sunGearRef = useRef<THREE.Group>(null);
    const planetsCarrierRef = useRef<THREE.Group>(null);
    const satelliteRefs = useRef<(THREE.Group | null)[]>([]);
    const satelliteCooldowns = useRef<number[]>([0, 0, 0]);
    const [alignedSatellites, setAlignedSatellites] = useState<boolean[]>([false, false, false]);

    const accumTimeRef = useRef<number>(0);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;

        if (topRingRef.current) topRingRef.current.rotation.z = t * 0.2;
        if (bottomRingRef.current) bottomRingRef.current.rotation.z = -t * 0.2;
        if (midRingRef.current) midRingRef.current.rotation.z = -t * 0.3;
        if (sunGearRef.current) sunGearRef.current.rotation.z = t * 1.5;

        const numPlanets = 3;
        const orbitR = 7.0; // Scaled for 3D world
        const wOrbit = 0.15 * t;
        const wPlanetRel = 1.35 * t;

        for (let i = 0; i < numPlanets; i++) {
            const pa = i * (Math.PI * 2 / numPlanets) + wOrbit;
            const px = Math.cos(pa) * orbitR;
            const py = Math.sin(pa) * orbitR;

            const satGroup = satelliteRefs.current[i];
            if (satGroup) {
                satGroup.position.set(px, py, 0);
                satGroup.rotation.z = pa + wPlanetRel;
            }

            if (locusPos) {
                _scratchVec.set(px, py, 0); const worldPos = _scratchVec;
                const dist = locusPos.distanceTo(worldPos);
                if (dist < 3.8 && satelliteCooldowns.current[i] <= 0) {
                    satelliteCooldowns.current[i] = 2.0;
                    soundEngine.playChronosSynchroMeshSound();
                    setAlignedSatellites(prev => {
                        const next = [...prev];
                        next[i] = true;
                        return next;
                    });
                    if (onAlignSatellites) {
                        onAlignSatellites(i);
                    }
                }
            }
            if (satelliteCooldowns.current[i] > 0) {
                satelliteCooldowns.current[i] -= safeDelta;
            }
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Top Outer Ring Gear (Z +6.5) */}
            <group ref={topRingRef} position={[0, 0, 6.5]}>
                <Torus args={[20, 0.4, 16, 48]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Bottom Outer Ring Gear (Z -6.5) */}
            <group ref={bottomRingRef} position={[0, 0, -6.5]}>
                <Torus args={[20, 0.4, 16, 48]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Mid Stator Ring Gear (Z -2.5) */}
            <group ref={midRingRef} position={[0, 0, -2.5]}>
                <Torus args={[14, 0.35, 16, 42]}>
                    <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Central Sun Gear (Z 0) */}
            <group ref={sunGearRef} position={[0, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[4.5, 4.5, 2.0, 14]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* 3 Planetary Assemblies */}
            <group position={[0, 0, 0]}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <group key={i} ref={el => satelliteRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[3.2, 3.2, 1.5, 14]} />
                            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={1.3} wireframe />
                        </mesh>
                        {alignedSatellites[i] && (
                            <DreiSparkles count={15} scale={5} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>
        </group>
    );
}
