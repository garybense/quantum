import * as THREE from 'three';
const _scratchVec = new THREE.Vector3();
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface ChronosOmniDifferentialVortexProps {
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

export function ChronosOmniDifferentialVortex({
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
}: ChronosOmniDifferentialVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const topRingRef = useRef<THREE.Group>(null);
    const bottomRingRef = useRef<THREE.Group>(null);
    const midRingRef = useRef<THREE.Group>(null);
    const coreSunRef = useRef<THREE.Group>(null);
    const satGroupRefs = useRef<(THREE.Group | null)[]>([]);
    const satCooldowns = useRef<number[]>([0, 0, 0, 0, 0]);
    const [alignedSatellites, setAlignedSatellites] = useState<boolean[]>([false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;

        if (topRingRef.current) topRingRef.current.rotation.z = t * 0.4;
        if (bottomRingRef.current) bottomRingRef.current.rotation.z = -t * 0.4;
        if (midRingRef.current) midRingRef.current.rotation.y = t * 0.8;
        if (coreSunRef.current) coreSunRef.current.rotation.z = -t * 1.2;

        const numSat = 5;
        const satR = 7.5; // Scaled for 3D world

        for (let i = 0; i < numSat; i++) {
            const sa = i * (Math.PI * 2 / numSat) + t * 0.4;
            const sx = Math.cos(sa) * satR;
            const sy = Math.sin(sa) * satR;
            const sz = Math.sin(t * 2 + i) * 2.2;

            const group = satGroupRefs.current[i];
            if (group) {
                group.position.set(sx, sy, sz);
                group.rotation.z = -sa * 2;
            }

            if (locusPos) {
                _scratchVec.set(sx, sy, 0); const worldPos = _scratchVec;
                const dist = locusPos.distanceTo(worldPos);
                if (dist < 3.8 && satCooldowns.current[i] <= 0) {
                    satCooldowns.current[i] = 2.0;
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
            if (satCooldowns.current[i] > 0) {
                satCooldowns.current[i] -= safeDelta;
            }
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Top Ring Gear (Z +8.0) */}
            <group ref={topRingRef} position={[0, 0, 8.0]}>
                <Torus args={[22, 0.4, 16, 36]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Bottom Ring Gear (Z -8.0) */}
            <group ref={bottomRingRef} position={[0, 0, -8.0]}>
                <Torus args={[22, 0.4, 16, 36]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Mid Bevel Ring Assembly */}
            <group ref={midRingRef} position={[0, 0, 0]}>
                <Torus args={[15, 0.35, 16, 32]}>
                    <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Central Sun Core */}
            <group ref={coreSunRef} position={[0, 0, 0]}>
                <mesh>
                    <cylinderGeometry args={[4.0, 4.0, 2.0, 16]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* 5 Satellite Planet Assemblies */}
            <group position={[0, 0, 0]}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <group key={i} ref={el => satGroupRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[2.8, 2.8, 1.2, 12]} />
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
