import * as THREE from 'three';
const _scratchVec = new THREE.Vector3();
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus, Sphere, Box, Sparkles as DreiSparkles } from '@react-three/drei';
import { soundEngine } from '../audio';

interface XenonIonVortexProps {
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

export function XenonIonVortex({
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
}: XenonIonVortexProps) {
    const vortexGroupRef = useRef<THREE.Group>(null);
    const centralSunRef = useRef<THREE.Group>(null);
    const planetsGroupRef = useRef<THREE.Group>(null);
    const outerRingRef = useRef<THREE.Group>(null);
    const sineArmsRef = useRef<THREE.LineSegments>(null);
    const tethersRef = useRef<THREE.LineSegments>(null);
    const spikyTeethRef = useRef<THREE.LineSegments>(null);

    const planetRefs = useRef<(THREE.Group | null)[]>([]);
    const planetCooldowns = useRef<number[]>([0, 0, 0, 0, 0]);
    const [alignedPlanets, setAlignedPlanets] = useState<boolean[]>([false, false, false, false, false]);

    const accumTimeRef = useRef<number>(0);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // 1. Sine wave vortex arms geometry (3 arms)
    const sineArmsGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const numArms = 3;
        const ptsPerArm = 64;
        const maxPts = numArms * ptsPerArm * 2;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
        return geom;
    }, []);

    // 2. Connecting arm lines from Sun to 5 Planets
    const tethersGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPts = 5 * 2 * 3; // 5 planets * 2 points (sun to planet) * 3 coords
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
        return geom;
    }, []);

    // 3. Outer spiky teeth line geometry (32 teeth)
    const spikyTeethGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const count = 32;
        const posArr = new Float32Array(count * 2 * 3);
        const colArr = new Float32Array(count * 2 * 3);
        geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (!active || isPaused) return;

        const safeDelta = Math.min(delta, 0.05);
        const flowDir = isRewinding ? -1.2 : timeScale;
        const speedBoost = isPulling ? 1.5 : 1.0;
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        accumTimeRef.current += safeDelta * 0.7 * flowDir * speedBoost * avgPower;
        const t = accumTimeRef.current;
        const hueBase = (t * 30) % 360;

        // 1. Update Sine Wave Vortex Arms
        if (sineArmsRef.current && sineArmsGeometry) {
            const posAttr = sineArmsGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = sineArmsGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pIdx = 0;

            for (let i = 0; i < 3; i++) {
                const armRot = i * ((Math.PI * 2) / 3) + Math.cos(t * 0.4) * 0.3 + t * 0.2;
                const pts = 64;
                let prevX = 0, prevZ = 0;

                for (let step = 0; step <= pts; step++) {
                    const a = (step / pts) * Math.PI * 2;
                    const r = 18.0 + Math.sin(a * 4 + t) * 1.5;
                    const localX = Math.cos(a) * r;
                    const localZ = Math.sin(a) * r * 0.5;

                    // Rotate by armRot
                    const cosR = Math.cos(armRot);
                    const sinR = Math.sin(armRot);
                    const x = localX * cosR - localZ * sinR;
                    const z = localX * sinR + localZ * cosR;
                    const y = 0.5 + i * 0.2;

                    if (step > 0) {
                        posArr[pIdx * 3] = prevX;
                        posArr[pIdx * 3 + 1] = y;
                        posArr[pIdx * 3 + 2] = prevZ;

                        posArr[(pIdx + 1) * 3] = x;
                        posArr[(pIdx + 1) * 3 + 1] = y;
                        posArr[(pIdx + 1) * 3 + 2] = z;

                        tempColor.setHSL(((hueBase + i * 50) % 360) / 360, 0.7, 0.6);
                        colArr[pIdx * 3] = tempColor.r;
                        colArr[pIdx * 3 + 1] = tempColor.g;
                        colArr[pIdx * 3 + 2] = tempColor.b;
                        colArr[(pIdx + 1) * 3] = tempColor.r;
                        colArr[(pIdx + 1) * 3 + 1] = tempColor.g;
                        colArr[(pIdx + 1) * 3 + 2] = tempColor.b;

                        pIdx += 2;
                    }
                    prevX = x;
                    prevZ = z;
                }
            }
            sineArmsGeometry.setDrawRange(0, pIdx);
            sineArmsGeometry.attributes.position.needsUpdate = true;
            sineArmsGeometry.attributes.color.needsUpdate = true;
        }

        // 2. Update Planet Positions & Tethers
        const sunRadius = 5.0;
        const planetRadius = 4.0;
        const orbitRadiusSum = sunRadius + planetRadius;
        const numPlanets = 5;

        if (tethersRef.current && tethersGeometry) {
            const posAttr = tethersGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = tethersGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;

            for (let i = 0; i < numPlanets; i++) {
                const orbitAngle = (i * ((Math.PI * 2) / numPlanets)) + (t * 0.6);
                const px = Math.cos(orbitAngle) * orbitRadiusSum;
                const pz = Math.sin(orbitAngle) * orbitRadiusSum;

                // Sun center to planet
                posArr[i * 6] = 0;
                posArr[i * 6 + 1] = 0;
                posArr[i * 6 + 2] = 0;

                posArr[i * 6 + 3] = px;
                posArr[i * 6 + 4] = 0.2;
                posArr[i * 6 + 5] = pz;

                tempColor.setHSL(((hueBase + 120) % 360) / 360, 0.8, 0.6);
                for (let c = 0; c < 6; c++) {
                    colArr[i * 6 + c] = c < 3 ? tempColor.r : tempColor.r; // simplified color assignment
                }

                const planetGroup = planetRefs.current[i];
                if (planetGroup) {
                    planetGroup.position.set(px, 0.3, pz);
                    planetGroup.rotation.y = orbitAngle * -(sunRadius / planetRadius);
                }

                // Check collision/interaction with protagonist locusPos
                if (locusPos) {
                    const distToPlanet = locusPos.distanceTo(_scratchVec.set(px, 0, pz));
                    if (distToPlanet < 5.0 && planetCooldowns.current[i] <= 0) {
                        planetCooldowns.current[i] = 2.5;
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
            tethersGeometry.attributes.position.needsUpdate = true;
        }

        // 3. Update Outer Spiky Teeth
        if (spikyTeethRef.current && spikyTeethGeometry) {
            const posAttr = spikyTeethGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = spikyTeethGeometry.getAttribute('color') as THREE.BufferAttribute;
            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            const outerR = 22.0; // scaled down from 160
            const toothLen = 2.0;

            const teethRot = -t * 1.2;
            for (let s = 0; s < 32; s++) {
                const sa = (s * ((Math.PI * 2) / 32)) + teethRot;
                const cosS = Math.cos(sa);
                const sinS = Math.sin(sa);

                const x1 = cosS * outerR;
                const z1 = sinS * outerR;
                const x2 = cosS * (outerR + toothLen);
                const z2 = sinS * (outerR + toothLen);

                posArr[s * 6] = x1;
                posArr[s * 6 + 1] = 0.4;
                posArr[s * 6 + 2] = z1;
                posArr[s * 6 + 3] = x2;
                posArr[s * 6 + 4] = 0.4;
                posArr[s * 6 + 5] = z2;

                tempColor.setHSL(((hueBase + s * 5) % 360) / 360, 1.0, 0.7);
                for (let c = 0; c < 6; c++) {
                    colArr[s * 6 + c] = tempColor.r;
                }
            }
            spikyTeethGeometry.attributes.position.needsUpdate = true;
            spikyTeethGeometry.attributes.color.needsUpdate = true;
        }
    });

    if (!active) return null;

    return (
        <group ref={vortexGroupRef} position={[0, 0, 0]}>
            {/* 3 Rotating Sine-Wave Vortex Arms */}
            <lineSegments ref={sineArmsRef} geometry={sineArmsGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.65} linewidth={3} />
            </lineSegments>

            {/* Central Sun Core */}
            <group ref={centralSunRef} position={[0, 0, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[4.5, 5.0, 32]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={1.5} side={THREE.DoubleSide} />
                </mesh>
                {/* 20 Sun Radial Dashes */}
                {Array.from({ length: 20 }).map((_, j) => {
                    const a = (j * Math.PI * 2) / 20;
                    const c = Math.cos(a), s = Math.sin(a);
                    return (
                        <line key={j}>
                            <bufferGeometry attach="geometry" {...new THREE.BufferAttribute(new Float32Array([c * 4.0, 0.2, s * 4.0, c * 5.2, 0.2, s * 5.2]), 3)} />
                            <lineBasicMaterial color="#fef3c7" linewidth={2} />
                        </line>
                    );
                })}
            </group>

            {/* Connecting Tethers Sun -> Planets */}
            <lineSegments ref={tethersRef} geometry={tethersGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.7} linewidth={2} />
            </lineSegments>

            {/* 5 Orbiting Planet Spheres with Rotating Cubes */}
            <group ref={planetsGroupRef}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <group key={i} ref={el => planetRefs.current[i] = el}>
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[3.6, 4.0, 24]} />
                            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} side={THREE.DoubleSide} />
                        </mesh>
                        {/* Inner Rotating Cube */}
                        <Box args={[2.2, 2.2, 2.2]}>
                            <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={0.8} wireframe />
                        </Box>
                        {alignedPlanets[i] && (
                            <DreiSparkles count={15} scale={6} size={3} speed={0.8} color="#f59e0b" />
                        )}
                    </group>
                ))}
            </group>

            {/* Outer Dashed Ring / Event Horizon */}
            <group ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
                <Torus args={[22.0, 0.3, 16, 64]}>
                    <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.8} wireframe />
                </Torus>
            </group>

            {/* Outer Spiky Teeth Rim */}
            <lineSegments ref={spikyTeethRef} geometry={spikyTeethGeometry}>
                <lineBasicMaterial vertexColors transparent opacity={0.9} linewidth={2} />
            </lineSegments>
        </group>
    );
}
