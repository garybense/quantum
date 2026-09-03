import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ChronosSynchroMesh = React.lazy(() => import('./ChronosSynchroMesh').then(m => ({ default: m.ChronosSynchroMesh })));
const QuantumResonanceRelay = React.lazy(() => import('./QuantumResonanceRelay').then(m => ({ default: m.QuantumResonanceRelay })));
const XenonIonVortex = React.lazy(() => import('./XenonIonVortex').then(m => ({ default: m.XenonIonVortex })));
const PlanetaryGearboxVortex = React.lazy(() => import('./PlanetaryGearboxVortex').then(m => ({ default: m.PlanetaryGearboxVortex })));
const HyperArcConduitVortex = React.lazy(() => import('./HyperArcConduitVortex').then(m => ({ default: m.HyperArcConduitVortex })));
const HydraFractalCoreVortex = React.lazy(() => import('./HydraFractalCoreVortex').then(m => ({ default: m.HydraFractalCoreVortex })));
const AetherHarmonicOrreryVortex = React.lazy(() => import('./AetherHarmonicOrreryVortex').then(m => ({ default: m.AetherHarmonicOrreryVortex })));
const RiemannianFoldVortex = React.lazy(() => import('./RiemannianFoldVortex').then(m => ({ default: m.RiemannianFoldVortex })));
const ChronosOmniDifferentialVortex = React.lazy(() => import('./ChronosOmniDifferentialVortex').then(m => ({ default: m.ChronosOmniDifferentialVortex })));

const RINGS_COUNT = 3;
const MAX_DEPTH_FRACTAL = 2;
const MAX_DEPTH_XENON = 2;
const MAX_DEPTH_BIFURCATION = 2;
const MAX_DEPTH_HYPERARC = 1;
const MAX_DEPTH_HYDRA = 3;
const MAX_DEPTH_TENSOR = 1;

const staticNodeCoords = new Float32Array(12 * 3);

export type FractalAlgorithmMode = 'neuralIgnition' | 'unified' | 'chronos' | 'quantumRelay' | 'interference' | 'xenon' | 'bifurcation' | 'hyperarc' | 'hydra' | 'tensor' | 'planetaryGearbox' | 'hyperArcConduit' | 'hydraFractalCore' | 'aetherHarmonic' | 'riemannianFold' | 'chronosOmni';

interface FractalSingularityProps {
    mode?: FractalAlgorithmMode;
    combo?: number;
    isPulling?: boolean;
    speed?: number;
    impactPulse?: number;
    activeHazardCount?: number;
    timeScale?: number;
    isRewinding?: boolean;
    locusPos?: THREE.Vector3 | null;
    onAlignSatellites?: (satelliteIndex: number) => void;
    isPaused?: boolean;
    subsystem1Power?: number;
    subsystem2Power?: number;
    subsystem3Power?: number;
    isShieldActive?: boolean;
}

export function FractalSingularity({ 
    mode = 'unified',
    combo = 1,
    isPulling = false,
    speed = 1.0,
    impactPulse = 0,
    activeHazardCount = 0,
    timeScale = 1.0,
    isRewinding = false,
    locusPos = null,
    onAlignSatellites,
    isPaused = false,
    subsystem1Power = 1.0,
    subsystem2Power = 1.0,
    subsystem3Power = 1.0,
    isShieldActive = true,
}: FractalSingularityProps) {
    const coreMeshRef1 = useRef<THREE.Mesh>(null);
    const coreMeshRef2 = useRef<THREE.Mesh>(null);
    const coreMeshRef3 = useRef<THREE.Mesh>(null);
    const shieldBubbleRef = useRef<THREE.Mesh>(null);
    const shieldWireframeRef = useRef<THREE.Mesh>(null);
    const shieldRing1Ref = useRef<THREE.Mesh>(null);
    const shieldRing2Ref = useRef<THREE.Mesh>(null);
    const outerRingRef = useRef<THREE.Mesh>(null);
    const outerSecondaryRingRef = useRef<THREE.Mesh>(null);
    const smoothRingAngleRef = useRef<number>(0);
    const smoothSecondaryAngleRef = useRef<number>(0);
    const currentVelocityRef = useRef<number>(0.5);

    // Continuous smooth time & phase integration refs (eliminates frame snaps/glitches)
    const accumulatedTimeRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const smoothFlowRef = useRef<number>(1.0);
    const smoothSpeedRef = useRef<number>(1.0);
    const pulsePhaseRef = useRef<number>(0);
    const rewindGlowPhaseRef = useRef<number>(0);

    // Dynamic Algorithmic Dimensions Attached to Gameplay Aspects - Refined to prevent themes from leaking
    const showInterference = mode === 'neuralIgnition' || mode === 'interference' || (mode === 'unified' && (isPulling || speed > 1.2));
    const showXenon = mode === 'xenon' || (mode === 'unified' && (combo >= 4 || activeHazardCount > 3));
    const showBifurcation = mode === 'bifurcation' || (mode === 'unified' && (impactPulse > 0.5 || isRewinding));
    const showHyperArc = mode === 'hyperArcConduit' || mode === 'hyperarc' || (mode === 'unified' && (speed > 1.5 || timeScale >= 2.0));
    const showHydra = mode === 'hydraFractalCore' || mode === 'hydra' || (mode === 'unified' && (combo >= 6 || timeScale <= 0.5));
    const showTensor = mode === 'tensor' || (mode === 'unified' && (impactPulse > 0.8 || combo >= 8));

    // Group refs for non-Euclidean central arcs (Eq 2)
    const centralArcsGroupRef = useRef<THREE.Group>(null);
    // Group ref for external kinetic teeth boundary (Eq 2)
    const kineticTeethGroupRef = useRef<THREE.Group>(null);

    // Group refs for Event Horizon Perimeter & Quantum Threads (Eq 3)
    const eventHorizonNodesGroupRef = useRef<THREE.Group>(null);
    const kineticCenterOrbitersGroupRef = useRef<THREE.Group>(null);

    // Group refs for Hyper Arc Event Horizon & Singular Core Arc (Eq 4)
    const hyperArcNodesGroupRef = useRef<THREE.Group>(null);
    const hyperCoreArcRef = useRef<THREE.Mesh>(null);

    // Group refs for Hydra Core Triangles & Outer Containment Nodes (Eq 5)
    const hydraTrianglesGroupRef = useRef<THREE.Group>(null);
    const hydraParticlesGroupRef = useRef<THREE.Group>(null);

    // Group refs for Tensor Polyhedral Nodes, Collision Midpoint Spheres, Torus & Pulse Cylinder (Eq 6)
    const tensorNodesGroupRef = useRef<THREE.Group>(null);
    const tensorCollisionSpheresGroupRef = useRef<THREE.Group>(null);
    const tensorEventHorizonTorusRef = useRef<THREE.Mesh>(null);
    const tensorInnerPulseCylinderRef = useRef<THREE.Mesh>(null);
    const inversionBeamGroupRef = useRef<THREE.Group>(null);

    const tempColor = useMemo(() => new THREE.Color(), []);

    // Buffer geometry for Eq 1: Complex Parametric Fractal Lines
    const complexLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 3000;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 2: Fractal Xenon Lines
    const xenonLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 4000;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 3: Non-Linear Bending Bifurcation Fractal Core
    const bifurcationLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 3500;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 3: Interconnecting Quantum Threads
    const quantumThreadsGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 100;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 4: Recursive Hyper Arc Interlocking Lines
    const hyperArcLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 4500;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 5: Geometric Hydra 6-Fold Bifurcation & Outer Containment Arcs
    const hydraLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 5000;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    // Buffer geometry for Eq 6: Hyper-Riemannian Tensor-Cluster Inter-Node Plasma Filaments
    const tensorLineGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        const maxPoints = 5000;
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxPoints * 3), 3));
        return geom;
    }, []);

    useFrame((state, delta) => {
        if (isPaused) return;

        frameCountRef.current++;
        const shouldUpdateGeometry = frameCountRef.current % 2 === 0;

        const safeDelta = Math.min(delta, 0.05); // Guard against frame time spikes

        const targetFlowFactor = isRewinding ? -1.2 : timeScale;
        const targetSpeedBoost = 1.0 + (combo * 0.08) + (isPulling ? 0.2 : 0.0);

        // Smoothly interpolate dynamic speed and flow factors to prevent any discontinuous angle snaps
        smoothFlowRef.current += (targetFlowFactor - smoothFlowRef.current) * Math.min(1.0, safeDelta * 3.0);
        smoothSpeedRef.current += (targetSpeedBoost - smoothSpeedRef.current) * Math.min(1.0, safeDelta * 3.0);

        // Kinetic Machine Power Average (0.35 baseline at game start so vortex always rotates smoothly, ramps to 1.0+ as accomplishments are made)
        const avgPower = Math.max(0.35, (subsystem1Power + subsystem2Power + subsystem3Power) / 3);

        // Continuous time accumulation (100% continuous phase)
        accumulatedTimeRef.current += safeDelta * 0.25 * smoothSpeedRef.current * smoothFlowRef.current * avgPower;
        const t = accumulatedTimeRef.current;

        // Continuous pulse phase & glow integration
        pulsePhaseRef.current += safeDelta * 2.0 * Math.max(0.1, Math.abs(smoothFlowRef.current));
        rewindGlowPhaseRef.current += safeDelta * 12.0;

        // Novelty Probability Factor ($P_{\text{novelty}}$): derived from combo, hazard density, and impact pulse
        const noveltyProbability = Math.min(1.0, (combo * 0.18) + (activeHazardCount * 0.1) + impactPulse * 0.5);

        // 1. Central High-Contrast Singularity Core Pulsing (Reacts to Pulling & Impact Pulses)
        if (coreMeshRef1.current && coreMeshRef2.current && coreMeshRef3.current) {
            const pullPulse = isPulling ? 1.4 : 1.0;
            const impactScale = 1.0 + Math.sin(t * 12.0) * impactPulse * 0.3;
            const size1 = (2.5 + Math.sin(t * 2.0) * 0.5) * pullPulse * impactScale;
            const size2 = size1 * 0.7;
            const size3 = size1 * 0.4;

            coreMeshRef1.current.scale.setScalar(size1);
            coreMeshRef2.current.scale.setScalar(size2);
            coreMeshRef3.current.scale.setScalar(size3);

            const h1 = ((t * 0.3 + 0.1 + combo * 0.05) % 1.0);
            const h2 = ((t * 0.3 + 0.3 + combo * 0.05) % 1.0);
            const h3 = ((t * 0.3 + 0.5 + combo * 0.05) % 1.0);

            // Dynamic logic-driven emissive intensity: low/clean when idle, glowing during active events
            const dynamicCoreEmissive = 0.5 + (isPulling ? 1.5 : 0) + (impactPulse * 2.5) + (combo > 1 ? (combo - 1) * 0.15 : 0) + (isRewinding ? 1.2 : 0);

            const mat1 = coreMeshRef1.current.material as THREE.MeshStandardMaterial;
            if (mat1 && mat1.emissive) {
                mat1.emissive.setHSL(h1, 0.95, 0.6);
                mat1.emissiveIntensity = dynamicCoreEmissive;
            }
            const mat2 = coreMeshRef2.current.material as THREE.MeshStandardMaterial;
            if (mat2 && mat2.emissive) {
                mat2.emissive.setHSL(h2, 0.95, 0.7);
                mat2.emissiveIntensity = dynamicCoreEmissive * 0.9;
            }
            const mat3 = coreMeshRef3.current.material as THREE.MeshStandardMaterial;
            if (mat3 && mat3.emissive) {
                mat3.emissive.setHSL(h3, 1.0, 0.9);
                mat3.emissiveIntensity = dynamicCoreEmissive * 1.1;
            }
        }

        // Central Forcefield Shield Bubble Animation & Rotation
        if (shieldBubbleRef.current && shieldWireframeRef.current && shieldRing1Ref.current && shieldRing2Ref.current) {
            shieldBubbleRef.current.visible = isShieldActive;
            shieldWireframeRef.current.visible = isShieldActive;
            shieldRing1Ref.current.visible = isShieldActive;
            shieldRing2Ref.current.visible = isShieldActive;

            if (isShieldActive) {
                const sPulse = 1.0 + Math.sin(t * 4.0) * 0.04 + impactPulse * 0.15;
                shieldBubbleRef.current.scale.setScalar(sPulse);
                shieldWireframeRef.current.scale.setScalar(sPulse * 1.01);
                
                shieldWireframeRef.current.rotation.y = t * 1.2;
                shieldWireframeRef.current.rotation.x = t * 0.8;

                shieldRing1Ref.current.rotation.z = t * 2.5;
                shieldRing1Ref.current.rotation.y = t * 1.5;

                shieldRing2Ref.current.rotation.z = -t * 3.0;
                shieldRing2Ref.current.rotation.x = t * 2.0;

                const bubbleMat = shieldBubbleRef.current.material as THREE.MeshStandardMaterial;
                if (bubbleMat && bubbleMat.emissive) {
                    if (impactPulse > 0.5) {
                        // Scorching crimson-red violent impact flash
                        bubbleMat.emissive.setRGB(1.0, 0.05, 0.25);
                        bubbleMat.emissiveIntensity = 5.0 + impactPulse * 10.0;
                    } else {
                        bubbleMat.emissive.setHSL((0.95 + Math.sin(t * 3.0) * 0.05) % 1, 0.95, 0.55);
                        bubbleMat.emissiveIntensity = 2.0 + impactPulse * 3.0 + Math.sin(t * 8.0) * 0.5;
                    }
                }
            }
        }

        // Tachyon Graviton Inversion Beam (Active when Shield is DOWN)
        if (inversionBeamGroupRef.current) {
            inversionBeamGroupRef.current.visible = !isShieldActive;
            if (!isShieldActive) {
                inversionBeamGroupRef.current.rotation.y = t * 1.2;
                inversionBeamGroupRef.current.children.forEach((child, idx) => {
                    const group = child as THREE.Group;
                    if (group && group.children.length > 0) {
                        const mesh = group.children[0] as THREE.Mesh;
                        if (mesh && mesh.material) {
                            const mat = mesh.material as THREE.MeshStandardMaterial;
                            if (mat && mat.emissive) {
                                mat.emissiveIntensity = 2.5 + Math.sin(t * 8 + idx) * 1.2 + impactPulse * 3.0;
                            }
                        }
                    }
                });
            }
        }

        // 2. Eq 2: Non-Euclidean Interlocking Central Arcs
        if (centralArcsGroupRef.current) {
            centralArcsGroupRef.current.visible = showXenon;
            if (showXenon) {
                const arcEmissive = 0.4 + (isPulling ? 1.2 : 0) + impactPulse * 2.0;
                centralArcsGroupRef.current.children.forEach((child, k) => {
                    const rot = t * (k + 1) * 0.3;
                    child.rotation.y = rot;
                    child.rotation.z = Math.sin(t + k) * 0.2;
                    const mesh = child as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) {
                            const arcHue = ((t * 0.2 + k * 0.15) % 1.0);
                            mat.emissive.setHSL(arcHue, 0.9, 0.6);
                            mat.emissiveIntensity = arcEmissive;
                        }
                    }
                });
            }
        }

        // 3. Outermost Giant Rotating Ring (Temporal Dynamics & Novelty Indicator)
        // Smoothly transitions between rotational rates without glitching or snapping
        const flowDirection = isRewinding ? -1.0 : 1.0;
        const baseSpeed = 2.8;
        const targetVelocity = baseSpeed * timeScale * flowDirection * Math.max(0.6, subsystem1Power);

        // Smooth momentum transition (inertia) during rotational rate/direction changes
        const transitionRate = 3.0; // Smooth momentum glide
        currentVelocityRef.current += (targetVelocity - currentVelocityRef.current) * Math.min(1.0, safeDelta * transitionRate);

        smoothRingAngleRef.current += safeDelta * currentVelocityRef.current;
        smoothSecondaryAngleRef.current -= safeDelta * currentVelocityRef.current * 1.25;

        if (outerRingRef.current) {
            // Pure rotation around local Z axis inside parent rotated group (100% glitch-free)
            outerRingRef.current.rotation.z = smoothRingAngleRef.current;

            // Subtle breathing pulse based on integrated phase
            const outerPulse = 1.0 + Math.sin(pulsePhaseRef.current) * 0.03 * (1.0 + noveltyProbability);
            outerRingRef.current.scale.set(outerPulse, outerPulse, outerPulse);

            // Dynamic Colour & Emissive Texture based on rate of flow, direction & novelty state
            let ringHue = 0.55; // Default Cyan (200deg)
            let saturation = 0.95;
            let lightness = 0.6;

            if (isRewinding) {
                // Chrono Rewind: Emerald Quantum Flow
                ringHue = 0.42; // ~150deg
                lightness = 0.7 + Math.sin(rewindGlowPhaseRef.current) * 0.15;
            } else if (timeScale === 0.25) {
                // Bullet-Time Stasis: Ice Cyan Cryo Glow
                ringHue = 0.52; // ~190deg
                lightness = 0.55 + noveltyProbability * 0.2;
            } else if (timeScale === 2.5) {
                // Chrono Overclock: Violet Solar Flare
                ringHue = (0.8 + noveltyProbability * 0.12) % 1; // ~290deg - 330deg
                lightness = 0.75;
            } else {
                // Standard Continuum: Dynamic Shift by Novelty Probability
                ringHue = (0.50 + noveltyProbability * 0.25) % 1; // Shifts cyan -> amber/gold
                lightness = 0.60 + noveltyProbability * 0.2;
            }

            const mat = outerRingRef.current.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
                mat.emissive.setHSL(ringHue, saturation, lightness);
                // Logical glow surge: clean base (0.4), surges when pulling gravity, high combo, impact, or rewinding
                mat.emissiveIntensity = 0.4 + (isPulling ? 1.0 : 0) + (combo > 1 ? (combo - 1) * 0.1 : 0) + impactPulse * 1.5 + (isRewinding ? 1.2 : 0);
            }
        }

        if (outerSecondaryRingRef.current) {
            // Counter-rotating outer halo ring
            outerSecondaryRingRef.current.rotation.z = smoothSecondaryAngleRef.current;
            const mat2 = outerSecondaryRingRef.current.material as THREE.MeshBasicMaterial;
            if (mat2 && mat2.color) {
                const haloHue = (isRewinding ? 0.45 : (timeScale === 2.5 ? 0.85 : 0.58 + noveltyProbability * 0.2)) % 1;
                mat2.color.setHSL(haloHue, 0.95, 0.65);
                mat2.opacity = 0.4 + noveltyProbability * 0.5;
            }
        }

        // 4. Eq 2: External Kinetic Boundary: Geometric teeth rim
        if (kineticTeethGroupRef.current) {
            kineticTeethGroupRef.current.visible = showXenon;
            if (showXenon) {
                const rimSegments = 12;
                kineticTeethGroupRef.current.children.forEach((tooth, i) => {
                    const ang = ((Math.PI * 2) / rimSegments) * i + smoothRingAngleRef.current;
                    const rad = 52.0; // Aligned with the outermost giant rotating ring
                    tooth.position.set(Math.cos(ang) * rad, 1, Math.sin(ang) * rad);
                    tooth.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.4);
                });
            }
        }

        // 5. Eq 3: High-Density Kinetic Center Orbiters
        if (kineticCenterOrbitersGroupRef.current) {
            kineticCenterOrbitersGroupRef.current.visible = showBifurcation;
            if (showBifurcation) {
                kineticCenterOrbitersGroupRef.current.rotation.y = -t * 2;
                kineticCenterOrbitersGroupRef.current.children.forEach((orbiter, k) => {
                    const orbit = 4 + k * 2.5;
                    const ox = Math.cos(t * (k + 2)) * orbit;
                    const oz = Math.sin(t * (k + 2)) * orbit;
                    const oy = Math.sin(t * 3 + k) * 1.5;

                    orbiter.position.set(ox, oy, oz);
                    const mesh = orbiter as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) {
                            const orbHue = ((t * 200 + k * 60) % 360) / 360;
                            mat.emissive.setHSL(orbHue, 1.0, 0.7);
                        }
                    }
                });
            }
        }

        // 6. Eq 3: Event Horizon Perimeter Nodes & Quantum Threads
        if (quantumThreadsGeometry) {
            const posAttr = quantumThreadsGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = quantumThreadsGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showBifurcation) {
                const numNodes = 12;
                const slice = (Math.PI * 2) / numNodes;

                for (let j = 0; j < numNodes; j++) {
                    const ang = j * slice + smoothRingAngleRef.current;
                    const r = 52.0; // Aligned directly with the outermost giant rotating ring
                    const x = Math.cos(ang) * r;
                    const z = Math.sin(ang) * r;
                    const y = 3 + Math.cos(t * 2 + j) * 1.2;

                    staticNodeCoords[j * 3] = x;
                    staticNodeCoords[j * 3 + 1] = y;
                    staticNodeCoords[j * 3 + 2] = z;

                    if (eventHorizonNodesGroupRef.current && eventHorizonNodesGroupRef.current.children[j]) {
                        const nodeMesh = eventHorizonNodesGroupRef.current.children[j] as THREE.Mesh;
                        if (nodeMesh) {
                            nodeMesh.visible = true;
                            nodeMesh.position.set(x, y, z);
                            if (nodeMesh.material) {
                                const mat = nodeMesh.material as THREE.MeshStandardMaterial;
                                if (mat && mat.emissive) {
                                    const nodeHue = ((t * 100 + j * 20) % 360) / 360;
                                    mat.emissive.setHSL(nodeHue, 0.95, 0.65);
                                }
                            }
                        }
                    }
                }

                for (let j = 0; j < numNodes; j++) {
                    const nextJ = (j + 1) % numNodes;
                    const x1 = staticNodeCoords[j * 3];
                    const y1 = staticNodeCoords[j * 3 + 1];
                    const z1 = staticNodeCoords[j * 3 + 2];
                    const x2 = staticNodeCoords[nextJ * 3];
                    const y2 = staticNodeCoords[nextJ * 3 + 1];
                    const z2 = staticNodeCoords[nextJ * 3 + 2];

                    posArr[pointIdx * 3] = x1;
                    posArr[pointIdx * 3 + 1] = y1;
                    posArr[pointIdx * 3 + 2] = z1;

                    tempColor.setHSL(((t * 80 + j * 30) % 360) / 360, 0.8, 0.8);
                    colArr[pointIdx * 3] = tempColor.r;
                    colArr[pointIdx * 3 + 1] = tempColor.g;
                    colArr[pointIdx * 3 + 2] = tempColor.b;
                    pointIdx++;

                    posArr[pointIdx * 3] = x2;
                    posArr[pointIdx * 3 + 1] = y2;
                    posArr[pointIdx * 3 + 2] = z2;

                    colArr[pointIdx * 3] = tempColor.r;
                    colArr[pointIdx * 3 + 1] = tempColor.g;
                    colArr[pointIdx * 3 + 2] = tempColor.b;
                    pointIdx++;
                }
            } else if (eventHorizonNodesGroupRef.current) {
                eventHorizonNodesGroupRef.current.children.forEach((child) => {
                    child.visible = false;
                });
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            quantumThreadsGeometry.setDrawRange(0, pointIdx);
        }

        // 7. Eq 4: Hyper Arc Singular Core Arc & Horizon Border
        if (hyperCoreArcRef.current && hyperArcNodesGroupRef.current) {
            hyperCoreArcRef.current.visible = showHyperArc;
            hyperArcNodesGroupRef.current.visible = showHyperArc;

            if (showHyperArc) {
                hyperCoreArcRef.current.rotation.y = -t * 4;
                if (hyperCoreArcRef.current.material) {
                    const mat = hyperCoreArcRef.current.material as THREE.MeshStandardMaterial;
                    if (mat && mat.emissive) mat.emissive.setHSL((t * 200) % 1, 1.0, 0.7);
                }

                hyperArcNodesGroupRef.current.children.forEach((node, j) => {
                    const pAngle = j * ((Math.PI * 2) / 12) + t * 2;
                    const pDist = 45 + Math.sin(t * 5 + j) * 3;
                    const px = Math.cos(pAngle) * pDist;
                    const pz = Math.sin(pAngle) * pDist;
                    const py = 5 + Math.sin(t * 3 + j) * 1.5;

                    node.position.set(px, py, pz);
                    const mesh = node as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) {
                            const hHue = ((t * 100 + j * 30) % 360) / 360;
                            mat.emissive.setHSL(hHue, 0.9, 0.7);
                        }
                    }
                });
            }
        }

        // 8. Eq 5: Geometric Hydra Non-Euclidean Core Triangles & Hyper-Kinetic Orbiters
        if (hydraTrianglesGroupRef.current && hydraParticlesGroupRef.current) {
            hydraTrianglesGroupRef.current.visible = showHydra;
            hydraParticlesGroupRef.current.visible = showHydra;

            if (showHydra) {
                // Non-Euclidean Counter-Rotating Triangles (-t * 5)
                hydraTrianglesGroupRef.current.rotation.y = -t * 5;
                hydraTrianglesGroupRef.current.children.forEach((tri, j) => {
                    const rotY = (Math.PI * 2 / 3) * j;
                    tri.rotation.y = rotY;
                    const mesh = tri as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) {
                            const triHue = ((t * 300 + j * 120) % 360) / 360;
                            mat.emissive.setHSL(triHue, 1.0, 0.7);
                        }
                    }
                });

                // 6 Hyper-Kinetic Particle Orbiters
                hydraParticlesGroupRef.current.children.forEach((pMesh, i) => {
                    const phase = i * (Math.PI * 2 / 6);
                    const px = Math.cos(phase - t * 3) * 48;
                    const pz = Math.sin(phase - t * 3) * 48;
                    const py = 5 + Math.sin(t * 4 + i) * 2;

                    pMesh.position.set(px, py, pz);
                    const mesh = pMesh as THREE.Mesh;
                    if (mesh && mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) {
                            mat.emissive.setHSL((t * 150 + i * 60) % 1, 1.0, 0.8);
                        }
                    }
                });
            }
        }

        // 9. Render Eq 1: Complex Parametric Fractal Folding
        if (complexLineGeometry) {
            const posAttr = complexLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = complexLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showInterference) {
                const drawComplexBranch = (
                    originX: number, originY: number, originZ: number,
                    len: number, depth: number, angleOffset: number, currentRotation: number
                ) => {
                    if (depth <= 0 || pointIdx >= 2900) return;

                    const hue = ((t * 50 + depth * 35 + len) % 360) / 360;
                    tempColor.setHSL(hue, 0.95, 0.65);

                    const segments = 6;
                    let prevX = originX;
                    let prevY = originY;
                    let prevZ = originZ;

                    for (let i = 1; i <= segments; i++) {
                        const segment = i / segments;
                        const spiralX = Math.cos(t * 2 + depth) * (len * 0.1 * segment);
                        const spiralY = Math.sin(t * 3 - depth) * (len * 0.1 * segment);
                        const spiralZ = Math.sin(t * 1.5 + depth) * (len * 0.08 * segment);

                        const dirX = Math.cos(currentRotation) * (segment * len) + spiralX;
                        const dirZ = Math.sin(currentRotation) * (segment * len) + spiralZ;
                        const dirY = spiralY;

                        const nextX = originX + dirX;
                        const nextY = originY + dirY;
                        const nextZ = originZ + dirZ;

                        if (pointIdx < 2900) {
                            posArr[pointIdx * 3] = prevX;
                            posArr[pointIdx * 3 + 1] = prevY;
                            posArr[pointIdx * 3 + 2] = prevZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;

                            posArr[pointIdx * 3] = nextX;
                            posArr[pointIdx * 3 + 1] = nextY;
                            posArr[pointIdx * 3 + 2] = nextZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;
                        }

                        prevX = nextX;
                        prevY = nextY;
                        prevZ = nextZ;
                    }

                    const rot = angleOffset + Math.sin(t * 1.5 + depth) * (Math.PI / 3);
                    const scaleFactor = 0.72 + Math.sin(t) * 0.05;

                    drawComplexBranch(prevX, prevY, prevZ, len * scaleFactor, depth - 1, angleOffset, currentRotation + rot);
                    drawComplexBranch(prevX, prevY, prevZ, len * scaleFactor * 0.8, depth - 1, angleOffset, currentRotation - rot * 1.2);
                };

                for (let r = 0; r < RINGS_COUNT; r++) {
                    const ringAngle = ((Math.PI * 2) / RINGS_COUNT) * r + t * 0.5;
                    const startDist = 8 + Math.sin(t + r) * 4;
                    const startX = Math.cos(ringAngle) * startDist;
                    const startZ = Math.sin(ringAngle) * startDist;

                    drawComplexBranch(startX, 5, startZ, 12, MAX_DEPTH_FRACTAL, Math.PI / 4, ringAngle);
                }
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            complexLineGeometry.setDrawRange(0, pointIdx);
        }

        // 10. Render Eq 2: Fractal Xenon (Lissajous Vertex Distortion)
        if (xenonLineGeometry) {
            const posAttr = xenonLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = xenonLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showXenon) {
                const fractalXenon3D = (
                    x: number, y: number, z: number,
                    size: number, angle: number, depth: number
                ) => {
                    if (depth > MAX_DEPTH_XENON || pointIdx >= 3800) return;

                    const sides = 3;
                    const drift = Math.sin(t * 0.5 + depth) * 4;
                    const hue = ((t * 40 + depth * 55) % 360) / 360;
                    tempColor.setHSL(hue, 0.9, 0.6);

                    let firstX = 0, firstY = 0, firstZ = 0;
                    let prevX = 0, prevY = 0, prevZ = 0;

                    for (let i = 0; i <= sides; i++) {
                        const a = ((Math.PI * 2) / sides) * i + angle + t;
                        const px = x + Math.cos(a) * size + Math.sin(t * 2 + depth) * 2;
                        const py = y + Math.sin(t * 1.5 + depth) * 1.5;
                        const pz = z + Math.sin(a) * size + Math.cos(t * 1.5 + depth) * 2;

                        if (i === 0) {
                            firstX = px; firstY = py; firstZ = pz;
                        } else if (pointIdx < 3800) {
                            posArr[pointIdx * 3] = prevX;
                            posArr[pointIdx * 3 + 1] = prevY;
                            posArr[pointIdx * 3 + 2] = prevZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;

                            posArr[pointIdx * 3] = px;
                            posArr[pointIdx * 3 + 1] = py;
                            posArr[pointIdx * 3 + 2] = pz;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;
                        }

                        prevX = px; prevY = py; prevZ = pz;
                    }

                    for (let j = 0; j < 2; j++) {
                        const mult = j === 0 ? 1 : -1;
                        const branchAngle = angle + (Math.PI / 2) * mult + Math.sin(t + depth) * 0.5;
                        const nextSize = size * (0.55 + Math.cos(t * 0.7) * 0.1);
                        const nx = x + Math.cos(branchAngle) * (size * 0.3 + drift);
                        const ny = y + Math.sin(t * 0.8 + depth) * 0.8;
                        const nz = z + Math.sin(branchAngle) * (size * 0.3 + drift);

                        fractalXenon3D(nx, ny, nz, nextSize, branchAngle + t * mult, depth + 1);
                    }
                };

                for (let r = 0; r < 5; r++) {
                    const rootAngle = ((Math.PI * 2) / 5) * r;
                    const rootX = Math.cos(rootAngle) * (15 + Math.cos(t * 0.8) * 3);
                    const rootZ = Math.sin(rootAngle) * (15 + Math.sin(t * 1.2) * 3);

                    fractalXenon3D(rootX, 5, rootZ, 6, t + rootAngle, 0);
                }
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            xenonLineGeometry.setDrawRange(0, pointIdx);
        }

        // 11. Render Eq 3: Non-Linear Bending Bifurcation Fractal Core
        if (bifurcationLineGeometry) {
            const posAttr = bifurcationLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = bifurcationLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showBifurcation) {
                const drawBifurcationCore = (
                    originX: number, originY: number, originZ: number,
                    len: number, depth: number, angleOffset: number, currentRot: number
                ) => {
                    if (depth > MAX_DEPTH_BIFURCATION || pointIdx >= 3300) return;

                    const hue = ((t * 50 + depth * 35 + len) % 360) / 360;
                    tempColor.setHSL(hue, 0.95, 0.65);

                    const bend = Math.sin(t * 1.5 + depth * 0.8) * 0.7;
                    const branchAngle = Math.PI / 4 + Math.sin(t) * 0.2;

                    const finalAngle = currentRot + angleOffset + bend;
                    const nextX = originX + Math.cos(finalAngle) * len;
                    const nextZ = originZ + Math.sin(finalAngle) * len;
                    const nextY = originY + Math.sin(t * 2 + depth) * 1.2;

                    if (pointIdx < 3300) {
                        posArr[pointIdx * 3] = originX;
                        posArr[pointIdx * 3 + 1] = originY;
                        posArr[pointIdx * 3 + 2] = originZ;

                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;

                        posArr[pointIdx * 3] = nextX;
                        posArr[pointIdx * 3 + 1] = nextY;
                        posArr[pointIdx * 3 + 2] = nextZ;

                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;
                    }

                    if (depth < 4) {
                        drawBifurcationCore(nextX, nextY, nextZ, len * 0.7, depth + 1, branchAngle, finalAngle);
                        drawBifurcationCore(nextX, nextY, nextZ, len * 0.7, depth + 1, -branchAngle, finalAngle);
                    }
                };

                for (let i = 0; i < 4; i++) {
                    const baseAngle = i * (Math.PI / 2) + t * 0.5;
                    drawBifurcationCore(0, 5, 0, 10, 0, 0, baseAngle);
                }
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            bifurcationLineGeometry.setDrawRange(0, pointIdx);
        }

        // 12. Render Eq 4: Recursive Hyper Arc Matrix Engine (`recursiveHyperArc`)
        if (hyperArcLineGeometry) {
            const posAttr = hyperArcLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = hyperArcLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showHyperArc) {
                const recursiveHyperArc3D = (
                    cx: number, cy: number, cz: number,
                    radius: number, angle: number, depth: number, limit: number
                ) => {
                    if (depth > limit || pointIdx >= 4300) return;

                    const hue = ((t * 40 + depth * 50 + radius * 3) % 360) / 360;
                    tempColor.setHSL(hue, 0.9, 0.65);

                    const arcSpan = Math.PI * (0.5 + 0.5 * Math.sin(t + depth));
                    const arcSegments = 10;
                    let prevX = cx + Math.cos(angle) * radius;
                    let prevZ = cz + Math.sin(angle) * radius;
                    let prevY = cy + Math.sin(t * 1.5 + depth) * 1.5;

                    for (let s = 1; s <= arcSegments; s++) {
                        const stepAngle = angle + (s / arcSegments) * arcSpan;
                        const currX = cx + Math.cos(stepAngle) * radius;
                        const currZ = cz + Math.sin(stepAngle) * radius;
                        const currY = cy + Math.sin(t * 1.5 + depth + s * 0.1) * 1.5;

                        if (pointIdx < 4300) {
                            posArr[pointIdx * 3] = prevX;
                            posArr[pointIdx * 3 + 1] = prevY;
                            posArr[pointIdx * 3 + 2] = prevZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;

                            posArr[pointIdx * 3] = currX;
                            posArr[pointIdx * 3 + 1] = currY;
                            posArr[pointIdx * 3 + 2] = currZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;
                        }

                        prevX = currX;
                        prevY = currY;
                        prevZ = currZ;
                    }

                    const subRadius = radius * 0.65;
                    const offX = Math.cos(angle + t) * (radius - subRadius);
                    const offZ = Math.sin(angle + t) * (radius - subRadius);

                    recursiveHyperArc3D(
                        cx + offX, cy + Math.cos(t + depth), cz + offZ,
                        subRadius, angle - t, depth + 1, limit
                    );

                    recursiveHyperArc3D(
                        cx - offX, cy - Math.cos(t + depth), cz - offZ,
                        subRadius, angle + Math.PI + t, depth + 1, limit
                    );
                };

                for (let i = 0; i < 4; i++) {
                    const engineAngle = i * (Math.PI / 2) + t * 0.2;
                    recursiveHyperArc3D(0, 5, 0, 16, Math.sin(t * 0.5) * Math.PI + engineAngle, 0, MAX_DEPTH_HYPERARC);
                }

                for (let j = 0; j < 12; j++) {
                    const pAngle = j * ((Math.PI * 2) / 12) + t * 2;
                    const pDist = 45 + Math.sin(t * 5 + j) * 3;
                    const px = Math.cos(pAngle) * pDist;
                    const pz = Math.sin(pAngle) * pDist;
                    const py = 5 + Math.sin(t * 3 + j) * 1.5;

                    if (pointIdx < 4300) {
                        posArr[pointIdx * 3] = px * 0.8;
                        posArr[pointIdx * 3 + 1] = py * 0.8;
                        posArr[pointIdx * 3 + 2] = pz * 0.8;

                        tempColor.setHSL(((t * 100 + j * 30) % 360) / 360, 0.9, 0.7);
                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;

                        posArr[pointIdx * 3] = px;
                        posArr[pointIdx * 3 + 1] = py;
                        posArr[pointIdx * 3 + 2] = pz;

                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;
                    }
                }
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            hyperArcLineGeometry.setDrawRange(0, pointIdx);
        }

        // 13. Render Eq 5: Geometric Hydra 6-Fold Symmetry Engine (`fractalHydra`)
        if (hydraLineGeometry) {
            const posAttr = hydraLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = hydraLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showHydra) {
                const fractalHydra3D = (
                    ox: number, oy: number, oz: number,
                    len: number, depth: number, angleOffset: number, currentRot: number
                ) => {
                    if (depth > MAX_DEPTH_HYDRA || pointIdx >= 4800) return;

                    const hue = ((t * 60 + depth * 45 + len * 2) % 360) / 360;
                    tempColor.setHSL(hue, 0.9, 0.65);

                    const branchDirX = Math.cos(currentRot + angleOffset) * len;
                    const branchDirZ = Math.sin(currentRot + angleOffset) * len;
                    const branchDirY = Math.sin(t + depth) * 1.5;

                    const nextX = ox + branchDirX;
                    const nextY = oy + branchDirY;
                    const nextZ = oz + branchDirZ;

                    if (pointIdx < 4800) {
                        posArr[pointIdx * 3] = ox;
                        posArr[pointIdx * 3 + 1] = oy;
                        posArr[pointIdx * 3 + 2] = oz;

                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;

                        posArr[pointIdx * 3] = nextX;
                        posArr[pointIdx * 3 + 1] = nextY;
                        posArr[pointIdx * 3 + 2] = nextZ;

                        colArr[pointIdx * 3] = tempColor.r;
                        colArr[pointIdx * 3 + 1] = tempColor.g;
                        colArr[pointIdx * 3 + 2] = tempColor.b;
                        pointIdx++;
                    }

                    // Self-similar geometric bifurcation
                    for (let i = -1; i <= 1; i += 2) {
                        const rot = i * (Math.PI / 4 + Math.sin(t * 0.8) * 0.5);
                        fractalHydra3D(
                            nextX, nextY, nextZ,
                            len * 0.68, depth + 1, angleOffset * 1.1, currentRot + rot
                        );
                    }
                };

                // 6-fold primary symmetry engine
                const symmetry = 6;
                for (let i = 0; i < symmetry; i++) {
                    const phase = i * ((Math.PI * 2) / symmetry);
                    const engineRot = phase + t * 0.5;

                    fractalHydra3D(0, 5, 0, 11 + Math.sin(t + phase) * 2.5, 0, Math.sin(t * 0.3) * 0.2, engineRot);

                    // Outer Containment Ring Arcs
                    const ringRadius = 46 + Math.cos(t * 2 + phase) * 2.5;
                    const arcSegments = 8;
                    const arcSpan = 0.8;

                    let prevArcX = Math.cos(phase) * ringRadius;
                    let prevArcZ = Math.sin(phase) * ringRadius;

                    for (let a = 1; a <= arcSegments; a++) {
                        const currAngle = phase + (a / arcSegments) * arcSpan;
                        const currArcX = Math.cos(currAngle) * ringRadius;
                        const currArcZ = Math.sin(currAngle) * ringRadius;
                        const currArcY = 5 + Math.sin(t * 2 + phase) * 1.2;

                        if (pointIdx < 4800) {
                            posArr[pointIdx * 3] = prevArcX;
                            posArr[pointIdx * 3 + 1] = currArcY;
                            posArr[pointIdx * 3 + 2] = prevArcZ;

                            tempColor.setHSL(((t * 80 + phase * 50) % 360) / 360, 0.85, 0.7);
                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;

                            posArr[pointIdx * 3] = currArcX;
                            posArr[pointIdx * 3 + 1] = currArcY;
                            posArr[pointIdx * 3 + 2] = currArcZ;

                            colArr[pointIdx * 3] = tempColor.r;
                            colArr[pointIdx * 3 + 1] = tempColor.g;
                            colArr[pointIdx * 3 + 2] = tempColor.b;
                            pointIdx++;
                        }

                        prevArcX = currArcX;
                        prevArcZ = currArcZ;
                    }
                }
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            hydraLineGeometry.setDrawRange(0, pointIdx);
        }

        // 14. Render Eq 6: Hyper-Riemannian Tensor-Cluster (`fractalTensorField`)
        if (tensorLineGeometry) {
            const posAttr = tensorLineGeometry.getAttribute('position') as THREE.BufferAttribute;
            const colAttr = tensorLineGeometry.getAttribute('color') as THREE.BufferAttribute;

            const posArr = posAttr.array as Float32Array;
            const colArr = colAttr.array as Float32Array;
            let pointIdx = 0;

            if (showTensor) {
                const tensorNodes: { x: number; y: number; z: number; d: number }[] = [];

                const fractalTensorField = (x: number, y: number, z: number, size: number, depth: number) => {
                    if (depth > MAX_DEPTH_TENSOR || pointIdx >= 4800) return;

                    // Trigonometric fractal displacement
                    const ox = Math.sin(t + depth + x * 0.01) * size;
                    const oy = Math.cos(t * 0.8 - depth + y * 0.01) * size;
                    const oz = Math.sin(t * 1.2 + depth * 2) * size;

                    const nx = x + ox;
                    const ny = y + oy;
                    const nz = z + oz;

                    // Spherical collision dynamics: bound within 38 units radius
                    const dFromCenter = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    let finalX = nx, finalY = ny, finalZ = nz;
                    if (dFromCenter > 38) {
                        const ratio = 38 / (dFromCenter || 1);
                        finalX *= ratio;
                        finalY *= ratio;
                        finalZ *= ratio;
                    }

                    tensorNodes.push({ x: finalX, y: finalY + 5, z: finalZ, d: depth });

                    // Tetrahedral split recursion
                    const nextSize = size * 0.65;
                    fractalTensorField(finalX, finalY, finalZ, nextSize, depth + 1);
                    fractalTensorField(finalX, finalY, finalZ, -nextSize, depth + 1);
                };

                // Seed 4 cardinal points
                for (let i = 0; i < 4; i++) {
                    const angle = ((Math.PI * 2) / 4) * i;
                    const sx = Math.cos(angle) * 10;
                    const sz = Math.sin(angle) * 10;
                    fractalTensorField(sx, 0, sz, 20, 0);
                }

                // Update polyhedral box node meshes in tensorNodesGroupRef
                if (tensorNodesGroupRef.current) {
                    tensorNodesGroupRef.current.visible = true;
                    tensorNodesGroupRef.current.children.forEach((meshObj, idx) => {
                        if (idx < tensorNodes.length) {
                            const node = tensorNodes[idx];
                            meshObj.visible = true;
                            meshObj.position.set(node.x, node.y, node.z);
                            meshObj.rotation.x = t + node.d;
                            meshObj.rotation.y = t * 0.5;
                            const mesh = meshObj as THREE.Mesh;
                            if (mesh && mesh.material) {
                                const mat = mesh.material as THREE.MeshStandardMaterial;
                                if (mat && mat.emissive) {
                                    const hue = ((t * 80 + node.d * 60 + Math.sqrt(node.x * node.x + node.z * node.z) * 5) % 360) / 360;
                                    mat.emissive.setHSL(hue, 0.95, 0.7);
                                }
                            }
                        } else {
                            meshObj.visible = true;
                            meshObj.position.set(Math.cos(idx) * 25, 5, Math.sin(idx) * 25);
                            const mesh = meshObj as THREE.Mesh;
                            if (mesh && mesh.material) {
                                const mat = mesh.material as THREE.MeshStandardMaterial;
                                if (mat && mat.emissive) {
                                    mat.emissive.setRGB(0.02, 0.04, 0.06);
                                    mat.emissiveIntensity = 0.1;
                                }
                            }
                        }
                    });
                }

                // Inter-Node Collision Arcs (Tensor plasma lines & midpoint feedback spheres)
                let sphereIdx = 0;
                for (let i = 0; i < tensorNodes.length; i += 2) {
                    const n1 = tensorNodes[i];
                    for (let j = i + 1; j < tensorNodes.length; j += 4) {
                        const n2 = tensorNodes[j];
                        const dx = n1.x - n2.x;
                        const dy = n1.y - n2.y;
                        const dz = n1.z - n2.z;
                        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                        if (dist < 18) {
                            // Plasma tensor line filament
                            if (pointIdx < 4800) {
                                posArr[pointIdx * 3] = n1.x;
                                posArr[pointIdx * 3 + 1] = n1.y;
                                posArr[pointIdx * 3 + 2] = n1.z;

                                tempColor.setHSL(((t * 120 + dist * 10) % 360) / 360, 1.0, 0.75);
                                colArr[pointIdx * 3] = tempColor.r;
                                colArr[pointIdx * 3 + 1] = tempColor.g;
                                colArr[pointIdx * 3 + 2] = tempColor.b;
                                pointIdx++;

                                posArr[pointIdx * 3] = n2.x;
                                posArr[pointIdx * 3 + 1] = n2.y;
                                posArr[pointIdx * 3 + 2] = n2.z;

                                colArr[pointIdx * 3] = tempColor.r;
                                colArr[pointIdx * 3 + 1] = tempColor.g;
                                colArr[pointIdx * 3 + 2] = tempColor.b;
                                pointIdx++;
                            }

                            // Collision feedback midpoint spheres - Ignited state when coupling active
                            if (tensorCollisionSpheresGroupRef.current && sphereIdx < tensorCollisionSpheresGroupRef.current.children.length) {
                                const midX = (n1.x + n2.x) / 2;
                                const midY = (n1.y + n2.y) / 2;
                                const midZ = (n1.z + n2.z) / 2;

                                const sphereMesh = tensorCollisionSpheresGroupRef.current.children[sphereIdx] as THREE.Mesh;
                                if (sphereMesh) {
                                    sphereMesh.visible = true;
                                    sphereMesh.position.set(midX, midY, midZ);
                                    const scaleVal = Math.max(0.4, (18 - dist) * 0.12);
                                    sphereMesh.scale.setScalar(scaleVal);
                                    if (sphereMesh.material) {
                                        const mat = sphereMesh.material as THREE.MeshStandardMaterial;
                                        if (mat && mat.emissive) {
                                            mat.emissive.setHSL((t * 200 + sphereIdx * 30) % 1, 1.0, 0.8);
                                            mat.emissiveIntensity = 1.2;
                                        }
                                    }
                                }
                                sphereIdx++;
                            }
                        }
                    }
                }

                // Extinguish ignitions on unused collision spheres (keep visible at resting positions)
                if (tensorCollisionSpheresGroupRef.current) {
                    tensorCollisionSpheresGroupRef.current.visible = true;
                    for (let s = sphereIdx; s < tensorCollisionSpheresGroupRef.current.children.length; s++) {
                        const sphereMesh = tensorCollisionSpheresGroupRef.current.children[s] as THREE.Mesh;
                        if (sphereMesh) {
                            sphereMesh.visible = true;
                            const ang = (s * Math.PI * 2) / 12;
                            sphereMesh.position.set(Math.cos(ang) * 32, 5, Math.sin(ang) * 32);
                            sphereMesh.scale.setScalar(0.5);
                            if (sphereMesh.material) {
                                const mat = sphereMesh.material as THREE.MeshStandardMaterial;
                                if (mat && mat.emissive) {
                                    mat.emissive.setRGB(0.04, 0.03, 0.02);
                                    mat.emissiveIntensity = 0.1;
                                }
                            }
                        }
                    }
                }

                // Outer Event Horizon Shell Torus (Triangular Profile)
                if (tensorEventHorizonTorusRef.current) {
                    tensorEventHorizonTorusRef.current.visible = true;
                    tensorEventHorizonTorusRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.3;
                    tensorEventHorizonTorusRef.current.rotation.y = t * 0.7;
                    if (tensorEventHorizonTorusRef.current.material) {
                        const mat = tensorEventHorizonTorusRef.current.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) mat.emissive.setHSL((t * 40) % 1, 1.0, 0.7);
                    }
                }

                // Inner Singularity Pulse Cylinder
                if (tensorInnerPulseCylinderRef.current) {
                    tensorInnerPulseCylinderRef.current.visible = true;
                    tensorInnerPulseCylinderRef.current.rotation.z = t * 3;
                    const pulseH = 15 + Math.sin(t * 10) * 4;
                    tensorInnerPulseCylinderRef.current.scale.set(1, pulseH / 15, 1);
                    if (tensorInnerPulseCylinderRef.current.material) {
                        const mat = tensorInnerPulseCylinderRef.current.material as THREE.MeshStandardMaterial;
                        if (mat && mat.emissive) mat.emissive.setHSL((t * 180 + 180) % 1, 1.0, 0.85);
                    }
                }
            } else {
                if (tensorNodesGroupRef.current) tensorNodesGroupRef.current.visible = false;
                if (tensorCollisionSpheresGroupRef.current) tensorCollisionSpheresGroupRef.current.visible = false;
                if (tensorEventHorizonTorusRef.current) tensorEventHorizonTorusRef.current.visible = false;
                if (tensorInnerPulseCylinderRef.current) tensorInnerPulseCylinderRef.current.visible = false;
            }

            if (shouldUpdateGeometry) {
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;
            }
            tensorLineGeometry.setDrawRange(0, pointIdx);
        }
    });

    return (
        <group>
            {/* High-Contrast Central Singularity Core */}
            <group position={[0, 5, 0]}>
                <mesh ref={coreMeshRef1}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={0.6} transparent opacity={0.6} />
                </mesh>
                <mesh ref={coreMeshRef2}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="#be123c" emissive="#f43f5e" emissiveIntensity={0.6} transparent opacity={0.8} />
                </mesh>
                <mesh ref={coreMeshRef3}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="#b45309" emissive="#fbbf24" emissiveIntensity={0.8} />
                </mesh>

                {/* HIGH-VISIBILITY FORCEFIELD SHIELD BUBBLE */}
                <mesh ref={shieldBubbleRef}>
                    <sphereGeometry args={[9.5, 32, 32]} />
                    <meshStandardMaterial 
                        color="#e11d48" 
                        emissive="#f43f5e" 
                        emissiveIntensity={2.2} 
                        transparent 
                        opacity={0.35} 
                        roughness={0.1} 
                        metalness={0.9} 
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <mesh ref={shieldWireframeRef}>
                    <sphereGeometry args={[9.6, 20, 20]} />
                    <meshBasicMaterial color="#fb7185" wireframe transparent opacity={0.7} />
                </mesh>
                <mesh ref={shieldRing1Ref}>
                    <torusGeometry args={[9.8, 0.35, 16, 64]} />
                    <meshStandardMaterial color="#e11d48" emissive="#f43f5e" emissiveIntensity={3.0} />
                </mesh>
                <mesh ref={shieldRing2Ref} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[9.8, 0.35, 16, 64]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={3.0} />
                </mesh>

                {/* TACHYON GRAVITON INVERSION BEAM (Active when Shield is DOWN) */}
                <group ref={inversionBeamGroupRef}>
                    {[0, 1, 2, 3].map((k) => (
                        <group key={k} rotation={[0, (Math.PI / 2) * k, 0]}>
                            <mesh position={[28, 5, 0]} rotation={[0, 0, Math.PI / 2]}>
                                <cylinderGeometry args={[0.5, 1.6, 52, 16]} />
                                <meshBasicMaterial
                                    color="#f59e0b" 
                                    transparent 
                                    opacity={0.6} 
                                    wireframe
                                />
                            </mesh>
                        </group>
                    ))}
                </group>
            </group>

            {/* Main Decorative Line Geometry */}
            <lineSegments geometry={complexLineGeometry}>
                <lineBasicMaterial vertexColors linewidth={2} transparent opacity={0.85} />
            </lineSegments>

            {/* Outermost Giant Rotating Ring (3D Torus + Counter-Rotating Glyphic Halo) */}
            <group position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh ref={outerRingRef}>
                    <torusGeometry args={[52, 0.7, 16, 96]} />
                    <meshLambertMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.5} />
                </mesh>
                <mesh ref={outerSecondaryRingRef}>
                    <ringGeometry args={[53.8, 55.2, 64]} />
                    <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.3} />
                </mesh>
            </group>

            <React.Suspense fallback={null}>
                {mode === 'chronos' && (
                    <ChronosSynchroMesh
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'quantumRelay' && (
                    <QuantumResonanceRelay
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'xenon' && (
                    <XenonIonVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'planetaryGearbox' && (
                    <PlanetaryGearboxVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'hyperArcConduit' && (
                    <HyperArcConduitVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'hydraFractalCore' && (
                    <HydraFractalCoreVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'aetherHarmonic' && (
                    <AetherHarmonicOrreryVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'riemannianFold' && (
                    <RiemannianFoldVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
                {mode === 'chronosOmni' && (
                    <ChronosOmniDifferentialVortex
                        isPulling={isPulling}
                        timeScale={timeScale}
                        isRewinding={isRewinding}
                        onAlignSatellites={onAlignSatellites}
                        active={true}
                        isPaused={isPaused}
                        subsystem1Power={subsystem1Power}
                        subsystem2Power={subsystem2Power}
                        subsystem3Power={subsystem3Power}
                    />
                )}
            </React.Suspense></group>
    );
}
