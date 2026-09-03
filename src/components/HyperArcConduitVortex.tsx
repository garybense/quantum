import * as THREE from 'three';
const _scratchVec = new THREE.Vector3();
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface HyperArcConduitVortexProps {
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

export function HyperArcConduitVortex({
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
}: HyperArcConduitVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const outerRef = useRef<THREE.Group>(null);
    const carrierRef = useRef<THREE.Group>(null);
    const sunRef = useRef<THREE.Group>(null);
    const nodesRef = useRef<THREE.Group>(null);
    const crownRef = useRef<THREE.Group>(null);

    const planetRefs = useRef<(THREE.Group | null)[]>([]);
    const planetCooldowns = useRef<number[]>([0, 0, 0, 0]);
    const [alignedPlanets, setAlignedPlanets] = useState<boolean[]>([false, false, false, false]);

    const accumTimeRef = useRef<number>(0);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;

        const wCarrier = t * 0.4;
        const wOuter = -t * 0.2;
        const wSun = 2.8 * t;

        if (outerRef.current) outerRef.current.rotation.z = wOuter;
        if (carrierRef.current) carrierRef.current.rotation.z = wCarrier;
        if (sunRef.current) sunRef.current.rotation.z = wSun;
        if (nodesRef.current) nodesRef.current.rotation.z = -t * 0.8;
        if (crownRef.current) {
            crownRef.current.rotation.x = t * 1.5;
            crownRef.current.rotation.y = t * 1.1;
        }

        const planets = 4;
        for (let i = 0; i < planets; i++) {
            const pa = (i * Math.PI * 2) / planets;
            const px = Math.cos(pa) * 15.0;
            const py = Math.sin(pa) * 15.0;
            const pAngle = -(wSun - wCarrier) * (40 / 42.5) + pa;

            const planetGroup = planetRefs.current[i];
            if (planetGroup) {
                planetGroup.position.set(px, py, Math.sin(t * 2 + i) * 2.0);
                planetGroup.rotation.z = pAngle;
            }

            if (locusPos) {
                _scratchVec.set(px, py, 0); const worldPos = _scratchVec;
                const dist = locusPos.distanceTo(worldPos);
                if (dist < 4.5 && planetCooldowns.current[i] <= 0) {
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
            {/* Z -65 Layer: Outer Ring Gear */}
            <group ref={outerRef} position={[0, 0, -6.5]}>
                <Torus args={[22, 0.4, 16, 32]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Z -20 Layer: Carrier & Planet Gears */}
            <group ref={carrierRef} position={[0, 0, -2.0]}>
                <Torus args={[15, 0.25, 16, 32]}>
                    <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={0.8} wireframe />
                </Torus>
                {Array.from({ length: 4 }).map((_, i) => (
                    <group key={i} ref={el => planetRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[5, 5, 1.0, 10]} />
                            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={1.2} wireframe />
                        </mesh>
                        <Box args={[2.5, 2.5, 2.5]}>
                            <meshStandardMaterial color="#ffffff" emissive="#f472b6" emissiveIntensity={0.8} wireframe />
                        </Box>
                        {alignedPlanets[i] && (
                            <DreiSparkles count={15} scale={6} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>

            {/* Z +15 Layer: Sun Gear */}
            <group ref={sunRef} position={[0, 0, 1.5]}>
                <mesh>
                    <cylinderGeometry args={[6, 6, 1.2, 10]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* Z +55 Layer: Pulsing Node Ring */}
            <group ref={nodesRef} position={[0, 0, 5.5]}>
                <Torus args={[16, 0.3, 16, 32]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* Z +80 Layer: Hyperarc Gimbal Box */}
            <group ref={crownRef} position={[0, 0, 8.0]}>
                <Box args={[5.0, 5.0, 5.0]}>
                    <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.5} wireframe />
                </Box>
            </group>
        </group>
    );
}
