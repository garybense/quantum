import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface QuantumResonanceRelayProps {
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

export function QuantumResonanceRelay({
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
}: QuantumResonanceRelayProps) {
    const starburstGroupRef = useRef<THREE.Group>(null);
    const centralSunGroupRef = useRef<THREE.Group>(null);
    const planetarySatellitesGroupRef = useRef<THREE.Group>(null);
    const outerGearRingGroupRef = useRef<THREE.Group>(null);
    const tetherLinesRef = useRef<THREE.LineSegments>(null);

    const satelliteRefs = useRef<(THREE.Group | null)[]>([]);
    const satelliteCooldowns = useRef<number[]>([0, 0, 0, 0, 0]);
    const [, setAlignedSatellites] = useState<boolean[]>([false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // 1. Layer 1: Background Radial Starburst Line Grid (80 lines)
    const starburstGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const count = 80;
        const posArr = new Float32Array(count * 2 * 3);
        const colArr = new Float32Array(count * 2 * 3);

        const innerR = 20.0;
        const outerR = 40.0;

        for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const x1 = Math.cos(angle) * innerR;
            const z1 = Math.sin(angle) * innerR;
            const x2 = Math.cos(angle) * outerR;
            const z2 = Math.sin(angle) * outerR;

            // Line inner pt
            posArr[i * 6] = x1;
            posArr[i * 6 + 1] = 0;
            posArr[i * 6 + 2] = z1;

            // Line outer pt
            posArr[i * 6 + 3] = x2;
            posArr[i * 6 + 4] = 0;
            posArr[i * 6 + 5] = z2;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
        return geom;
    }, []);

    // 2. Layer 3: Dual Oscillating Energy Tethers from Sun to 5 Satellites
    const tethersGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        // 5 satellites * 2 tethers per satellite * 2 points per tether = 20 points
        const posArr = new Float32Array(5 * 2 * 2 * 3);
        const colArr = new Float32Array(5 * 2 * 2 * 3);
        geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
        return geom;
    }, []);

    // 3. Layer 5: 100 Interweaving Bezier Quantum Filament Waves
    const bezierFilamentsGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const count = 100;
        const ptsPerCurve = 16;
        const totalPts = count * (ptsPerCurve - 1) * 2;

        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(totalPts * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(totalPts * 3), 3));
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.5 : 1.0;

        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);
        accumTimeRef.current += safeDelta * 1.0 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;
        const hB = ((t * 50) % 360) / 360; // Hue baseline (0..1)
        const gRot = t * 2.8;

        const p1 = 0.35 + subsystem1Power * 0.65;
        const p2 = 0.35 + subsystem2Power * 0.65;
        const p3 = 0.35 + subsystem3Power * 0.65;

        const sunR = 11.0;
        const orbR = 52.0;
        const satR = 7.6;
        const pCount = 5;

        // LAYER 1: Starburst Grid Colors & Rotation
        if (starburstGroupRef.current) {
            starburstGroupRef.current.rotation.y = -t * 0.4 * p1;
            const colAttr = starburstGeometry.getAttribute('color') as THREE.BufferAttribute;
            const colArr = colAttr.array as Float32Array;

            for (let i = 0; i < 80; i++) {
                const hue = (hB + (i * 4) / 360) % 1;
                tempColor.setHSL(hue, 0.6, 0.1 + subsystem1Power * 0.7);

                colArr[i * 6] = tempColor.r;
                colArr[i * 6 + 1] = tempColor.g;
                colArr[i * 6 + 2] = tempColor.b;

                tempColor.setHSL(hue, 0.8, 0.2 + subsystem1Power * 0.75);
                colArr[i * 6 + 3] = tempColor.r;
                colArr[i * 6 + 4] = tempColor.g;
                colArr[i * 6 + 5] = tempColor.b;
            }
            colAttr.needsUpdate = true;
        }

        // LAYER 2: Central Sun Core Rotation
        if (centralSunGroupRef.current) {
            centralSunGroupRef.current.rotation.y = gRot * p2;
            centralSunGroupRef.current.children.forEach((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh && mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                        mat.emissive.setHSL(hB, 0.9, 0.1 + subsystem2Power * 0.6);
                        mat.emissiveIntensity = 0.2 + subsystem2Power * 1.8;
                    }
                }
            });
        }

        // LAYER 3: 5 Orbiting Planetary Satellites & Dual Tethers
        if (planetarySatellitesGroupRef.current && tethersGeometry) {
            const tetherPosAttr = tethersGeometry.getAttribute('position') as THREE.BufferAttribute;
            const tetherColAttr = tethersGeometry.getAttribute('color') as THREE.BufferAttribute;
            const tPosArr = tetherPosAttr.array as Float32Array;
            const tColArr = tetherColAttr.array as Float32Array;
            let tIdx = 0;

            for (let i = 0; i < pCount; i++) {
                if (satelliteCooldowns.current[i] > 0) {
                    satelliteCooldowns.current[i] -= safeDelta;
                }

                const pA = i * ((Math.PI * 2) / pCount) + gRot * p3;
                const ox = Math.cos(pA) * orbR;
                const oz = Math.sin(pA) * orbR;

                // Dual Tether Lines calculation
                const sunStartX = Math.cos(pA) * (sunR + 4.0);
                const sunStartZ = Math.sin(pA) * (sunR + 4.0);

                const linkOsc = Math.sin(t * 5.0 + i) * 3.0;

                const t1X = ox + Math.cos(pA + 0.3) * linkOsc;
                const t1Z = oz + Math.sin(pA + 0.3) * linkOsc;

                const t2X = ox + Math.cos(pA - 0.3) * linkOsc;
                const t2Z = oz + Math.sin(pA - 0.3) * linkOsc;

                tempColor.setHSL((hB + 0.5) % 1, 0.8, 0.85); // (hB + 180)

                // Tether 1
                tPosArr[tIdx * 3] = sunStartX;
                tPosArr[tIdx * 3 + 1] = 2.0;
                tPosArr[tIdx * 3 + 2] = sunStartZ;
                tColArr[tIdx * 3] = tempColor.r;
                tColArr[tIdx * 3 + 1] = tempColor.g;
                tColArr[tIdx * 3 + 2] = tempColor.b;
                tIdx++;

                tPosArr[tIdx * 3] = t1X;
                tPosArr[tIdx * 3 + 1] = 2.0;
                tPosArr[tIdx * 3 + 2] = t1Z;
                tColArr[tIdx * 3] = tempColor.r;
                tColArr[tIdx * 3 + 1] = tempColor.g;
                tColArr[tIdx * 3 + 2] = tempColor.b;
                tIdx++;

                // Tether 2
                tPosArr[tIdx * 3] = sunStartX;
                tPosArr[tIdx * 3 + 1] = 2.0;
                tPosArr[tIdx * 3 + 2] = sunStartZ;
                tColArr[tIdx * 3] = tempColor.r;
                tColArr[tIdx * 3 + 1] = tempColor.g;
                tColArr[tIdx * 3 + 2] = tempColor.b;
                tIdx++;

                tPosArr[tIdx * 3] = t2X;
                tPosArr[tIdx * 3 + 1] = 2.0;
                tPosArr[tIdx * 3 + 2] = t2Z;
                tColArr[tIdx * 3] = tempColor.r;
                tColArr[tIdx * 3 + 1] = tempColor.g;
                tColArr[tIdx * 3 + 2] = tempColor.b;
                tIdx++;

                // Planetary satellite group positioning
                const satGroup = satelliteRefs.current[i];
                if (satGroup) {
                    satGroup.position.set(ox, 2.0, oz);
                    satGroup.rotation.y = -gRot * 4;

                    // Check interaction with player core
                    if (locusPos && satelliteCooldowns.current[i] <= 0) {
                        const dx = locusPos.x - ox;
                        const dy = locusPos.y - 2.0;
                        const dz = locusPos.z - oz;
                        const distSq = dx * dx + dy * dy + dz * dz;
                        if (distSq < 27.04) {
                            satelliteCooldowns.current[i] = 3.5;
                            soundEngine.playChronosSynchroMeshSound();

                            setAlignedSatellites((prev) => {
                                const next = [...prev];
                                next[i] = true;
                                return next;
                            });

                            if (onAlignSatellites) {
                                onAlignSatellites(i);
                            }
                        }
                    }

                    const satHue = (hB + (i * 40) / 360) % 1;
                    const isAligned = satelliteCooldowns.current[i] > 2.0;

                    satGroup.children.forEach((child) => {
                        const mesh = child as THREE.Mesh;
                        if (mesh && mesh.material) {
                            const mat = mesh.material as THREE.MeshStandardMaterial;
                            if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                                mat.emissive.setHSL(isAligned ? 0.12 : satHue, 0.9, isAligned ? 0.95 : 0.7);
                                mat.emissiveIntensity = isAligned ? 3.0 : (0.4 + (isPulling ? 1.2 : 0) + (isRewinding ? 1.0 : 0));
                            }
                        }
                    });
                }
            }

            tetherPosAttr.needsUpdate = true;
            tetherColAttr.needsUpdate = true;
            tethersGeometry.setDrawRange(0, tIdx);
        }

        // LAYER 4: Outer Perimeter Gear Ring with 60 Oscillating Teeth
        if (outerGearRingGroupRef.current) {
            outerGearRingGroupRef.current.rotation.y = -gRot * 0.15;
            outerGearRingGroupRef.current.children.forEach((child, m) => {
                const toothHue = (hB + (m * 3) / 360) % 1;
                const toothZ = Math.cos(t * 8.0 + m * 0.8) * 2.4;
                child.position.y = toothZ;

                child.children.forEach((meshObj) => {
                    const mesh = meshObj as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                            mat.emissive.setHSL(toothHue, 0.85, 0.75);
                        }
                    }
                });
            });
        }

        // LAYER 5: 100 Interweaving Bezier Quantum Wave Filaments
        if (bezierFilamentsGeometry) {
            const posAttr = bezierFilamentsGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = bezierFilamentsGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pIdx = 0;

            const count = 100;
            const ptsPerCurve = 16;

            for (let n = 0; n < count; n++) {
                const angle = (n * Math.PI * 2) / count;
                const waveVal = Math.sin(t * 12.0 + n * 0.3) * 2.4;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                const p0x = cosA * (sunR + 2.0);
                const p0y = 2.0;
                const p0z = sinA * (sunR + 2.0);

                const p1x = cosA * 16.0 + sinA * waveVal;
                const p1y = 2.0 + waveVal;
                const p1z = sinA * 16.0 - cosA * waveVal;

                const p2x = cosA * 22.0 - sinA * waveVal;
                const p2y = 2.0 - waveVal;
                const p2z = sinA * 22.0 + cosA * waveVal;

                const p3x = cosA * (orbR - 2.0);
                const p3y = 2.0;
                const p3z = sinA * (orbR - 2.0);

                tempColor.setHSL((hB + (240 / 360)) % 1, 0.9, 0.8);

                let prevX = p0x, prevY = p0y, prevZ = p0z;

                for (let k = 1; k < ptsPerCurve; k++) {
                    const u = k / (ptsPerCurve - 1);
                    const u1 = 1 - u;
                    const u1_3 = u1 * u1 * u1;
                    const u1_2_u_3 = 3 * u1 * u1 * u;
                    const u1_u2_3 = 3 * u1 * u * u;
                    const u_3 = u * u * u;

                    const currX = u1_3 * p0x + u1_2_u_3 * p1x + u1_u2_3 * p2x + u_3 * p3x;
                    const currY = u1_3 * p0y + u1_2_u_3 * p1y + u1_u2_3 * p2y + u_3 * p3y;
                    const currZ = u1_3 * p0z + u1_2_u_3 * p1z + u1_u2_3 * p2z + u_3 * p3z;

                    posArr[pIdx * 3] = prevX;
                    posArr[pIdx * 3 + 1] = prevY;
                    posArr[pIdx * 3 + 2] = prevZ;
                    colArr[pIdx * 3] = tempColor.r;
                    colArr[pIdx * 3 + 1] = tempColor.g;
                    colArr[pIdx * 3 + 2] = tempColor.b;
                    pIdx++;

                    posArr[pIdx * 3] = currX;
                    posArr[pIdx * 3 + 1] = currY;
                    posArr[pIdx * 3 + 2] = currZ;
                    colArr[pIdx * 3] = tempColor.r;
                    colArr[pIdx * 3 + 1] = tempColor.g;
                    colArr[pIdx * 3 + 2] = tempColor.b;
                    pIdx++;

                    prevX = currX;
                    prevY = currY;
                    prevZ = currZ;
                }
            }

            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
            bezierFilamentsGeometry.setDrawRange(0, pIdx);
        }
    });

    // Layer 2: Sun Cogs
    const sunSpokes = useMemo(() => {
        const sunR = 11.0;
        return Array.from({ length: 32 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 32;
            const x = Math.cos(a) * (sunR + 1.5);
            const z = Math.sin(a) * (sunR + 1.5);
            return { angle: a, pos: [x, 2.0, z] as [number, number, number] };
        });
    }, []);

    // Layer 3: Satellite Teeth
    const satelliteTeeth = useMemo(() => {
        const satR = 7.6;
        return Array.from({ length: 12 }).map((_, j) => {
            const a = (j * Math.PI * 2) / 12;
            const x = Math.cos(a) * (satR + 1.2);
            const z = Math.sin(a) * (satR + 1.2);
            return { angle: a, pos: [x, 0, z] as [number, number, number] };
        });
    }, []);

    // Layer 4: Outer Ring Teeth (60 teeth)
    const outerRingTeeth = useMemo(() => {
        const outerR = 52.0;
        return Array.from({ length: 60 }).map((_, m) => {
            const a = (m * Math.PI * 2) / 60;
            const x = Math.cos(a) * outerR;
            const z = Math.sin(a) * outerR;
            return { index: m, angle: a, pos: [x, 2.0, z] as [number, number, number] };
        });
    }, []);

    if (!active) return null;

    return (
        <group position={[0, 0, 0]}>
            {/* LAYER 1: Background Radial Starburst Grid */}
            <group ref={starburstGroupRef}>
                <lineSegments geometry={starburstGeometry}>
                    <lineBasicMaterial vertexColors transparent opacity={0.3} linewidth={2} />
                </lineSegments>
                {/* Bright Starburst Points at r ~ 38.4 */}
                {Array.from({ length: 80 }).map((_, i) => {
                    const angle = (i * Math.PI * 2) / 80;
                    const r = 38.4;
                    return (
                        <Sphere key={`starburst-pt-${i}`} args={[0.3, 8, 8]} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
                            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.5} />
                        </Sphere>
                    );
                })}
            </group>

            {/* LAYER 2: Central Sun Core Ring & 32 Radial Spikes with Crossbars */}
            <group ref={centralSunGroupRef}>
                <Torus args={[11.0, 1.2, 16, 64]} position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#b45309" emissive="#f59e0b" emissiveIntensity={0.6} roughness={0.2} />
                </Torus>
                {sunSpokes.map((spoke, idx) => (
                    <group key={`sun-spoke-${idx}`} position={spoke.pos} rotation={[0, -spoke.angle, 0]}>
                        <Box args={[2.8, 0.6, 0.6]}>
                            <meshStandardMaterial color="#b45309" emissive="#f59e0b" emissiveIntensity={0.5} />
                        </Box>
                        {/* Crossbar at end */}
                        <Box args={[0.4, 0.4, 1.4]} position={[1.4, 0, 0]}>
                            <meshStandardMaterial color="#78350f" emissive="#fbbf24" emissiveIntensity={0.7} />
                        </Box>
                    </group>
                ))}
            </group>

            {/* LAYER 3: Dual Oscillating Energy Tethers from Sun to Satellites */}
            <lineSegments ref={tetherLinesRef} geometry={tethersGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.8} linewidth={3} />
            </lineSegments>

            {/* 5 Planetary Satellite Hubs with Spinning Square Core */}
            <group ref={planetarySatellitesGroupRef}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <group key={`quantum-sat-${i}`} ref={(el) => (satelliteRefs.current[i] = el)}>
                        {/* Main Ring Circle */}
                        <Torus args={[7.6, 0.8, 16, 48]} rotation={[Math.PI / 2, 0, 0]}>
                            <meshStandardMaterial color="#831843" emissive="#ec4899" emissiveIntensity={0.6} />
                        </Torus>

                        {/* 12 Teeth with Directional Fins */}
                        {satelliteTeeth.map((tooth, j) => (
                            <group key={`sat-tooth-${i}-${j}`} position={tooth.pos} rotation={[0, -tooth.angle, 0]}>
                                <Box args={[2.2, 0.5, 0.5]}>
                                    <meshStandardMaterial color="#831843" emissive="#ec4899" emissiveIntensity={0.5} />
                                </Box>
                                <Box args={[1.2, 0.4, 0.3]} position={[1.1, 0, 0.6]} rotation={[0, Math.PI / 4, 0]}>
                                    <meshStandardMaterial color="#9d174d" emissive="#f43f5e" emissiveIntensity={0.6} />
                                </Box>
                                <Box args={[1.2, 0.4, 0.3]} position={[1.1, 0, -0.6]} rotation={[0, -Math.PI / 4, 0]}>
                                    <meshStandardMaterial color="#9d174d" emissive="#f43f5e" emissiveIntensity={0.6} />
                                </Box>
                            </group>
                        ))}

                        {/* Central Rotating Square Core */}
                        <Box args={[2.0, 2.0, 2.0]} position={[0, 0, 0]}>
                            <meshStandardMaterial color="#831843" emissive="#ec4899" emissiveIntensity={0.8} />
                        </Box>
                    </group>
                ))}
            </group>

            {/* LAYER 4: Outer Perimeter Gear Ring with 60 Oscillating Tooth Fins */}
            <group ref={outerGearRingGroupRef}>
                <Torus args={[52.0, 0.9, 16, 96]} position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.5} />
                </Torus>
                {outerRingTeeth.map((tooth) => (
                    <group key={`outer-gear-${tooth.index}`} position={tooth.pos} rotation={[0, -tooth.angle, 0]}>
                        <Box args={[2.5, 0.8, 0.8]}>
                            <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.5} />
                        </Box>
                        <Box args={[1.2, 0.4, 0.4]} position={[1.2, 0, 0.8]} rotation={[0, Math.PI / 3, 0]}>
                            <meshStandardMaterial color="#155e75" emissive="#22d3ee" emissiveIntensity={0.6} />
                        </Box>
                    </group>
                ))}
            </group>

            {/* LAYER 5: 100 Interweaving Bezier Quantum Wave Filaments */}
            <lineSegments geometry={bezierFilamentsGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.5} linewidth={1.5} />
            </lineSegments>
        </group>
    );
}
