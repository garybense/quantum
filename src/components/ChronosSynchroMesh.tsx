import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface ChronosSynchroMeshProps {
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

export function ChronosSynchroMesh({
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
}: ChronosSynchroMeshProps) {
    const outerRingGroupRef = useRef<THREE.Group>(null);
    const middleCogGroupRef = useRef<THREE.Group>(null);
    const satelliteOrbitGroupRef = useRef<THREE.Group>(null);
    const innerCoreGroupRef = useRef<THREE.Group>(null);
    const kineticSpokesGroupRef = useRef<THREE.Group>(null);
    const waveShellGroupRef = useRef<THREE.Group>(null);

    const satelliteRefs = useRef<(THREE.Group | null)[]>([]);
    const satelliteCooldowns = useRef<number[]>([0, 0, 0, 0, 0, 0]);
    const [alignedSatellites, setAlignedSatellites] = useState<boolean[]>([false, false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Buffer geometry for Layer 1: Undulating Background Wave Shell (6-fold sine wave rings)
    const waveShellGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const numRings = 6;
        const ptsPerRing = 48;
        const maxPoints = numRings * ptsPerRing * 2;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Layer 6: 24 Pulsing Kinetic Mesh Spokes with Oscillating Nodes
    const spokesGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 24 * 2;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.6 : 1.0;

        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);
        accumTimeRef.current += safeDelta * 0.8 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;
        const hB = ((t * 40) % 360) / 360; // Hue baseline (0..1)
        const speed = 0.6;

        const p1 = 0.35 + subsystem1Power * 0.65;
        const p2 = 0.35 + subsystem2Power * 0.65;
        const p3 = 0.35 + subsystem3Power * 0.65;

        // LAYER 1: Undulating Background Wave Shell (6-fold sine rings)
        if (waveShellGeometry) {
            const posAttr = waveShellGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = waveShellGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pIdx = 0;

            for (let i = 0; i < 6; i++) {
                const ringOffsetAngle = (i * Math.PI * 2) / 6;
                const pts = 48;
                let prevX = 0, prevZ = 0;

                for (let a = 0; a <= 360; a += 360 / pts) {
                    const radA = THREE.MathUtils.degToRad(a);
                    const waveR = 36.0 + Math.sin(radA * 3 + t * 2.5) * 2.0;
                    const finalA = radA + ringOffsetAngle + t * 0.1;

                    const currX = Math.cos(finalA) * waveR;
                    const currZ = Math.sin(finalA) * waveR;
                    const currY = 0.2 + Math.sin(t * 1.5 + i) * 0.5;

                    if (a > 0 && pIdx < 6 * 48 * 2) {
                        posArr[pIdx * 3] = prevX;
                        posArr[pIdx * 3 + 1] = currY;
                        posArr[pIdx * 3 + 2] = prevZ;

                        tempColor.setHSL((hB + 0.08) % 1, 0.3, 0.85);
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
                    }

                    prevX = currX;
                    prevZ = currZ;
                }
            }

            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
            waveShellGeometry.setDrawRange(0, pIdx);
        }

        // LAYER 2: Outer Gear Teeth Ring (16 Spiked Teeth, outerR = 31.0, rot = t * speed * p1)
        if (outerRingGroupRef.current) {
            outerRingGroupRef.current.rotation.y = t * speed * p1;
            outerRingGroupRef.current.children.forEach((child, i) => {
                const toothHue = (hB + (i * 10) / 360) % 1;
                child.children.forEach((meshObj) => {
                    const mesh = meshObj as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                            mat.emissive.setHSL(toothHue, 0.85, 0.1 + subsystem1Power * 0.5);
                            mat.emissiveIntensity = 0.2 + subsystem1Power * 1.5;
                        }
                    }
                });
            });
        }

        // LAYER 3: Counter-Rotating Intermediate Cog Wheel Ring (ringR = 21.0, rot = -t * speed * 1.5 * p2)
        if (middleCogGroupRef.current) {
            middleCogGroupRef.current.rotation.y = -t * speed * 1.5 * p2;
            const cogHue = (hB + 0.5) % 1; // +180 deg
            middleCogGroupRef.current.children.forEach((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh && mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                        mat.emissive.setHSL(cogHue, 0.9, 0.1 + subsystem2Power * 0.55);
                        mat.emissiveIntensity = 0.2 + subsystem2Power * 1.6;
                    }
                }
            });
        }

        // LAYER 4: 6 Planetary Satellite Sub-Orbs (orbR = 52.0, rot = t * speed * 0.75 * p3)
        if (satelliteOrbitGroupRef.current) {
            satelliteOrbitGroupRef.current.rotation.y = t * speed * 1.8 * p3;

            // Check proximity between locusPos and each satellite in world space
            for (let k = 0; k < 6; k++) {
                if (satelliteCooldowns.current[k] > 0) {
                    satelliteCooldowns.current[k] -= safeDelta;
                }

                const satGroup = satelliteRefs.current[k];
                if (satGroup) {
                    satGroup.rotation.y = -t * speed * 3.5 * p3;

                    // Compute satellite world position
                    const satAngle = (k * Math.PI * 2) / 6 + t * speed * 1.8 * p3;
                    const orbR = 52.0;
                    const satX = Math.cos(satAngle) * orbR;
                    const satY = 3.0;
                    const satZ = Math.sin(satAngle) * orbR;

                    // Interactive alignment with player core
                    if (locusPos && satelliteCooldowns.current[k] <= 0 && subsystem3Power > 0.1) {
                        const dx = locusPos.x - satX;
                        const dy = locusPos.y - satY;
                        const dz = locusPos.z - satZ;
                        const distSq = dx * dx + dy * dy + dz * dz;
                        if (distSq < 23.04) { // 4.8 * 4.8
                            satelliteCooldowns.current[k] = 3.5; // Cooldown
                            soundEngine.playChronosSynchroMeshSound();

                            setAlignedSatellites((prev) => {
                                const next = [...prev];
                                next[k] = true;
                                return next;
                            });

                            if (onAlignSatellites) {
                                onAlignSatellites(k);
                            }
                        }
                    }

                    // Update material colors for satellite k
                    const satHue = (hB + (k * 40) / 360) % 1;
                    const isAligned = satelliteCooldowns.current[k] > 2.0;

                    satGroup.children.forEach((child) => {
                        const mesh = child as THREE.Mesh;
                        if (mesh && mesh.material) {
                            const mat = mesh.material as THREE.MeshStandardMaterial;
                            if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                                mat.emissive.setHSL(isAligned ? 0.15 : satHue, 1.0, isAligned ? 0.9 : 0.1 + subsystem3Power * 0.6);
                                mat.emissiveIntensity = isAligned ? 3.0 : (0.1 + subsystem3Power * 1.5);
                            }
                        }
                    });
                }
            }
        }

        // LAYER 5: Inner Counter-Rotating Synchro Core (coreR = 6.0, rot = -t * speed * 2.5)
        if (innerCoreGroupRef.current) {
            innerCoreGroupRef.current.rotation.y = -t * speed * 2.5;
            const coreHue = (hB + (280 / 360)) % 1;
            const coreEmissive = 0.5 + (isPulling ? 1.5 : 0) + (isRewinding ? 1.2 : 0);
            innerCoreGroupRef.current.children.forEach((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh && mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                        mat.emissive.setHSL(coreHue, 1.0, 0.75);
                        mat.emissiveIntensity = coreEmissive;
                    }
                }
            });
        }

        // LAYER 6: 24 Pulsing Kinetic Mesh Spokes with Oscillating Nodes
        if (spokesGeometry && kineticSpokesGroupRef.current) {
            const posAttr = spokesGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = spokesGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pIdx = 0;

            for (let l = 0; l < 24; l++) {
                const spokeAngle = (l * Math.PI * 2) / 24;
                const meshOffset = Math.sin(t * 3.0 + l * 0.8) * 3.0;

                const innerR = 9.0 + meshOffset;
                const outerR = 12.0 + meshOffset;

                const x1 = Math.cos(spokeAngle) * innerR;
                const z1 = Math.sin(spokeAngle) * innerR;
                const x2 = Math.cos(spokeAngle) * outerR;
                const z2 = Math.sin(spokeAngle) * outerR;
                const y = 2.0;

                if (pIdx < 24 * 2) {
                    posArr[pIdx * 3] = x1;
                    posArr[pIdx * 3 + 1] = y;
                    posArr[pIdx * 3 + 2] = z1;

                    tempColor.setHSL((hB + (l * 15) / 360) % 1, 1.0, 0.7);
                    colArr[pIdx * 3] = tempColor.r;
                    colArr[pIdx * 3 + 1] = tempColor.g;
                    colArr[pIdx * 3 + 2] = tempColor.b;
                    pIdx++;

                    posArr[pIdx * 3] = x2;
                    posArr[pIdx * 3 + 1] = y;
                    posArr[pIdx * 3 + 2] = z2;

                    colArr[pIdx * 3] = tempColor.r;
                    colArr[pIdx * 3 + 1] = tempColor.g;
                    colArr[pIdx * 3 + 2] = tempColor.b;
                    pIdx++;
                }

                // Update node sphere mesh positions in kineticSpokesGroupRef
                const nodeMesh = kineticSpokesGroupRef.current.children[l] as THREE.Mesh;
                if (nodeMesh) {
                    nodeMesh.position.set(x1, y, z1);
                    if (nodeMesh.material) {
                        const mat = nodeMesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive && typeof mat.emissive.setHSL === 'function') {
                            mat.emissive.setHSL((hB + (l * 15) / 360) % 1, 1.0, 0.85);
                        }
                    }
                }
            }

            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
            spokesGeometry.setDrawRange(0, pIdx);
        }
    });

    // Outer Gear Teeth geometries pre-constructed for Layer 2
    const outerTeethElements = useMemo(() => {
        const outerR = 52.0;
        return Array.from({ length: 16 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 16;
            const x = Math.cos(a) * outerR;
            const z = Math.sin(a) * outerR;
            return { index: i, angle: a, pos: [x, 2.0, z] as [number, number, number] };
        });
    }, []);

    // Intermediate cog notches for Layer 3
    const intermediateNotches = useMemo(() => {
        const ringR = 21.0;
        return Array.from({ length: 30 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 30;
            const x = Math.cos(a) * (ringR + 1.2);
            const z = Math.sin(a) * (ringR + 1.2);
            return { angle: a, pos: [x, 2.0, z] as [number, number, number] };
        });
    }, []);

    // Satellite gear sub-cogs for Layer 4
    const satelliteSubCogs = useMemo(() => {
        return Array.from({ length: 12 }).map((_, n) => {
            const a = (n * Math.PI * 2) / 12;
            const dist = 5.4;
            return { angle: a, x: Math.cos(a) * dist, z: Math.sin(a) * dist };
        });
    }, []);

    // Inner core cogs for Layer 5
    const innerCoreCogs = useMemo(() => {
        const coreR = 6.0;
        return Array.from({ length: 12 }).map((_, m) => {
            const a = (m * Math.PI * 2) / 12;
            const x = Math.cos(a) * (coreR + 1.5);
            const z = Math.sin(a) * (coreR + 1.5);
            return { angle: a, pos: [x, 2.0, z] as [number, number, number] };
        });
    }, []);

    if (!active) return null;

    return (
        <group position={[0, 0, 0]}>
            {/* LAYER 1: Undulating Background Wave Shell Lines */}
            <lineSegments geometry={waveShellGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.35} linewidth={2} />
            </lineSegments>

            {/* LAYER 2: Outer Gear Teeth Ring (16 Spiked Teeth with Directional Fins) */}
            <group ref={outerRingGroupRef}>
                {outerTeethElements.map((tooth) => (
                    <group key={`outer-tooth-${tooth.index}`} position={tooth.pos} rotation={[0, -tooth.angle, 0]}>
                        {/* Main Spiked Tooth Bar */}
                        <Box args={[3.2, 0.8, 1.2]}>
                            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.2} />
                        </Box>
                        {/* Directional Fin 1 */}
                        <Box args={[1.4, 0.5, 0.4]} position={[1.8, 0, 0.8]} rotation={[0, Math.PI / 4, 0]}>
                            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.2} />
                        </Box>
                        {/* Directional Fin 2 */}
                        <Box args={[1.4, 0.5, 0.4]} position={[1.8, 0, -0.8]} rotation={[0, -Math.PI / 4, 0]}>
                            <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.2} />
                        </Box>
                    </group>
                ))}
            </group>

            {/* LAYER 3: Counter-Rotating Intermediate Cog Wheel Ring (ringR = 21.0) */}
            <group ref={middleCogGroupRef}>
                <Torus args={[21.0, 0.6, 16, 64]} position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#6b21a8" emissive="#a855f7" emissiveIntensity={0.5} roughness={0.2} />
                </Torus>
                {intermediateNotches.map((notch, idx) => (
                    <Box key={`cog-notch-${idx}`} args={[2.2, 0.6, 0.6]} position={notch.pos} rotation={[0, -notch.angle, 0]}>
                        <meshStandardMaterial color="#6b21a8" emissive="#a855f7" emissiveIntensity={0.5} roughness={0.2} />
                    </Box>
                ))}
            </group>

            {/* LAYER 4: 6 Planetary Satellite Sub-Orbs (orbR = 52.0) */}
            <group ref={satelliteOrbitGroupRef}>
                {Array.from({ length: 6 }).map((_, k) => {
                    const pA = (k * Math.PI * 2) / 6;
                    const orbR = 52.0;
                    const oX = Math.cos(pA) * orbR;
                    const oZ = Math.sin(pA) * orbR;

                    return (
                        <group
                            key={`satellite-hub-${k}`}
                            ref={(el) => (satelliteRefs.current[k] = el)}
                            position={[oX, 3.0, oZ]}
                        >
                            {/* Main Outer Satellite Ellipse Ring */}
                            <Torus args={[5.0, 0.35, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshStandardMaterial color="#b45309" emissive="#f59e0b" emissiveIntensity={0.5} roughness={0.2} />
                            </Torus>
                            {/* 12 Radiating Gear Teeth around Satellite */}
                            {satelliteSubCogs.map((subCog, n) => (
                                <Box
                                    key={`sat-cog-${k}-${n}`}
                                    args={[1.8, 0.4, 0.4]}
                                    position={[subCog.x, 0, subCog.z]}
                                    rotation={[0, -subCog.angle, 0]}
                                >
                                    <meshStandardMaterial color="#b45309" emissive="#f59e0b" emissiveIntensity={0.5} />
                                </Box>
                            ))}
                            {/* Central Mini-Core Sphere */}
                            <Sphere args={[1.2, 10, 10]}>
                                <meshStandardMaterial color="#78350f" emissive="#fbbf24" emissiveIntensity={0.7} />
                            </Sphere>
                        </group>
                    );
                })}
            </group>

            {/* LAYER 5: Inner Counter-Rotating Synchro Core (coreR = 6.0) */}
            <group ref={innerCoreGroupRef}>
                <Torus args={[6.0, 0.8, 16, 48]} position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#831843" emissive="#ec4899" emissiveIntensity={0.6} roughness={0.2} />
                </Torus>
                {innerCoreCogs.map((cog, m) => (
                    <Box key={`core-cog-${m}`} args={[2.5, 0.8, 0.8]} position={cog.pos} rotation={[0, -cog.angle, 0]}>
                        <meshStandardMaterial color="#831843" emissive="#ec4899" emissiveIntensity={0.6} roughness={0.2} />
                    </Box>
                ))}
            </group>

            {/* LAYER 6: 24 Pulsing Kinetic Mesh Spokes with Oscillating Nodes */}
            <lineSegments geometry={spokesGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.8} linewidth={3} />
            </lineSegments>

            <group ref={kineticSpokesGroupRef}>
                {Array.from({ length: 24 }).map((_, l) => (
                    <Sphere key={`spoke-node-${l}`} args={[0.5, 12, 12]}>
                        <meshStandardMaterial color="#0e7490" emissive="#06b6d4" emissiveIntensity={0.6} />
                    </Sphere>
                ))}
            </group>
        </group>
    );
}
