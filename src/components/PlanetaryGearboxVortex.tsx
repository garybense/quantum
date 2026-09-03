import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface PlanetaryGearboxVortexProps {
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

export function PlanetaryGearboxVortex({
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
}: PlanetaryGearboxVortexProps) {
    const groupRef = useRef<THREE.Group>(null);
    const sunRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Group>(null);
    const carrierRef = useRef<THREE.Group>(null);
    const crownRef = useRef<THREE.Group>(null);
    const trussRef = useRef<THREE.Group>(null);

    const planetRefs = useRef<(THREE.Group | null)[]>([]);
    const planetCooldowns = useRef<number[]>([0, 0, 0, 0]);
    const [alignedPlanets, setAlignedPlanets] = useState<boolean[]>([false, false, false, false]);

    const accumTimeRef = useRef<number>(0);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Geometries
    const trussGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const count = 16 * 2 * 3; // 16 segments * 2 lines * 3 coords
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        return geom;
    }, []);

    const ringGearGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const teeth = 32;
        const pts = teeth * 2;
        const pos = new Float32Array(pts * 3);
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geom;
    }, []);

    const sunGearGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const teeth = 14;
        const pts = teeth * 2;
        const pos = new Float32Array(pts * 3);
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geom;
    }, []);

    const carrierArmsGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const speed = accumTimeRef.current;
        const hueBase = (speed * 45) % 360;

        // Kinematic ratios
        const Rs = 12; // Scaled down for 3D world (Sun radius)
        const Rp = 7;  // Planet radius
        const Rr = 24; // Ring radius
        
        const R_ang = speed * 0.4;
        const S_ang = speed * -1.8;
        const C_ang = (Rs * S_ang + Rr * R_ang) / (Rs + Rr);
        const P_ang = C_ang + (Rr / Rp) * (R_ang - C_ang);

        // 1. Update Truss
        if (trussRef.current) {
            trussRef.current.rotation.z = C_ang * 1.5;
        }

        // 2. Update Ring Gear
        if (ringRef.current) {
            ringRef.current.rotation.z = R_ang;
        }

        // 3. Update Sun Gear
        if (sunRef.current) {
            sunRef.current.rotation.z = S_ang;
        }

        // 4. Update Carrier & Planet Gears
        if (carrierRef.current) {
            carrierRef.current.rotation.z = C_ang;
        }

        const numPlanets = 4;
        const orbitRadiusSum = Rs + Rp;
        for (let i = 0; i < numPlanets; i++) {
            const a = (i * Math.PI * 2) / numPlanets;
            const cx = Math.cos(a) * orbitRadiusSum;
            const cy = Math.sin(a) * orbitRadiusSum;

            const planetGroup = planetRefs.current[i];
            if (planetGroup) {
                planetGroup.position.set(cx, cy, Math.sin(speed * 4 + i * (Math.PI / 2)) * 1.5);
                planetGroup.rotation.z = P_ang + (i * Math.PI * 2 / 9);
            }

            // Locus collision
            if (locusPos) {
                const worldPlanetPos = new THREE.Vector3(cx, cy, 0);
                const dist = locusPos.distanceTo(worldPlanetPos);
                if (dist < 4.0 && planetCooldowns.current[i] <= 0) {
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

        // 5. Update Crown Gimbal
        if (crownRef.current) {
            crownRef.current.rotation.x = speed * 1.6;
            crownRef.current.rotation.y = speed * 1.3;
            crownRef.current.rotation.z = speed * -2.0;
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* 1. Z -6 Layer: Outer Truss Network */}
            <group ref={trussRef} position={[0, 0, -6]}>
                <Torus args={[26, 0.2, 16, 32]}>
                    <meshStandardMaterial color="#818cf8" wireframe emissive="#6366f1" emissiveIntensity={0.8} />
                </Torus>
            </group>

            {/* 2. Z -3 Layer: Ring Gear (Stator) */}
            <group ref={ringRef} position={[0, 0, -3]}>
                <Torus args={[24, 0.4, 16, 32]}>
                    <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} wireframe />
                </Torus>
            </group>

            {/* 3. Z -1.5 Layer: Sun Gear */}
            <group ref={sunRef} position={[0, 0, -1.5]}>
                <mesh>
                    <cylinderGeometry args={[12, 12, 1.5, 14]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>

            {/* 4. Z 0 Layer: Planetary Carrier & 4 Planet Gears */}
            <group ref={carrierRef} position={[0, 0, 0]}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <group key={i} ref={el => planetRefs.current[i] = el}>
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[7, 7, 1.2, 9]} />
                            <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={1.2} wireframe />
                        </mesh>
                        <Box args={[3.5, 3.5, 3.5]}>
                            <meshStandardMaterial color="#ffffff" emissive="#f472b6" emissiveIntensity={0.8} wireframe />
                        </Box>
                        {alignedPlanets[i] && (
                            <DreiSparkles count={15} scale={6} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>

            {/* 5. Z +6 Layer: Hyper-Dimensional Gimbal Crown */}
            <group ref={crownRef} position={[0, 0, 6]}>
                <Torus args={[12, 0.25, 16, 32]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} wireframe />
                </Torus>
                <Torus args={[15, 0.2, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#e879f9" emissive="#d946ef" emissiveIntensity={1.0} wireframe />
                </Torus>
                {/* Diamond Core Spindle */}
                <mesh rotation={[0, 0, 0]}>
                    <octahedronGeometry args={[4.5, 0]} />
                    <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.5} wireframe />
                </mesh>
            </group>
        </group>
    );
}
