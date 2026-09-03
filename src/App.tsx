import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import { Box, Sphere, Ring, Torus, Sparkles as DreiSparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Plus, RefreshCw, Zap, Shield, Trophy, Award, Flame, Sparkles, AlertTriangle, Cpu, Radio, Heart, Clock, FastForward, Pause, RotateCcw, Target, Compass, Move, Navigation, Smartphone, Sliders, ShoppingBag, Terminal } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { soundEngine } from './audio';
import { RenderPerfStats } from './components/PerfOverlay';
import { gameRefs } from './game/refs';
import { sessionStore, useSessionStore } from './game/sessionStore';
import { CoreHUD, ShieldHUD, LevelHUD, ScoreHUD, TimeScaleHUD, RewindButtonHUD } from './components/HUD';
import { FractalSingularity, FractalAlgorithmMode } from './components/FractalSingularity';
import { CyberItemsAndHazards } from './components/CyberItemsAndHazards';
import { LevelUpModal } from './components/LevelUpModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameOverModal } from './components/GameOverModal';
import { SectorCompleteModal } from './components/SectorCompleteModal';
import { SectorBriefingModal } from './components/SectorBriefingModal';
import { SectorObjectiveHUD } from './components/SectorObjectiveHUD';
import { Joystick } from './components/Joystick';
import { MasterMachineAperture } from './components/MasterMachineAperture';
import { GroundChargerRings } from './components/GroundChargerRings';
import { QuantumVaultModal } from './components/QuantumVaultModal';
import { LoreBriefingModal } from './components/LoreBriefingModal';
import { SECTOR_DEFINITIONS, getSectorDefinition } from './data/sectorDefinitions';
import { CyberItemDrop, RogueVoidHazard, DimensionalShearGate, PlayerStats, LeaderboardEntry, CyberAugment, TemporalState, DynamicTimeScale, SectorProgress } from './types';

let globalUniqueIdCounter = 0;
export function generateUniqueId(prefix: string = 'id'): string {
    globalUniqueIdCounter = (globalUniqueIdCounter + 1) % 10000000;
    return `${prefix}_${Date.now()}_${globalUniqueIdCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

const PARTICLE_COUNT = 12;
const PRIMORDIAL_RADIUS = 0.5;

const ALL_AUGMENTS: CyberAugment[] = [
    { id: 'graviton_1', name: 'Graviton Pulse', description: 'Expands Protagonist gravity pull radius and torque force by +40%', category: 'graviton', statBoost: '+40% Gravity Radius', icon: 'Zap' },
    { id: 'shield_1', name: 'Nano-Shield Capacitor', description: 'Increases Max Shield by +50 and boosts Shield Regen rate by +3.0/sec', category: 'defense', statBoost: '+50 Max Shield & Fast Regen', icon: 'Shield' },
    { id: 'thrusters_1', name: 'Overclock Thrusters', description: 'Boosts Protagonist directional steering speed and ramming force', category: 'offense', statBoost: '+35% Movement Speed', icon: 'Flame' },
    { id: 'magnet_1', name: 'Singularity Magnet', description: 'Magnetically pulls all nearby Cyber Drops, XP nanites, and items', category: 'utility', statBoost: '+15m Magnet Pull Range', icon: 'Sparkles' },
    { id: 'emp_1', name: 'Plasma Feedback EMP', description: 'Discharges an explosive EMP shockwave when colliding with solid objects', category: 'offense', statBoost: 'Collision EMP Shockwaves', icon: 'Radio' },
    { id: 'core_1', name: 'Cyber-Core Matrix', description: 'Restores Core Integrity to 100% and increases Max Core HP by +30', category: 'defense', statBoost: '100% Repair & +30 Core HP', icon: 'Cpu' },
];

export function getAugmentMeta(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('plasma') || lower.includes('emp')) {
        return {
            symbol: '📡',
            shortLabel: 'PLASMA EMP',
            icon: Radio,
            badgeClass: 'bg-indigo-950/90 border-indigo-500/60 text-indigo-300 shadow-indigo-500/30',
            glowColor: '#818cf8',
            accentBg: 'bg-indigo-500/20',
        };
    }
    if (lower.includes('cyber-core') || lower.includes('matrix') || lower.includes('core')) {
        return {
            symbol: '🔮',
            shortLabel: 'CYBER-CORE',
            icon: Cpu,
            badgeClass: 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-500/30',
            glowColor: '#34d399',
            accentBg: 'bg-emerald-500/20',
        };
    }
    if (lower.includes('graviton') || lower.includes('pulse')) {
        return {
            symbol: '⚡',
            shortLabel: 'GRAVITON',
            icon: Zap,
            badgeClass: 'bg-amber-950/90 border-amber-500/60 text-amber-300 shadow-amber-500/30',
            glowColor: '#fbbf24',
            accentBg: 'bg-amber-500/20',
        };
    }
    if (lower.includes('shield') || lower.includes('nano')) {
        return {
            symbol: '🛡️',
            shortLabel: 'NANO-SHIELD',
            icon: Shield,
            badgeClass: 'bg-sky-950/90 border-sky-500/60 text-sky-300 shadow-sky-500/30',
            glowColor: '#38bdf8',
            accentBg: 'bg-sky-500/20',
        };
    }
    if (lower.includes('thruster') || lower.includes('overclock')) {
        return {
            symbol: '🔥',
            shortLabel: 'THRUSTERS',
            icon: Flame,
            badgeClass: 'bg-rose-950/90 border-rose-500/60 text-rose-300 shadow-rose-500/30',
            glowColor: '#f43f5e',
            accentBg: 'bg-rose-500/20',
        };
    }
    if (lower.includes('magnet') || lower.includes('singularity')) {
        return {
            symbol: '✨',
            shortLabel: 'MAGNET',
            icon: Sparkles,
            badgeClass: 'bg-pink-950/90 border-pink-500/60 text-pink-300 shadow-pink-500/30',
            glowColor: '#f472b6',
            accentBg: 'bg-pink-500/20',
        };
    }
    return {
        symbol: '⚡',
        shortLabel: name.toUpperCase(),
        icon: Zap,
        badgeClass: 'bg-slate-900/90 border-amber-500/40 text-amber-300 shadow-amber-500/20',
        glowColor: '#fbbf24',
        accentBg: 'bg-amber-500/20',
    };
}

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
    { id: '1', pilotName: 'NEO_PILOT_01', score: 142500, level: 12, highestCombo: 16, date: '2026-07-23', rank: 1, title: 'SINGULARITY GOD' },
    { id: '2', pilotName: 'VOID_HARVESTER', score: 98400, level: 9, highestCombo: 12, date: '2026-07-22', rank: 2, title: 'GRID HARVESTER' },
    { id: '3', pilotName: 'QUANTUM_SPECTRE', score: 67200, level: 7, highestCombo: 8, date: '2026-07-21', rank: 3, title: 'CYBER OVERLORD' },
    { id: '4', pilotName: 'CYBER_DRIFTER', score: 34100, level: 5, highestCombo: 6, date: '2026-07-20', rank: 4, title: 'QUANTUM PILOT' },
    { id: '5', pilotName: 'NEXUS_OPERATIVE', score: 18900, level: 3, highestCombo: 4, date: '2026-07-19', rank: 5, title: 'RESONANCE VOYAGER' },
];

interface FusionParticle {
    id: number;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    scale: number;
    mass: number;
    fusionLevel: number;
    color: THREE.Color;
    active: boolean;
}

interface SolidPhysicsObjectData {
    id: string;
    type: 'sphere' | 'box' | 'torus';
    position: [number, number, number];
    size: number;
    hue: number;
    colorHex: string;
    mass: number;
}

// Helper function for Haptic API (navigator.vibrate) tactile feedback
const triggerHapticFeedback = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
            navigator.vibrate(pattern);
        } catch {
            // Ignore vibration errors on unsupported platforms/devices
        }
    }
};

// Shatter Debris Explosion Component: Animates fragments flying outward, tumbling under gravity, and fading out gradually
function ShatterDebris({ size, colorHex, type, hue = 200 }: { size: number; colorHex: string; type: 'sphere' | 'box' | 'torus'; hue?: number }) {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number>(performance.now());

    useEffect(() => {
        soundEngine.playShatterSound(size, hue);
    }, [size, hue]);

    const fragMat = useMemo(() => new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
    }), [colorHex]);

    const fragments = useMemo(() => {
        const count = 16;
        const frags = [];
        for (let i = 0; i < count; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = (3.0 + Math.random() * 5.0) * Math.max(0.8, size * 0.7);
            const vx = Math.cos(theta) * Math.cos(phi) * speed;
            const vy = (Math.abs(Math.sin(theta)) + 0.4) * speed * 1.2;
            const vz = Math.cos(theta) * Math.sin(phi) * speed;

            const rx = (Math.random() - 0.5) * 18;
            const ry = (Math.random() - 0.5) * 18;
            const rz = (Math.random() - 0.5) * 18;

            const fragSize = (0.15 + Math.random() * 0.25) * size;
            const isBox = type === 'box' || (type === 'sphere' && i % 2 === 0);

            frags.push({
                vx, vy, vz,
                rx, ry, rz,
                fragSize,
                isBox,
                ref: React.createRef<THREE.Group>()
            });
        }
        return frags;
    }, [size, type]);

    const ringRef = useRef<THREE.Mesh>(null);
    const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const torusRef = useRef<THREE.Mesh>(null);
    const torusMatRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_, delta) => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsed / 1.35);
        const fade = Math.max(0, 1.0 - Math.pow(progress, 1.8));

        fragMat.opacity = fade * 0.95;

        fragments.forEach((f) => {
            if (f.ref.current) {
                f.vy -= delta * 14.0;
                const drag = Math.pow(0.91, delta * 60);
                f.vx *= drag;
                f.vz *= drag;

                f.ref.current.position.x += f.vx * delta;
                f.ref.current.position.y += f.vy * delta;
                f.ref.current.position.z += f.vz * delta;

                f.ref.current.rotation.x += f.rx * delta;
                f.ref.current.rotation.y += f.ry * delta;
                f.ref.current.rotation.z += f.rz * delta;

                const currentScale = f.fragSize * Math.max(0.1, 1.0 - progress * 0.5);
                f.ref.current.scale.set(currentScale, currentScale, currentScale);
            }
        });

        if (ringRef.current && ringMatRef.current) {
            const rScale = 1.0 + progress * 4.0;
            ringRef.current.scale.set(rScale, rScale, rScale);
            ringMatRef.current.opacity = Math.max(0, (1 - progress) * 0.85);
        }
        if (torusRef.current && torusMatRef.current) {
            const tScale = 1.0 + progress * 3.0;
            torusRef.current.scale.set(tScale, tScale, tScale);
            torusRef.current.rotation.z += delta * 4.0;
            torusMatRef.current.opacity = Math.max(0, (1 - progress) * 0.9);
        }
    });

    return (
        <group ref={groupRef}>
            <DreiSparkles count={50} scale={size * 3.5} size={7.0} speed={4.5} color={colorHex} />
            <Ring ref={ringRef} args={[size * 0.4, size * 2.2, 32]} rotation={[-Math.PI / 2, 0, 0]}>
                <meshBasicMaterial ref={ringMatRef} color="#ffffff" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
            </Ring>
            <Torus ref={torusRef} args={[size * 1.6, 0.16, 16, 32]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                <meshBasicMaterial ref={torusMatRef} color={colorHex} transparent opacity={0.9} depthWrite={false} />
            </Torus>

            {fragments.map((f, idx) => (
                <group key={idx} ref={f.ref}>
                    {f.isBox ? (
                        <Box args={[1, 1, 1]} material={fragMat} />
                    ) : (
                        <Sphere args={[0.8, 6, 6]} material={fragMat} />
                    )}
                </group>
            ))}
        </group>
    );
}

function SolidObjectItem({
    obj,
    onObjectRammed,
    onKineticSling,
    onCoreImpact,
    isPaused = false,
    subsystem3Power = 1.0,
    isShieldActive = true,
}: {
    obj: SolidPhysicsObjectData;
    onObjectRammed: () => void;
    onKineticSling: (objType: string) => void;
    onCoreImpact?: (impactPos: THREE.Vector3, isSlung: boolean) => void;
    isPaused?: boolean;
    subsystem3Power?: number;
    isShieldActive?: boolean;
}) {
    const rbRef = useRef<any>(null);
    const meshGroupRef = useRef<THREE.Group>(null);
    const healthBarRef = useRef<THREE.Group>(null);
    const healthFillMeshRef = useRef<THREE.Mesh>(null);

    const isOrbitingRef = useRef<boolean>(false);
    const orbitAngleRef = useRef<number>(0);
    const orbitRadiusRef = useRef<number>(obj.size + 4.5);
    const orbitCooldownRef = useRef<number>(0);

    const isOuterOrbitingRef = useRef<boolean>(false);
    const outerOrbitAngleRef = useRef<number>(0);
    const outerOrbitRadiusRef = useRef<number>(50.0);
    const outerOrbitSpinsRef = useRef<number>(0);
    const outerOrbitDirRef = useRef<number>(1);
    const outerOrbitCooldownRef = useRef<number>(0);
    const coreImpactCooldownRef = useRef<number>(0);
    const hasBeenSlungRef = useRef<boolean>(false);

    const maxDurability = useMemo(() => Math.round(obj.mass * 8), [obj.mass]);
    const durabilityRef = useRef<number>(maxDurability);
    const isShatteredRef = useRef<boolean>(false);
    const [isShattered, setIsShattered] = useState<boolean>(false);
    const [shatterPos, setShatterPos] = useState<[number, number, number]>([0, 0, 0]);

    const lastCollisionTimeRef = useRef<number>(0);

    const shockwaveSlotsRef = useRef([
        { active: false, progress: 0, maxScale: 1 },
        { active: false, progress: 0, maxScale: 1 },
        { active: false, progress: 0, maxScale: 1 }
    ]);
    const shockwaveGroupRefs = [
        useRef<THREE.Group>(null),
        useRef<THREE.Group>(null),
        useRef<THREE.Group>(null)
    ];
    const shockwaveMatRefs = [
        useRef<THREE.MeshBasicMaterial>(null),
        useRef<THREE.MeshBasicMaterial>(null),
        useRef<THREE.MeshBasicMaterial>(null)
    ];

    const triggerShockwave = useCallback((intensity = 1.0) => {
        const slot = shockwaveSlotsRef.current.find(s => !s.active) || shockwaveSlotsRef.current[0];
        slot.active = true;
        slot.progress = 0;
        slot.maxScale = obj.size * 3.5 + intensity * 1.5;
    }, [obj.size]);

    const takeDamage = useCallback((amount: number) => {
        durabilityRef.current = Math.max(0, durabilityRef.current - amount);
        if (durabilityRef.current <= 0 && !isShatteredRef.current) {
            isShatteredRef.current = true;
            let sx = obj.position[0];
            let sy = obj.position[1];
            let sz = obj.position[2];
            if (rbRef.current) {
                try {
                    const t = rbRef.current.translation();
                    sx = t.x; sy = t.y; sz = t.z;
                    rbRef.current.setTranslation({ x: sx, y: -500, z: sz }, true);
                    rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
                } catch (e) {}
            }
            setShatterPos([sx, sy, sz]);
            setIsShattered(true);
            soundEngine.playHazardHitSound();
            soundEngine.playSolidImpactSound(8.0, obj.hue, obj.size, obj.mass, obj.type);
            triggerHapticFeedback([80, 40, 120, 40, 150]);
            onObjectRammed();

            setTimeout(() => {
                durabilityRef.current = maxDurability;
                isShatteredRef.current = false;
                setIsShattered(false);
                if (rbRef.current) {
                    try {
                        rbRef.current.setTranslation({
                            x: obj.position[0] + (Math.random() - 0.5) * 6,
                            y: 18 + Math.random() * 4,
                            z: obj.position[2] + (Math.random() - 0.5) * 6
                        }, true);
                        rbRef.current.setLinvel({ x: (Math.random() - 0.5) * 4, y: -2, z: (Math.random() - 0.5) * 4 }, true);
                    } catch (e) {}
                }
            }, 1400);
        }
    }, [obj, maxDurability, onObjectRammed]);

    useFrame((state, delta) => {
        if (!rbRef.current || !meshGroupRef.current || isPaused || isShattered) return;

        if (healthBarRef.current) {
            healthBarRef.current.quaternion.copy(state.camera.quaternion);
        }
        if (healthFillMeshRef.current) {
            healthFillMeshRef.current.scale.x = Math.max(0.001, durabilityRef.current / maxDurability);
        }

        shockwaveSlotsRef.current.forEach((s, idx) => {
            if (s.active) {
                s.progress += delta * 2.8;
                if (s.progress >= 1.0) s.active = false;
                const grp = shockwaveGroupRefs[idx].current;
                const mat = shockwaveMatRefs[idx].current;
                if (grp) {
                    grp.visible = s.active;
                    if (s.active) {
                        const sc = s.progress * s.maxScale;
                        grp.scale.set(sc, sc, sc);
                    }
                }
                if (mat) {
                    mat.opacity = Math.max(0, (1 - s.progress) * 0.85);
                }
            } else if (shockwaveGroupRefs[idx].current) {
                shockwaveGroupRefs[idx].current!.visible = false;
            }
        });

        if (orbitCooldownRef.current > 0) orbitCooldownRef.current -= delta;
        if (outerOrbitCooldownRef.current > 0) outerOrbitCooldownRef.current -= delta;
        if (coreImpactCooldownRef.current > 0) coreImpactCooldownRef.current -= delta;

        const translation = rbRef.current.translation();
        _physObjPos.set(translation.x, translation.y, translation.z);

        const px = gameRefs.locusPos.x;
        const pz = gameRefs.locusPos.z;
        const isPulling = gameRefs.isPulling;

        const distToPlayer = Math.sqrt((translation.x - px) * (translation.x - px) + (translation.z - pz) * (translation.z - pz));

        if (!isOrbitingRef.current && !isOuterOrbitingRef.current && orbitCooldownRef.current <= 0) {
            if (distToPlayer < 6.8 || (isPulling && distToPlayer < 10.0)) {
                isOrbitingRef.current = true;
                orbitAngleRef.current = Math.atan2(translation.z - pz, translation.x - px);
                soundEngine.playSpinningObjectWobble(obj.hue, obj.size);
            }
        }

        if (isOrbitingRef.current) {
            const spinSpeed = 13.0 + (isPulling ? 7.0 : 0.0);
            orbitAngleRef.current += delta * spinSpeed;
            const targetX = px + Math.cos(orbitAngleRef.current) * orbitRadiusRef.current;
            const targetZ = pz + Math.sin(orbitAngleRef.current) * orbitRadiusRef.current;
            const targetY = 5.8 + Math.sin(state.clock.getElapsedTime() * 12) * 0.4;

            rbRef.current.setTranslation({ x: targetX, y: targetY, z: targetZ }, true);

            if (isPulling) {
                isOrbitingRef.current = false;
                hasBeenSlungRef.current = true;
                orbitCooldownRef.current = 2.0;
                const tangAngle = orbitAngleRef.current + Math.PI / 2;
                rbRef.current.setLinvel({ x: Math.cos(tangAngle) * 45, y: 3, z: Math.sin(tangAngle) * 45 }, true);
                soundEngine.playKineticSlingshotSound();
                triggerHapticFeedback([40, 30, 80]);
                onKineticSling(obj.type);
            }
        }
    });

    const triggerUserWobbleImpulse = () => {
        if (isPaused || isShattered || !rbRef.current) return;
        rbRef.current.applyImpulse({ x: (Math.random() - 0.5) * 8, y: 12, z: (Math.random() - 0.5) * 8 }, true);
        soundEngine.playWobbleResonance(0.9, 14, obj.hue, obj.size, obj.type);
        triggerHapticFeedback([25, 20, 25]);
        triggerShockwave(1.8);
        takeDamage(12);
        onObjectRammed();
    };

    const barWidth = Math.max(1.6, obj.size * 0.95);
    const barHeight = 0.16;

    return (
        <group>
            {isShattered && <ShatterDebris size={obj.size} colorHex={obj.colorHex} type={obj.type} hue={obj.hue} />}
            <RigidBody 
                ref={rbRef}
                position={obj.position}
                colliders={false}
                restitution={0.85}
                friction={0.25}
                onCollisionEnter={(evt: any) => {
                    if (isPaused || isShattered) return;
                    const now = performance.now();
                    if (now - lastCollisionTimeRef.current < 60) return;
                    lastCollisionTimeRef.current = now;

                    const impulse = typeof evt?.totalImpulse === 'number' ? Math.abs(evt.totalImpulse) : 3.5;
                    const normVel = Math.min(10.0, Math.max(1.5, impulse));
                    const vibMs = Math.min(60, Math.max(15, Math.round(normVel * 6)));

                    triggerHapticFeedback(vibMs);
                    soundEngine.playSolidImpactSound(Math.max(2.5, normVel), obj.hue, obj.size, obj.mass, obj.type);
                    soundEngine.playWobbleResonance(0.7, 12, obj.hue, obj.size, obj.type);
                    triggerShockwave(Math.min(2.5, normVel));
                    takeDamage(Math.max(8, Math.round(normVel * 8)));
                    onObjectRammed();
                }}
            >
                {obj.type === 'sphere' && <BallCollider args={[obj.size]} />}
                {obj.type === 'box' && <CuboidCollider args={[obj.size / 2, obj.size / 2, obj.size / 2]} />}
                {obj.type === 'torus' && <BallCollider args={[obj.size]} />}

                <group ref={meshGroupRef} onClick={triggerUserWobbleImpulse} visible={!isShattered}>
                    <group position={[0, obj.size * 1.15 + 0.65, 0]} ref={healthBarRef}>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[barWidth + 0.1, barHeight + 0.08]} />
                            <meshBasicMaterial color="#020617" transparent opacity={0.85} />
                        </mesh>
                        <mesh position={[0, 0, 0.001]}>
                            <planeGeometry args={[barWidth + 0.04, barHeight + 0.03]} />
                            <meshBasicMaterial color={obj.colorHex} transparent opacity={0.35} />
                        </mesh>
                        <mesh ref={healthFillMeshRef} position={[-barWidth / 2, 0, 0.002]}>
                            <planeGeometry args={[barWidth, barHeight]} />
                            <meshBasicMaterial color={obj.colorHex} transparent opacity={0.95} />
                        </mesh>
                    </group>

                    {shockwaveSlotsRef.current.map((_, idx) => (
                        <group key={idx} ref={shockwaveGroupRefs[idx]} visible={false}>
                            <Ring args={[0.5, 0.8, 24]} rotation={[-Math.PI / 2, 0, 0]}>
                                <meshBasicMaterial ref={shockwaveMatRefs[idx]} color={obj.colorHex} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
                            </Ring>
                        </group>
                    ))}

                    {obj.type === 'sphere' && (
                        <Sphere args={[obj.size, 16, 16]}>
                            <meshStandardMaterial color={obj.colorHex} metalness={0.8} roughness={0.2} />
                        </Sphere>
                    )}
                    {obj.type === 'box' && (
                        <Box args={[obj.size, obj.size, obj.size]}>
                            <meshStandardMaterial color={obj.colorHex} metalness={0.7} roughness={0.3} />
                        </Box>
                    )}
                    {obj.type === 'torus' && (
                        <Torus args={[obj.size, obj.size * 0.3, 12, 24]}>
                            <meshStandardMaterial color={obj.colorHex} metalness={0.85} roughness={0.15} />
                        </Torus>
                    )}
                </group>
            </RigidBody>
        </group>
    );
}

function SolidPhysicsObjects({ 
    objects, 
        onObjectRammed,
    onKineticSling,
    onCoreImpact,
    isPaused = false,
    subsystem3Power = 1.0,
    isShieldActive = true,
}: { 
    objects: SolidPhysicsObjectData[]; 

    onObjectRammed: () => void;
    onKineticSling: (objType: string) => void;
    onCoreImpact?: (impactPos: THREE.Vector3, isSlung: boolean) => void;
    isPaused?: boolean;
    subsystem3Power?: number;
    isShieldActive?: boolean;
}) {
    return (
        <>
            {objects.map((obj) => (
                <SolidObjectItem 
                    key={obj.id} 
                    obj={obj} 
                                        onObjectRammed={onObjectRammed}
                    onKineticSling={onKineticSling} 
                    onCoreImpact={onCoreImpact}
                    isPaused={isPaused}
                    subsystem3Power={subsystem3Power}
                    isShieldActive={isShieldActive}
                />
            ))}
        </>
    );
}

// Responsive Camera Rig Component: Auto-scales camera elevation, distance & FOV on vertical/phone screens + violent camera shake
function ResponsiveCameraRig({ cameraShake = 0 }: { cameraShake?: number }) {
    const { camera, size } = useThree();
    const shakeRef = useRef(0);

    useEffect(() => {
        if (cameraShake > 0) {
            shakeRef.current = Math.max(shakeRef.current, cameraShake);
        }
    }, [cameraShake]);

    useFrame((_, delta) => {
        const aspect = size.width / size.height;
        const baseAspect = 1.35;
        const scaleFactor = Math.max(1.0, baseAspect / Math.max(0.35, aspect));

        let targetY = 45 * scaleFactor;
        let targetZ = 75 * scaleFactor;
        let targetX = 0;

        if (shakeRef.current > 0.01) {
            targetX += (Math.random() - 0.5) * shakeRef.current * 7.5;
            targetY += (Math.random() - 0.5) * shakeRef.current * 5.5;
            targetZ += (Math.random() - 0.5) * shakeRef.current * 7.5;
            shakeRef.current = THREE.MathUtils.damp(shakeRef.current, 0, 7.5, delta);
        }

        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.2);

        if (camera instanceof THREE.PerspectiveCamera) {
            const targetFov = aspect < 1.0 ? Math.min(62, 45 + (1.0 - aspect) * 14) : 45;
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.12);
            camera.updateProjectionMatrix();
        }
        camera.lookAt(0, 0, 0);
    });

    return null;
}

// 3D Violent Shield Collision Spark Shockwave Explosion
function ShieldImpactSparks({ impactEvent }: { impactEvent: { pos: THREE.Vector3; id: number } | null }) {
    const groupRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const sparkLinesRef = useRef<THREE.LineSegments>(null);
    const [activeEvent, setActiveEvent] = useState<{ pos: THREE.Vector3; time: number } | null>(null);

    useEffect(() => {
        if (impactEvent) {
            setActiveEvent({ pos: impactEvent.pos.clone(), time: Date.now() });
        }
    }, [impactEvent]);

    useFrame(() => {
        if (!activeEvent || !groupRef.current) return;
        const elapsed = (Date.now() - activeEvent.time) / 1000;
        if (elapsed > 0.45) {
            groupRef.current.visible = false;
            return;
        }

        groupRef.current.visible = true;
        groupRef.current.position.copy(activeEvent.pos);

        const progress = elapsed / 0.45;
        const scale = 1.0 + progress * 24.0;

        if (ringRef.current) {
            ringRef.current.scale.set(scale, scale, scale);
            const mat = ringRef.current.material as THREE.MeshStandardMaterial;
            if (mat) {
                mat.opacity = (1.0 - progress) * 0.95;
                mat.emissiveIntensity = (1.0 - progress) * 14.0;
            }
        }

        if (sparkLinesRef.current) {
            sparkLinesRef.current.scale.set(scale * 1.3, scale * 1.3, scale * 1.3);
            const mat = sparkLinesRef.current.material as THREE.LineBasicMaterial;
            if (mat) {
                mat.opacity = (1.0 - progress) * 0.95;
            }
        }
    });

    const sparkGeometry = useMemo(() => {
        const positions: number[] = [];
        const count = 32;
        for (let i = 0; i < count; i++) {
            const angle = (i * Math.PI * 2) / count;
            const r1 = 0.2;
            const r2 = 1.8 + (i % 2 === 0 ? 1.2 : 0.4);
            positions.push(Math.cos(angle) * r1, (Math.random() - 0.5) * 1.2, Math.sin(angle) * r1);
            positions.push(Math.cos(angle) * r2, (Math.random() - 0.5) * 2.5, Math.sin(angle) * r2);
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return geom;
    }, []);

    return (
        <group ref={groupRef} visible={false}>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.6, 32]} />
                <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={8.0} transparent opacity={0.95} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <lineSegments ref={sparkLinesRef} geometry={sparkGeometry}>
                <lineBasicMaterial color="#38bdf8" linewidth={3} transparent opacity={0.95} depthWrite={false} />
            </lineSegments>
        </group>
    );
}

// Interactive Singularity Locus / Cybernetic Protagonist Controlled Sphere
function InteractiveLocus({ 
    onPointerMove,
    moveSpeedMultiplier = 1.0,
    onProtagonistCollision,
    onOuterOrbitDamage,
    onShieldViolentImpact,
    isPaused = false,
    subsystem3Power = 1.0,
    isShieldActive = true,
    joystickVectorRef,
    gestureRef,
    gestureControlMode,
}: {
    onPointerMove?: (pos: THREE.Vector3 | null, isPulling: boolean, isMoving: boolean, moveVel: number) => void;
    moveSpeedMultiplier?: number;
    onProtagonistCollision: () => void;
    onOuterOrbitDamage?: (damageAmount: number) => void;
    onShieldViolentImpact?: (impactPos: THREE.Vector3) => void;
    isPaused?: boolean;
    subsystem3Power?: number;
    isShieldActive?: boolean;
    joystickVectorRef: React.MutableRefObject<{ gx: number; gz: number; active: boolean }>;
    gestureRef: React.MutableRefObject<any>;
    gestureControlMode: 'swipe' | 'joystick' | 'off';
}) {
    const { raycaster, camera, pointer } = useThree();
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -5), []);
    const locusPos = useRef(new THREE.Vector3(0, 5, 0));
    const prevPos = useRef(new THREE.Vector3(0, 5, 0));
    const [active, setActive] = useState(true);
    const [isPulling, setIsPulling] = useState(false);
    const sphereRef = useRef<THREE.Mesh>(null);
    const satelliteRef = useRef<THREE.Mesh>(null);
    const wobbleRingRef = useRef<THREE.Group>(null);
    const rbRef = useRef<any>(null);
    const lastBumpTime = useRef<number>(0);
    const bumpFlashTimerRef = useRef(0);
    const sphereMatRef = useRef<THREE.MeshStandardMaterial>(null);
    const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);

    const isOuterOrbitingRef = useRef<boolean>(false);
    const [isOuterOrbitingState, setIsOuterOrbitingState] = useState<boolean>(false);
    const outerAngleRef = useRef<number>(0);
    const outerSpinsRef = useRef<number>(0);
    const outerCooldownRef = useRef<number>(0);

    const keys = useRef<{ [key: string]: boolean }>({});

    const lastShieldTouchTimeRef = useRef<number>(0);
    const playerVelRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused) return;
            keys.current[e.code] = true;
            if (e.code === 'Space') setIsPulling(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.code] = false;
            if (e.code === 'Space') setIsPulling(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        if (isPaused) return;

        if (outerCooldownRef.current > 0) {
            outerCooldownRef.current -= delta;
        }

        raycaster.setFromCamera(pointer, camera);
        let isPointerInScene = false;

        if (raycaster.ray.intersectPlane(plane, _locusIntersectTarget)) {
            _locusIntersectTarget.x = Math.max(-48, Math.min(48, _locusIntersectTarget.x));
            _locusIntersectTarget.z = Math.max(-48, Math.min(48, _locusIntersectTarget.z));
            _locusIntersectTarget.y = 5;
            isPointerInScene = true;
        }

        // Joystick Override (REFINED DIRECT DRIVE - Fast but controlled)
        let targetVelX = ((keys.current['KeyD'] || keys.current['ArrowRight'] ? 1 : 0) - (keys.current['KeyA'] || keys.current['ArrowLeft'] ? 1 : 0)) * 58 * moveSpeedMultiplier;
        let targetVelZ = ((keys.current['KeyS'] || keys.current['ArrowDown'] ? 1 : 0) - (keys.current['KeyW'] || keys.current['ArrowUp'] ? 1 : 0)) * 58 * moveSpeedMultiplier;

        if (gestureControlMode === 'joystick' && joystickVectorRef.current.active) {
            targetVelX = (joystickVectorRef.current.gx / 12) * 58 * moveSpeedMultiplier;
            targetVelZ = (joystickVectorRef.current.gz / 12) * 58 * moveSpeedMultiplier;
            playerVelRef.current.x = THREE.MathUtils.lerp(playerVelRef.current.x, targetVelX, delta * 12.5);
            playerVelRef.current.y = THREE.MathUtils.lerp(playerVelRef.current.y, targetVelZ, delta * 12.5);
        }
        // Swipe Override
        else if (gestureControlMode === 'swipe' && gestureRef.current.active) {
            targetVelX = (gestureRef.current.gx / 14) * 58 * moveSpeedMultiplier;
            targetVelZ = (gestureRef.current.gz / 14) * 58 * moveSpeedMultiplier;
            playerVelRef.current.x = THREE.MathUtils.lerp(playerVelRef.current.x, targetVelX, delta * 12.5);
            playerVelRef.current.y = THREE.MathUtils.lerp(playerVelRef.current.y, targetVelZ, delta * 12.5);
        } else {
            // Keyboard/Idle Damping
            playerVelRef.current.x = THREE.MathUtils.lerp(playerVelRef.current.x, targetVelX, delta * 10);
            playerVelRef.current.y = THREE.MathUtils.lerp(playerVelRef.current.y, targetVelZ, delta * 10);
        }

        locusPos.current.x += playerVelRef.current.x * delta;
        locusPos.current.z += playerVelRef.current.y * delta;

        // ARENA BOUNDARIES: Hard clamp to grid edges
        locusPos.current.x = Math.max(-48, Math.min(48, locusPos.current.x));
        locusPos.current.z = Math.max(-48, Math.min(48, locusPos.current.z));
        locusPos.current.y = 5.0; // Strictly ground to floor height

        if (isPointerInScene && !keys.current['KeyW'] && !keys.current['KeyS'] && !keys.current['KeyA'] && !keys.current['KeyD'] && !joystickVectorRef.current.active) {
            // Lerp factor 0.04 (snappier pointer tracking)
            locusPos.current.lerp(_locusIntersectTarget, 0.04);
        }

        // STRICT BOUNDARY CLAMP: Player CANNOT move within central singularity or shield bubble
        const minAllowedRadius = isShieldActive ? 10.8 : 7.2; // Shield bubble radius is ~9.5; singularity core is ~6.0
        const curDistFromOrigin = Math.sqrt(locusPos.current.x * locusPos.current.x + locusPos.current.z * locusPos.current.z);

        // TOUCHING ACTIVE SHIELD INFLECTS SEVERE DAMAGE & BOUNCES PLAYER OFF
        if (isShieldActive && curDistFromOrigin <= minAllowedRadius + 0.5) {
            const angle = curDistFromOrigin > 0.001 ? Math.atan2(locusPos.current.z, locusPos.current.x) : 0;
            const normalX = Math.cos(angle);
            const normalZ = Math.sin(angle);

            // Apply powerful physical bounce recoil velocity away from the shield barrier
            playerVelRef.current.x = normalX * 95.0;
            playerVelRef.current.y = normalZ * 95.0;

            // Knock player position back aggressively off the shield perimeter
            locusPos.current.x = normalX * (minAllowedRadius + 3.2);
            locusPos.current.z = normalZ * (minAllowedRadius + 3.2);

            const now = Date.now();
            if (now - lastShieldTouchTimeRef.current > 240) {
                lastShieldTouchTimeRef.current = now;
                if (onOuterOrbitDamage) {
                    onOuterOrbitDamage(120.0); // Heavy 120 HP/Shield damage
                }
                const impactPos = new THREE.Vector3(locusPos.current.x, 5, locusPos.current.z);
                if (onShieldViolentImpact) {
                    onShieldViolentImpact(impactPos);
                } else {
                    soundEngine.playShieldViolentImpactSound();
                    triggerHapticFeedback([100, 50, 150, 50, 200]);
                }
            }
        } else if (curDistFromOrigin < minAllowedRadius) {
            const angle = curDistFromOrigin > 0.001 ? Math.atan2(locusPos.current.z, locusPos.current.x) : 0;
            locusPos.current.x = Math.cos(angle) * minAllowedRadius;
            locusPos.current.z = Math.sin(angle) * minAllowedRadius;
        }

        const distFromOrigin = Math.sqrt(locusPos.current.x * locusPos.current.x + locusPos.current.z * locusPos.current.z);

        // Check if Protagonist gets caught in Outer Ring Gravitational Orbit
        // If outer ring is spinning (subsystem3Power >= 0.1) and player gets near outer perimeter (~30-58)
        const outerRingIsSpinningFast = subsystem3Power >= 0.1;
        const isNearOuterRing = distFromOrigin >= 30.0 && distFromOrigin <= 58.0;

        if (!isOuterOrbitingRef.current && outerCooldownRef.current <= 0 && isNearOuterRing && outerRingIsSpinningFast) {
            // Player gets pulled into orbit automatically if ring is spinning fast (subsystem3Power >= 0.20) or if pressing pull
            if (isPulling || keys.current['Space'] || subsystem3Power >= 0.20) {
                isOuterOrbitingRef.current = true;
                setIsOuterOrbitingState(true);
                outerAngleRef.current = Math.atan2(locusPos.current.z, locusPos.current.x);
                outerSpinsRef.current = 0;
                soundEngine.playKineticSlingshotSound();
                soundEngine.playWobbleResonance(1.8, 30, 45, 2.0, 'sphere');
                triggerHapticFeedback([60, 50, 90]);
            }
        }

        // Active Protagonist Outer Machine Ring Gravitational Orbit
        if (isOuterOrbitingRef.current) {
            const spinSpeed = 2.8 * (subsystem3Power > 0 ? Math.max(0.6, subsystem3Power) : 1.0);
            const angleStep = delta * spinSpeed;
            outerAngleRef.current += angleStep;
            outerSpinsRef.current += angleStep;

            const outerRadius = 52.0; // Aligned with the outermost giant rotating ring
            locusPos.current.x = Math.cos(outerAngleRef.current) * outerRadius;
            locusPos.current.z = Math.sin(outerAngleRef.current) * outerRadius;
            locusPos.current.y = 5.0 + Math.sin(state.clock.getElapsedTime() * 8.0) * 0.8;

            // CONTINUOUS DAMAGE TO PLAYER WHILE TRAPPED IN OUTER RING ORBIT
            if (onOuterOrbitDamage) {
                const damageRate = delta * (22.0 + subsystem3Power * 18.0);
                onOuterOrbitDamage(damageRate);
            }

            // After 2 full rotations around outer machine ring (~12.56 radians)
            if (outerSpinsRef.current >= Math.PI * 2 * 2.0) {
                isOuterOrbitingRef.current = false;
                setIsOuterOrbitingState(false);
                outerCooldownRef.current = 4.5;

                // Fling protagonist back inward toward center with high velocity boost
                const tangentX = -Math.sin(outerAngleRef.current) * 0.75 - Math.cos(outerAngleRef.current) * 0.65;
                const tangentZ = Math.cos(outerAngleRef.current) * 0.75 - Math.sin(outerAngleRef.current) * 0.65;
                locusPos.current.x += tangentX * 24.0;
                locusPos.current.z += tangentZ * 24.0;

                soundEngine.playTachyonPulseSound();
                triggerHapticFeedback([80, 60, 120]);
            }
        } else {
            locusPos.current.x = Math.max(-48, Math.min(48, locusPos.current.x));
            locusPos.current.z = Math.max(-48, Math.min(48, locusPos.current.z));
        }

        const moveVel = new THREE.Vector3().subVectors(locusPos.current, prevPos.current).length();
        prevPos.current.copy(locusPos.current);

        setActive(true);
        // Continuous update stream (Heartbeat) prevents WebView sleep/throttling
        onPointerMove(locusPos.current, isPulling, moveVel > 0.08, moveVel);

        if (rbRef.current) {
            rbRef.current.setNextKinematicTranslation({
                x: locusPos.current.x,
                y: locusPos.current.y,
                z: locusPos.current.z,
            });
        }

        const clockTime = state.clock.getElapsedTime();

        if (sphereRef.current) {
            const pulse = 1 + Math.sin(clockTime * 8) * 0.18 + moveVel * 0.2;
            sphereRef.current.scale.setScalar(pulse * (isPulling ? 1.8 : 1.2));
            sphereRef.current.rotation.y = clockTime * 1.5;
        }

        // Wobble Orbiting Satellite Sphere that sticks to Protagonist
        if (satelliteRef.current) {
            const orbitSpeed = clockTime * 3.8;
            const orbitRadius = 2.5 + Math.sin(orbitSpeed * 2.0) * 0.35;
            satelliteRef.current.position.x = Math.cos(orbitSpeed) * orbitRadius;
            satelliteRef.current.position.z = Math.sin(orbitSpeed) * orbitRadius;
            satelliteRef.current.position.y = Math.sin(orbitSpeed * 3.2) * 0.95; // Dynamic 3D wobble elevation
            
            const satPulse = 1.0 + Math.sin(clockTime * 12.0) * 0.2;
            satelliteRef.current.scale.setScalar(satPulse * (isPulling ? 1.5 : 1.0));
        }

        // Gyroscopic Wobble Aura Ring
        if (wobbleRingRef.current) {
            wobbleRingRef.current.rotation.x = Math.sin(clockTime * 2.2) * 0.45;
            wobbleRingRef.current.rotation.z = Math.cos(clockTime * 2.8) * 0.45;
            wobbleRingRef.current.rotation.y = clockTime * 1.8;
        }

        if (bumpFlashTimerRef.current > 0) {
            bumpFlashTimerRef.current -= delta;
        }
        const isFlashing = bumpFlashTimerRef.current > 0;
        if (sphereMatRef.current) {
            sphereMatRef.current.color.set(isFlashing ? "#ffffff" : (isPulling ? "#facc15" : "#38bdf8"));
            sphereMatRef.current.emissive.set(isFlashing ? "#38bdf8" : (isPulling ? "#eab308" : "#0284c7"));
            sphereMatRef.current.emissiveIntensity = isFlashing ? 4.0 : (isPulling ? 2.5 : 1.0);
        }
    });

    const handleProtagonistCollision = () => {
        if (isPaused) return;
        const now = performance.now();
        if (now - lastBumpTime.current < 120) return;
        lastBumpTime.current = now;

        const force = 4.0 + Math.random() * 3.5;
        const vibMs = Math.min(80, Math.max(25, Math.round(force * 10)));
        triggerHapticFeedback([vibMs, 20, Math.round(vibMs * 0.7)]);
        soundEngine.playSolidImpactSound(force, 210, 1.3, 1.8, 'sphere');
        soundEngine.playWobbleResonance(0.9, 14, 210, 1.3, 'sphere');
        onProtagonistCollision();
        bumpFlashTimerRef.current = 0.15;
    };

    return (
        <RigidBody 
            ref={rbRef}
            type="kinematicPosition"
            colliders={false}
            position={[0, 5, 0]}
            restitution={0.95}
            friction={0.1}
            onCollisionEnter={handleProtagonistCollision}
        >
            <BallCollider args={[1.8]} />
            <mesh ref={sphereRef} visible={active}>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshStandardMaterial ref={sphereMatRef}
                    transparent 
                    opacity={0.9}
                />
            </mesh>
            {active && (
                <>
                    {/* Outer Ring Gravity Capture Visual Halos */}
                    {isOuterOrbitingState && (
                        <group>
                            <Torus args={[3.8, 0.22, 12, 24]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} />
                            </Torus>
                            <Torus args={[4.8, 0.12, 12, 24]} rotation={[0, Math.PI / 2, 0]}>
                                <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
                            </Torus>
                        </group>
                    )}

                    {/* Wobble Gyroscopic Aura Torus Ring */}
                    <group ref={wobbleRingRef} position={[0, 0, 0]}>
                        <Torus args={[2.2, 0.1, 12, 32]}>
                            <meshStandardMaterial 
                                color={bumpFlashTimerRef.current > 0 ? "#ffffff" : (isPulling ? "#fbbf24" : "#38bdf8")}
                                emissive={bumpFlashTimerRef.current > 0 ? "#38bdf8" : (isPulling ? "#f59e0b" : "#0284c7")}
                                emissiveIntensity={bumpFlashTimerRef.current > 0 ? 2.5 : 0.6}
                                roughness={0.15}
                                metalness={0.85}
                            />
                        </Torus>
                    </group>

                    {/* Orbiting Wobble Satellite Sphere that sticks to Protagonist */}
                    <mesh ref={satelliteRef}>
                        <sphereGeometry args={[0.45, 12, 12]} />
                        <meshStandardMaterial 
                            color={bumpFlashTimerRef.current > 0 ? "#ffffff" : (isPulling ? "#f59e0b" : "#ec4899")}
                            emissive={bumpFlashTimerRef.current > 0 ? "#ffffff" : (isPulling ? "#fbbf24" : "#d946ef")}
                            emissiveIntensity={bumpFlashTimerRef.current > 0 ? 3.0 : 0.8}
                            roughness={0.1}
                        />
                    </mesh>

                    {/* Ground Plane Light Projection Disc */}
                    <group position={[0, -0.8, 0]}>
                        <Ring args={[2.0, 2.5, 20]} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshBasicMaterial 
                                color={bumpFlashTimerRef.current > 0 ? "#ffffff" : (isPulling ? "#fbbf24" : "#38bdf8")}
                                transparent 
                                opacity={bumpFlashTimerRef.current > 0 ? 0.95 : 0.5}
                                side={THREE.DoubleSide} 
                                depthWrite={false}
                            />
                        </Ring>
                    </group>
                </>
            )}
        </RigidBody>
    );
}

const _pDir = new THREE.Vector3();
const _pTangent = new THREE.Vector3();
const _pScaleVec = new THREE.Vector3();
const _physObjPos = new THREE.Vector3();
const _locusIntersectTarget = new THREE.Vector3();

// Fusion Particle Swarm Scene
function FusionSwarmScene({ 
    gravityTilt, 
        onNodeAbsorbed,
    isPaused = false,
}: { 
    gravityTilt: [number, number, number]; 

    onNodeAbsorbed: () => void;
    isPaused?: boolean;
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);

    const particles = useMemo(() => {
        const p: FusionParticle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const rad = 15 + Math.random() * 35;
            const angle = Math.random() * Math.PI * 2;
            p.push({
                id: i,
                position: new THREE.Vector3(
                    Math.cos(angle) * rad,
                    Math.random() * 15 + 5,
                    Math.sin(angle) * rad
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    0,
                    (Math.random() - 0.5) * 0.2
                ),
                scale: PRIMORDIAL_RADIUS,
                mass: Math.pow(PRIMORDIAL_RADIUS, 3),
                fusionLevel: 0,
                color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
                active: true,
            });
        }
        return p;
    }, []);

    const frameCountRef = useRef(0);

    useFrame((state, delta) => {
        if (!meshRef.current || isPaused) return;

        frameCountRef.current++;
        const shouldUpdatePhysics = frameCountRef.current % 2 === 0;
        if (!shouldUpdatePhysics) return;

        // Double the delta because we're skipping every other frame to maintain same speed
        const effectiveDelta = delta * 2;

        const time = state.clock.getElapsedTime();
        let activeCount = 0;
        let maxFusionStage = 0;
        let totalMass = 0;

        soundEngine.updatePullDrone(gameRefs.isPulling, gameRefs.isPulling ? 1.0 : 0.0);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p1 = particles[i];
            if (!p1.active) {
                tempMatrix.makeScale(0, 0, 0);
                meshRef.current.setMatrixAt(i, tempMatrix);
                continue;
            }

            activeCount++;
            maxFusionStage = Math.max(maxFusionStage, p1.fusionLevel);
            totalMass += p1.mass;

            // Accelerate 10x slower when gravity tilt or pulling begins
            p1.velocity.x += gravityTilt[0] * effectiveDelta * 0.03;
            p1.velocity.z += gravityTilt[2] * effectiveDelta * 0.03;

            if (new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)) {
                const distToLocus = p1.position.distanceTo(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z));
                if (distToLocus < 45) {
                    const pullStrength = gameRefs.isPulling ? 1.4 : 0.45;
                    const pullForce = (45 - distToLocus) * pullStrength * effectiveDelta * (1 / Math.max(1, p1.mass * 0.5));
                    
                    _pDir.subVectors(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z), p1.position).normalize();
                    p1.velocity.addScaledVector(_pDir, pullForce);

                    _pTangent.set(-_pDir.z, 0, _pDir.x);
                    p1.velocity.addScaledVector(_pTangent, pullForce * (gameRefs.isPulling ? 0.8 : 0.3));

                    if (distToLocus < 2.5) {
                        onNodeAbsorbed();
                        soundEngine.playFusionTone(p1.fusionLevel, p1.mass);
                        // Respawn / scatter particle far out into outer space so it must be hunted down again
                        const respawnRad = 25 + Math.random() * 25;
                        const respawnAngle = Math.random() * Math.PI * 2;
                        p1.position.set(Math.cos(respawnAngle) * respawnRad, Math.random() * 15 + 5, Math.sin(respawnAngle) * respawnRad);
                        p1.velocity.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
                    }
                }
            }

            p1.velocity.multiplyScalar(0.96);
            p1.position.addScaledVector(p1.velocity, effectiveDelta * 14);

            if (Math.abs(p1.position.x) > 50) { p1.position.x = Math.sign(p1.position.x) * 50; p1.velocity.x *= -0.8; }
            if (Math.abs(p1.position.z) > 50) { p1.position.z = Math.sign(p1.position.z) * 50; p1.velocity.z *= -0.8; }
            if (p1.position.y < 2) { p1.position.y = 2; p1.velocity.y *= -0.5; }
            if (p1.position.y > 30) { p1.position.y = 30; p1.velocity.y *= -0.5; }

            tempMatrix.makeTranslation(p1.position.x, p1.position.y, p1.position.z);
            const currentScale = p1.scale * (1 + Math.sin(time * 3 + p1.id) * 0.08);
            tempMatrix.scale(_pScaleVec.set(currentScale, currentScale, currentScale));
            meshRef.current.setMatrixAt(i, tempMatrix);

            const hue = ((time * 0.1 + p1.position.length() * 0.02 + p1.fusionLevel * 0.1) % 1.0);
            tempColor.setHSL(hue, 0.95, 0.55 + p1.fusionLevel * 0.08).multiplyScalar(1 + p1.fusionLevel * 0.4);
            meshRef.current.setColorAt(i, tempColor);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }

        if (activeCount < 40) {
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                if (!particles[i].active) {
                    particles[i].active = true;
                    particles[i].scale = PRIMORDIAL_RADIUS;
                    particles[i].mass = Math.pow(PRIMORDIAL_RADIUS, 3);
                    particles[i].fusionLevel = 0;
                    particles[i].position.set(
                        (Math.random() - 0.5) * 80,
                        Math.random() * 20 + 5,
                        (Math.random() - 0.5) * 80
                    );
                    particles[i].velocity.set(0, 0, 0);
                    break;
                }
            }
        }

        window.dispatchEvent(new CustomEvent('fusion-update', { 
            detail: { activeCount, maxFusionStage, totalMass: Math.round(totalMass) } 
        }));
    });

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight 
                position={[20, 50, 20]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024} 
                shadow-camera-far={120} 
                shadow-camera-left={-60} 
                shadow-camera-right={60} 
                shadow-camera-top={60} 
                shadow-camera-bottom={-60} 
                shadow-bias={-0.0005} 
            />
            <pointLight position={[0, 20, 0]} intensity={2.5} color="#38bdf8" distance={90} />

            <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} receiveShadow>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial metalness={0.6} roughness={0.2} />
            </instancedMesh>

            <RigidBody type="fixed" position={[0, -1, 0]} colliders={false}>
                <CuboidCollider args={[55, 1, 55]} />
                {/* Translucent Frosted Cyber Surface Field */}
                <Box args={[110, 2, 110]} receiveShadow>
                    <meshStandardMaterial 
                        color="#020617" 
                        transparent={true} 
                        opacity={0.35} 
                        roughness={0.12} 
                        metalness={0.92} 
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </Box>
            </RigidBody>

            {/* Surface Cyber Grid Matrix defining the floor boundary */}
            <gridHelper args={[110, 44, '#06b6d4', '#1e293b']} position={[0, 0.01, 0]}>
                <lineBasicMaterial attach="material" color="#06b6d4" transparent opacity={0.35} />
            </gridHelper>

            {/* Sub-Surface Void Grid & Illuminator for submerged objects */}
            <gridHelper args={[160, 32, '#3b82f6', '#0f172a']} position={[0, -12, 0]}>
                <lineBasicMaterial attach="material" color="#3b82f6" transparent opacity={0.25} />
            </gridHelper>
            <pointLight position={[0, -6, 0]} intensity={2.8} color="#38bdf8" distance={80} />
            <pointLight position={[0, -18, 0]} intensity={2.0} color="#0284c7" distance={90} />
        </>
    );
}

// Mobile Gesture Gravity Holographic HUD Component
function MobileGestureGravityHUD({
    gestureVector,
    gestureControlMode,
    onToggleMode,
    gravityTilt,
}: {
    gestureVector: { dx: number; dy: number; gx: number; gz: number; angle: number; magnitude: number; active: boolean };
    gestureControlMode: 'swipe' | 'joystick' | 'off';
    onToggleMode: () => void;
    gravityTilt: [number, number, number];
}) {
    if (gestureControlMode === 'off') return null;

    // Use gesture active vector if user is dragging/swiping, or gravityTilt if using keys/tilt
    const activeGx = gestureVector.active ? gestureVector.gx : gravityTilt[0];
    const activeGz = gestureVector.active ? gestureVector.gz : gravityTilt[2];

    const maxRadiusPx = 24; // 3/4 scale max offset radius inside compass dial
    const xOffsetPx = Math.max(-maxRadiusPx, Math.min(maxRadiusPx, (activeGx / 14.0) * maxRadiusPx));
    const yOffsetPx = Math.max(-maxRadiusPx, Math.min(maxRadiusPx, (activeGz / 14.0) * maxRadiusPx));

    const lineLength = Math.sqrt(xOffsetPx * xOffsetPx + yOffsetPx * yOffsetPx);
    const lineAngleDeg = Math.atan2(yOffsetPx, xOffsetPx) * (180 / Math.PI);

    return (
        <div className="absolute bottom-4 left-3 md:bottom-5 md:left-4 z-20 pointer-events-auto font-mono flex flex-col gap-1.5 select-none max-w-[220px]">
            {/* Gesture Holographic Compass Dial (3/4 Size) */}
            <div className="relative w-18 h-18 sm:w-21 sm:h-21 rounded-full bg-slate-950/90 border-2 border-amber-500/50 backdrop-blur-md p-1 shadow-2xl flex items-center justify-center group overflow-hidden">
                {/* Rotating Grid Backdrop */}
                <div className="absolute inset-1 rounded-full border border-dashed border-amber-500/25 animate-spin" style={{ animationDuration: '24s' }} />
                <div className="absolute inset-2.5 rounded-full border border-cyan-500/30" />

                {/* Axis Direction Indicators */}
                <span className="absolute top-0.5 text-[8px] font-extrabold text-amber-400/90 tracking-tighter">-Z</span>
                <span className="absolute bottom-0.5 text-[8px] font-extrabold text-amber-400/90 tracking-tighter">+Z</span>
                <span className="absolute left-0.5 text-[8px] font-extrabold text-cyan-400/90 tracking-tighter">-X</span>
                <span className="absolute right-0.5 text-[8px] font-extrabold text-cyan-400/90 tracking-tighter">+X</span>

                {/* Center Core Anchor Marker */}
                <div 
                    className="absolute w-2 h-2 rounded-full bg-cyan-400/80 border border-white shadow-[0_0_8px_#38bdf8] -translate-x-1/2 -translate-y-1/2" 
                    style={{ left: '50%', top: '50%' }} 
                />

                {/* Dynamic Gravity Energy Trail Vector */}
                {lineLength > 1.5 && (
                    <div 
                        className="absolute origin-left h-1 rounded-full pointer-events-none transition-all duration-75"
                        style={{
                            left: '50%',
                            top: '50%',
                            width: `${lineLength}px`,
                            transform: `translateY(-50%) rotate(${lineAngleDeg}deg)`,
                            backgroundColor: gestureVector.active ? '#fbbf24' : '#38bdf8',
                            boxShadow: gestureVector.active ? '0 0 12px #f59e0b' : '0 0 8px #06b6d4',
                        }}
                    />
                )}

                {/* Dynamic Gravity Force Reticle Target Pointer */}
                <div 
                    className={`absolute rounded-full border-2 transition-all duration-75 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
                        gestureVector.active || lineLength > 2
                            ? 'w-3.5 h-3.5 bg-amber-400 border-white shadow-[0_0_16px_#f59e0b] scale-110 z-10' 
                            : 'w-2.5 h-2.5 bg-cyan-400 border-cyan-100 shadow-[0_0_10px_#06b6d4]'
                    }`}
                    style={{
                        left: `calc(50% + ${xOffsetPx}px)`,
                        top: `calc(50% + ${yOffsetPx}px)`,
                    }}
                >
                    <div className={`w-1 h-1 rounded-full ${gestureVector.active ? 'bg-white animate-ping' : 'bg-cyan-100'}`} />
                </div>
            </div>
        </div>
    );
}

const INITIAL_SOLID_OBJECTS: SolidPhysicsObjectData[] = [
    { id: '1', type: 'sphere', position: [-12, 12, -8], size: 2.2, hue: 0, colorHex: '#ef4444', mass: 10 },
    { id: '2', type: 'box', position: [14, 15, 10], size: 2.5, hue: 45, colorHex: '#f59e0b', mass: 15 },
    { id: '3', type: 'torus', position: [0, 18, -15], size: 2.8, hue: 120, colorHex: '#10b981', mass: 12 },
    { id: '4', type: 'sphere', position: [10, 20, -10], size: 2.0, hue: 200, colorHex: '#06b6d4', mass: 8 },
    { id: '5', type: 'box', position: [-15, 16, 12], size: 2.4, hue: 270, colorHex: '#8b5cf6', mass: 14 },
    { id: '6', type: 'torus', position: [8, 22, 14], size: 3.0, hue: 320, colorHex: '#ec4899', mass: 18 },
];

export default function App() {
    const [fractalMode, setFractalMode] = useState<FractalAlgorithmMode>('unified');
    const [locusData, setLocusData] = useState<{ pos: THREE.Vector3 | null; isPulling: boolean; isMoving: boolean; moveVel: number }>({ pos: null, isPulling: false, isMoving: false, moveVel: 0 });

    // Gesture-Based Mobile Gravity Control State & Refs
    const [gestureControlMode, setGestureControlMode] = useState<'swipe' | 'joystick' | 'off'>('joystick');
    const [gestureVector, setGestureVector] = useState<{
        dx: number;
        dy: number;
        gx: number;
        gz: number;
        angle: number;
        magnitude: number;
        active: boolean;
    }>({
        dx: 0,
        dy: 0,
        gx: 0,
        gz: 0,
        angle: 0,
        magnitude: 0,
        active: false,
    });

    const gestureRef = useRef<{
        startX: number;
        startY: number;
        active: boolean;
        gx: number;
        gz: number;
        lastQuadrant: number;
    }>({
        startX: 0,
        startY: 0,
        active: false,
        gx: 0,
        gz: 0,
        lastQuadrant: -1,
    });

    const joystickVectorRef = useRef({ gx: 0, gz: 0, active: false });
    const [fusionMetrics, setFusionMetrics] = useState({ activeCount: PARTICLE_COUNT, maxFusionStage: 0, totalMass: 100 });
    const [solidObjects, setSolidObjects] = useState<SolidPhysicsObjectData[]>(INITIAL_SOLID_OBJECTS);
    const [supernovaFlash, setSupernovaFlash] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // --- CYBERNETIC ARCADE GAME STATE ---
    const [gameState, setGameState] = useState<'playing' | 'levelup' | 'gameover'>('playing');
    const [playerStats, setPlayerStats] = useState<PlayerStats>({
        coreIntegrity: 100,
        maxCore: 100,
        shield: 100,
        maxShield: 100,
        shieldRegenRate: 2.5,
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        score: 0,
        highScore: 0,
        combo: 1,
        comboTimer: 0,
        highestCombo: 1,
        moveSpeed: 1.0,
        gravitonForce: 0.18,
        magnetRadius: 0,
        empShocks: 0,
        activeItems: [],
        augments: [],
    });

    const [itemDrops, setItemDrops] = useState<CyberItemDrop[]>([]);
    const [voidHazards, setVoidHazards] = useState<RogueVoidHazard[]>([]);
    const [shearGates, setShearGates] = useState<DimensionalShearGate[]>([]);
    const [warpActive, setWarpActive] = useState(false);
    const [showTutorialHint, setShowTutorialHint] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showQuantumVault, setShowQuantumVault] = useState(false);
    const [showLoreBriefing, setShowLoreBriefing] = useState(false);
    const [playerCredits, setPlayerCredits] = useState(2500);
    const [callsign, setCallsign] = useState('NEO_PILOT');
    const [currentAugmentOptions, setCurrentAugmentOptions] = useState<CyberAugment[]>([]);
    const [floatingPoints, setFloatingPoints] = useState<{ id: string; text: string; color: string }[]>([]);

    const handlePurchaseItem = (itemId: string, cost: number, itemType: string) => {
        setPlayerCredits(prev => Math.max(0, prev - cost));
        if (itemId === 'refill_pack') {
            setPlayerStats(prev => ({
                ...prev,
                shield: 100,
                maxShield: Math.max(prev.maxShield, 100),
                coreIntegrity: 100,
            }));
            triggerFloatingText('⚡ QUANTUM ENERGY REFILLED TO 100%!', 'text-amber-300 font-black text-sm');
        } else {
            triggerFloatingText('✨ VIP PASS / CYBER SKIN ACQUIRED SUCCESSFULLY!', 'text-emerald-300 font-black text-sm');
        }
    };

    // Seamless In-Game Notification Banner Toast
    const [levelUpBanner, setLevelUpBanner] = useState<{ level: number; augName: string; boost: string } | null>(null);
    const [impactPulse, setImpactPulse] = useState(0);

    // Violent Shield Impact Visuals & Audio Cues
    const [cameraShake, setCameraShake] = useState(0);
    const [shieldImpactFlash, setShieldImpactFlash] = useState(false);
    const [shieldImpactEvent, setShieldImpactEvent] = useState<{ pos: THREE.Vector3; id: number } | null>(null);

    const handleShieldViolentImpact = (impactPos: THREE.Vector3) => {
        soundEngine.playShieldViolentImpactSound();
        setImpactPulse(4.2); // Drive 3D central core & shield surge
        setCameraShake(2.0); // Violent camera shake trauma
        setShieldImpactFlash(true); // Screen shockwave electrical flash
        setTimeout(() => setShieldImpactFlash(false), 380);

        setShieldImpactEvent({
            pos: impactPos.clone(),
            id: Date.now() + Math.random(),
        });
    };

    // --- SECTOR STAGE & OBJECTIVES SYSTEM ---
    const [sectorLevel, setSectorLevel] = useState<number>(1);
    const [sectorProgress, setSectorProgress] = useState<SectorProgress>({
        sectorLevel: 1,
        gatesPassed: 0,
        itemsCollected: 0,
        hazardsNeutralized: 0,
        maxComboAchieved: 1,
        nodesAbsorbed: 0,
        sectorScore: 0,
        centralCoreHealth: 100,
        overchargeAmmo: 0,
        isShieldActive: true,
    });
    const [isSectorCompleteModalOpen, setIsSectorCompleteModalOpen] = useState(false);
    const [isSectorBriefingOpen, setIsSectorBriefingOpen] = useState(true);
    const [sectorRewardOptions, setSectorRewardOptions] = useState<CyberAugment[]>([]);

    const isGamePaused = gameState !== 'playing' || isSectorBriefingOpen || isSectorCompleteModalOpen || showLeaderboard;

    const currentSectorDef = useMemo(() => getSectorDefinition(sectorLevel), [sectorLevel]);
    const nextSectorDef = useMemo(() => getSectorDefinition(sectorLevel + 1), [sectorLevel]);

    const locusPosRef = useRef<THREE.Vector3 | null>(null);
    useEffect(() => {
        locusPosRef.current = new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z);
    }, [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)]);

    // Ground Charging Circles State
    const [groundRings] = useState([
        { id: 'ring_center', position: [0, -0.5, 0] as [number, number, number], radius: 6.5, active: true },
        { id: 'ring_left', position: [-16, -0.5, 14] as [number, number, number], radius: 5.0, active: true },
        { id: 'ring_right', position: [16, -0.5, -14] as [number, number, number], radius: 5.0, active: true },
    ]);

    const handleChargePlayerAmmo = (amount: number) => {
        setSectorProgress(sp => {
            if (sp.overchargeAmmo >= 100) return sp;
            const newAmmo = Math.min(100, sp.overchargeAmmo + amount);
            if (newAmmo >= 100 && sp.overchargeAmmo < 100) {
                soundEngine.playTachyonPulseSound();
                triggerFloatingText('⚡ OVERCHARGE AMMO READY! FLING OBJECT TO BREACH CORE!', 'text-amber-300 font-black text-sm');
            } else if (Math.floor(newAmmo / 25) > Math.floor(sp.overchargeAmmo / 25)) {
                soundEngine.playItemPickupSound('nanite');
            }
            return {
                ...sp,
                overchargeAmmo: newAmmo,
            };
        });
    };

    // Calculate Machine Subsystem kinetic power levels based on specific thresholds requested:
    // 1. Nodes -> Subsystem 1 (Rotor)
    // 2. Gates -> Subsystem 2 (Clockwork Cogs)
    // 3. Drops -> Subsystem 3 (Outer Relay Ring)
    // 4. Combos -> Subsystem 4 (Overcharge Circuit Surge)
    const machineSubsystems = useMemo(() => {
        const targets = currentSectorDef.targets;
        
        // Subsystem 1 (Rotor) -> Nodes Absorbed
        const nodeThresh = targets.nodeThreshold || 1;
        const s1Power = sectorProgress.nodesAbsorbed < nodeThresh
            ? 0.0
            : 0.15 + (sectorProgress.nodesAbsorbed - nodeThresh) * 0.012;

        // Subsystem 2 (Cogs) -> Gates Passed
        const gateThresh = targets.gateThreshold || 1;
        const s2Power = sectorProgress.gatesPassed < gateThresh
            ? 0.0
            : 0.15 + (sectorProgress.gatesPassed - gateThresh) * 0.015;

        // Subsystem 3 (Relay) -> Drops Collected
        const dropThresh = targets.dropThreshold || 1;
        const s3Power = sectorProgress.itemsCollected < dropThresh
            ? 0.0
            : 0.15 + (sectorProgress.itemsCollected - dropThresh) * 0.014;

        // Subsystem 4 (Surge) -> Max Combo Achieved
        const comboThresh = targets.comboThreshold || 1;
        const s4Power = sectorProgress.maxComboAchieved < comboThresh
            ? 0.0
            : 0.15 + (sectorProgress.maxComboAchieved - comboThresh) * 0.018;

        const isAllPartsMoving = s1Power > 0 && s2Power > 0 && s3Power > 0 && s4Power > 0;
        const isShieldActive = !isAllPartsMoving;

        return {
            s1Power,
            s2Power,
            s3Power,
            s4Power,
            isAllPartsMoving,
            isShieldActive,
        };
    }, [currentSectorDef, sectorProgress.nodesAbsorbed, sectorProgress.gatesPassed, sectorProgress.itemsCollected, sectorProgress.maxComboAchieved]);

    // Keep shield status synced in sectorProgress
    useEffect(() => {
        setSectorProgress(sp => {
            if (sp.isShieldActive !== machineSubsystems.isShieldActive) {
                if (!machineSubsystems.isShieldActive) {
                    soundEngine.playTachyonPulseSound();
                    soundEngine.playSupernovaSound();
                    setSupernovaFlash(true);
                    setTimeout(() => setSupernovaFlash(false), 800);
                    triggerFloatingText('🔓 CENTRAL CORE SHIELD LOWERED! CORE IS EXPOSED!', 'text-emerald-300 font-black text-lg animate-bounce');
                }
                return { ...sp, isShieldActive: machineSubsystems.isShieldActive };
            }
            return sp;
        });
    }, [machineSubsystems.isShieldActive]);

    const handleCoreImpact = (impactPos: THREE.Vector3, isSlung: boolean) => {
        if (gameState !== 'playing' || isGamePaused) return;

        setSectorProgress(sp => {
            const isShieldActive = sp.isShieldActive;
            const currentAmmo = sp.overchargeAmmo;
            const maxCoreHp = currentSectorDef.targets.centralCoreMaxHealth || 100;

            if (isShieldActive) {
                // ABSOLUTE RULE: It is IMPOSSIBLE to damage the central core while shield is active!
                handleShieldViolentImpact(impactPos);
                triggerHapticFeedback([120, 60, 180, 60, 240]);
                const t = currentSectorDef.targets;
                triggerFloatingText(
                    `⚡ VIOLENT SHIELD DEFLECTION! HARSH RECOIL! (${sp.gatesPassed}/${t.gateThreshold} Gates, ${sp.itemsCollected}/${t.dropThreshold} Drops, ${sp.nodesAbsorbed}/${t.nodeThreshold} Nodes, ${playerStats.combo}/${t.comboThreshold}x Combo)`,
                    'text-rose-400 font-black text-xs sm:text-sm tracking-wider animate-bounce drop-shadow-[0_0_12px_rgba(244,63,94,1)]'
                );
                return sp;
            } else {
                // Shield is EXPOSED!
                soundEngine.playSupernovaSound();
                soundEngine.playTachyonPulseSound();
                setSupernovaFlash(true);
                setTimeout(() => setSupernovaFlash(false), 500);
                triggerHapticFeedback([60, 50, 100, 50, 150]);

                const isOvercharged = currentAmmo >= 100;
                const damagePct = isOvercharged ? 0.50 : 0.25;
                const damage = Math.round(maxCoreHp * damagePct);
                const newHealth = Math.max(0, sp.centralCoreHealth - damage);

                if (isOvercharged) {
                    triggerFloatingText(`💥 OVERCHARGED CORE CRITICAL IMPACT: -${damage} HP!`, 'text-amber-300 font-black text-xl');
                } else {
                    triggerFloatingText(`💥 DIRECT CORE IMPACT: -${damage} HP!`, 'text-cyan-300 font-black text-lg');
                }

                if (newHealth <= 0) {
                    setTimeout(() => handleCentralCoreDestroyed(), 50);
                }

                return {
                    ...sp,
                    overchargeAmmo: isOvercharged ? 0 : sp.overchargeAmmo,
                    centralCoreHealth: newHealth,
                };
            }
        });
    };

    const lastOuterOrbitDamageTextTimeRef = useRef<number>(0);

    const handlePlayerOuterOrbitDamage = useCallback((damageAmount: number) => {
        if (gameState !== 'playing' || isGamePaused) return;

        setPlayerStats((prev) => {
            let newShield = prev.shield;
            let newCore = prev.coreIntegrity;

            if (damageAmount >= 500) {
                newShield = 0;
                newCore = 0;
            } else if (newShield > 0) {
                newShield = Math.max(0, newShield - damageAmount);
                soundEngine.playDamageSound(true);
            } else {
                newCore = Math.max(0, newCore - damageAmount);
                soundEngine.playDamageSound(false);
            }

            const now = Date.now();
            if (now - lastOuterOrbitDamageTextTimeRef.current > 650) {
                lastOuterOrbitDamageTextTimeRef.current = now;
                triggerFloatingText(damageAmount >= 500 ? '⚡ FATAL SHIELD BREACH! CORE DESTROYED!' : '⚡ CENTRIFUGAL OUTER ORBIT SHEAR! -' + Math.max(1, Math.round(damageAmount * 3)) + ' HP', 'text-rose-400 font-black text-xs animate-bounce');
                triggerHapticFeedback([40, 30, 60]);
            }

            if (newCore <= 0 || damageAmount >= 500) {
                soundEngine.playGameOverSound();
                setGameState('gameover');
            }

            return {
                ...prev,
                shield: newShield,
                coreIntegrity: newCore,
            };
        });
    }, [gameState, isGamePaused]);

    const handleCentralCoreDestroyed = () => {
        soundEngine.playTachyonPulseSound();
        soundEngine.playSupernovaSound();
        setSupernovaFlash(true);
        setTimeout(() => setSupernovaFlash(false), 1200);
        triggerFloatingText(`💥 CENTRAL CORE OBLITERATED! SECTOR CLEARED! +10,000 XP!`, 'text-amber-300 font-black text-2xl animate-bounce');

        setPlayerStats(prev => ({
            ...prev,
            score: prev.score + 10000,
            xp: prev.xp + 1000,
            combo: prev.combo + 5,
            shield: Math.min(prev.maxShield, prev.shield + 100),
        }));

        const shuffled = [...ALL_AUGMENTS].sort(() => Math.random() - 0.5);
        setSectorRewardOptions(shuffled.slice(0, 3));
        setIsSectorCompleteModalOpen(true);
    };

    const handleMasterMachineBreach = () => {
        soundEngine.playTachyonPulseSound();
        soundEngine.playSupernovaSound();
        setSupernovaFlash(true);
        setTimeout(() => setSupernovaFlash(false), 900);
        triggerFloatingText('💥 MASTER MACHINE BREACH! TOTAL RESONANCE +10,000 XP!', 'text-amber-300 font-black text-xl');
        setImpactPulse(3.0);
        setPlayerStats(prev => ({
            ...prev,
            score: prev.score + 10000,
            combo: prev.combo + 5,
            shield: Math.min(prev.maxShield, prev.shield + 50),
        }));
        // Complete all targets
        const targets = currentSectorDef.targets;
        setSectorProgress(sp => ({
            ...sp,
            gatesPassed: Math.max(sp.gatesPassed, targets.gatesPassedTarget),
            itemsCollected: Math.max(sp.itemsCollected, targets.itemsCollectedTarget),
            hazardsNeutralized: Math.max(sp.hazardsNeutralized, targets.hazardsNeutralizedTarget),
            maxComboAchieved: Math.max(sp.maxComboAchieved, targets.comboTarget),
            nodesAbsorbed: Math.max(sp.nodesAbsorbed, targets.nodesAbsorbedTarget),
            sectorScore: sp.sectorScore + 10000,
        }));
        const shuffled = [...ALL_AUGMENTS].sort(() => Math.random() - 0.5);
        setSectorRewardOptions(shuffled.slice(0, 3));
        setIsSectorCompleteModalOpen(true);
    };

    const handleMasterMachineBlocked = () => {
        soundEngine.playHazardHitSound();
        triggerFloatingText('⚠️ APERTURE SHUTTER BLOCKED! TIME YOUR SLING WHEN GOLDEN GAP OPENS!', 'text-rose-400 font-bold');
        setImpactPulse(1.2);
    };

    const evaluateSectorObjectives = (progress: SectorProgress) => {
        const targets = currentSectorDef.targets;
        const isGatesMet = progress.gatesPassed >= targets.gatesPassedTarget;
        const isItemsMet = progress.itemsCollected >= targets.itemsCollectedTarget;
        const isComboMet = progress.maxComboAchieved >= targets.comboTarget;
        const isHazardsMet = targets.hazardsNeutralizedTarget === 0 || progress.hazardsNeutralized >= targets.hazardsNeutralizedTarget;
        const isNodesMet = targets.nodesAbsorbedTarget === 0 || progress.nodesAbsorbed >= targets.nodesAbsorbedTarget;
        const isScoreMet = !targets.targetScore || progress.sectorScore >= targets.targetScore;

        if (isGatesMet && isItemsMet && isComboMet && isHazardsMet && isNodesMet && isScoreMet) {
            // NON-INTRUSIVE NOTIFICATION (Does NOT pause or open popup modal during gameplay!)
            soundEngine.playItemPickupSound('nanite');
            triggerFloatingText(`🏆 SECTOR ${sectorLevel} OBJECTIVES MET! CORE SHIELD LOWERED!`, 'text-emerald-300 font-black text-lg animate-bounce');
        }
    };

    // Temporal Flow Control State ("The Flow of Time")
    const [temporalState, setTemporalState] = useState<TemporalState>({
        timeScale: 1.0,
        chronoEnergy: 0,
        maxChronoEnergy: 100,
        isRewinding: false,
        rewindTimer: 0,
        activeModeLabel: '⚡ STABLE CONTINUUM',
    });

    const activeResonanceState = useMemo(() => {
        if (temporalState.isRewinding) return '🌀 CHRONO TEMPORAL REWIND :: TIME INVERTED!';
        if (temporalState.timeScale === 0.25) return '⏱️ BULLET-TIME EVASIVE STASIS (0.25X)';
        if (temporalState.timeScale === 2.5) return '⏩ CHRONO OVERCLOCK (2.50X SPEED)';
        if (!gameRefs.isPulling && !locusData.isMoving && locusData.moveVel < 0.05) {
            return '⚠️ IDLE DECAY :: GRAVITATIONAL COLLAPSE ACTIVE!';
        }
        if (gameRefs.isPulling) return '🌊 WAVE FOLDING RESONANCE';
        if (playerStats.combo >= 4) return '🔮 FRACTAL XENON OVERDRIVE';
        if (impactPulse > 0) return '💠 TENSOR CLUSTER HARMONIC';
        if (itemDrops.length > 4) return '💎 HYDRA MATRIX CASCADE';
        if (shearGates.length > 2) return '🌀 BIFURCATION SHEAR FIELD';
        return '⚡ ALGORITHMIC SINGULARITY OVERLOAD';
    }, [temporalState.isRewinding, temporalState.timeScale, gameRefs.isPulling, locusData.isMoving, locusData.moveVel, playerStats.combo, impactPulse, itemDrops.length, shearGates.length]);

    useEffect(() => {
        const loadSavedData = async () => {
            const { value: stored } = await Preferences.get({ key: 'cyber_high_score' });
            if (stored) {
                setPlayerStats(prev => ({ ...prev, highScore: parseInt(stored, 10) }));
            }
            const { value: storedLb } = await Preferences.get({ key: 'cyber_leaderboard' });
            if (storedLb) {
                try {
                    setLeaderboard(JSON.parse(storedLb));
                } catch (e) {
                    console.warn(e);
                }
            }
        };
        loadSavedData();
    }, []);

    useEffect(() => {
        if (sectorLevel === 1 && sectorProgress.nodesAbsorbed === 0) {
            const timer = setTimeout(() => setShowTutorialHint(true), 5000);
            return () => clearTimeout(timer);
        } else {
            setShowTutorialHint(false);
        }
    }, [sectorLevel, sectorProgress.nodesAbsorbed]);

    const handleUserInteraction = () => {
        soundEngine.init();
        soundEngine.resume();
    };

    const triggerFloatingText = (text: string, color: string = 'text-amber-400') => {
        const id = generateUniqueId('float');
        setFloatingPoints(prev => [...prev.slice(-6), { id, text, color }]);
        setTimeout(() => {
            setFloatingPoints(prev => prev.filter(p => p.id !== id));
        }, 1200);
    };

    // Game logic loop: Active play regenerates shield; IDLE / LEAVING GAME ALONE causes Gravitational Collapse & Failure!
    useEffect(() => {
        if (gameState !== 'playing' || isSectorBriefingOpen || isSectorCompleteModalOpen || showLeaderboard) return;

        let idleTicks = 0;

        const interval = setInterval(() => {
            // Dynamic Time Scale Calculation Controlled 100% By Strategic Gameplay Actions
            setTemporalState((prevChrono) => {
                let isRew = prevChrono.isRewinding;
                let rewTimer = Math.max(0, prevChrono.rewindTimer - 0.2);

                if (rewTimer <= 0 && isRew) {
                    isRew = false;
                }

                let newScale: DynamicTimeScale = 1.0;
                let modeLabel = '⚡ STABLE CONTINUUM';

                if (isRew) {
                    newScale = 1.0;
                    modeLabel = '🌀 CHRONO TEMPORAL REWIND :: HAZARD REFLECTION';
                } else {
                    // Compute nearest hazard proximity to player locus
                    let minHazardDist = 999;
                    if (new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)) {
                        const px = new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x;
                        const pz = new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z;
                        voidHazards.forEach((h) => {
                            const dx = h.position[0] - px;
                            const dz = h.position[2] - pz;
                            const d = Math.sqrt(dx * dx + dz * dz);
                            if (d < minHazardDist) minHazardDist = d;
                        });
                    }

                    const isActive = gameRefs.isPulling || locusData.isMoving || locusData.moveVel > 0.05;

                    if (minHazardDist < 8.0 && isActive) {
                        // Action 1: Bullet-Time Evasive Stasis when dodging in close hazard proximity
                        newScale = 0.5;
                        modeLabel = '⏱️ BULLET-TIME EVASIVE STASIS';
                    } else if (playerStats.combo >= 6 || locusData.moveVel > 1.2) {
                        // Action 2: Moderate Chrono Boost when sustaining intense speed
                        newScale = 1.35;
                        modeLabel = '⏩ CHRONO BOOST (1.35X SPEED)';
                    } else if (!isActive) {
                        // Action 3: Idle Sluggish Decay when left alone
                        newScale = 0.85;
                        modeLabel = '⚠️ IDLE SLOWDOWN :: STASIS DECAY';
                    } else {
                        newScale = 1.0;
                        modeLabel = '⚡ STABLE CONTINUUM';
                    }
                }

                if (newScale !== prevChrono.timeScale && !isRew) {
                    soundEngine.playChronoShiftSound(newScale);
                }

                let newEnergy = prevChrono.chronoEnergy;
                if (newScale === 0.25) {
                    newEnergy = Math.max(0, newEnergy - 1.0);
                } else if (newScale === 2.5) {
                    newEnergy = Math.max(0, newEnergy - 1.5);
                } else {
                    newEnergy = Math.min(prevChrono.maxChronoEnergy, newEnergy + 0.2);
                }

                return {
                    timeScale: newScale,
                    chronoEnergy: newEnergy,
                    maxChronoEnergy: prevChrono.maxChronoEnergy,
                    isRewinding: isRew,
                    rewindTimer: rewTimer,
                    activeModeLabel: modeLabel,
                };
            });

            setPlayerStats((prev) => {
                const isActive = gameRefs.isPulling || locusData.isMoving || locusData.moveVel > 0.05;

                let newShield = prev.shield;
                let newCore = prev.coreIntegrity;

                if (isActive) {
                    idleTicks = 0;
                    newShield = Math.min(prev.maxShield, prev.shield + prev.shieldRegenRate * 0.2);
                } else {
                    // [REMOVED] Idle Decay mechanism - Game no longer drains health when phone is set down.
                }
                
                let newComboTimer = prev.comboTimer - 0.2;
                let newCombo = prev.combo;
                if (newComboTimer <= 0) {
                    newCombo = 1;
                    newComboTimer = 0;
                }

                return {
                    ...prev,
                    shield: newShield,
                    coreIntegrity: newCore,
                    combo: newCombo,
                    comboTimer: newComboTimer,
                };
            });
        }, 200);

        return () => clearInterval(interval);
    }, [gameState, isSectorBriefingOpen, isSectorCompleteModalOpen, showLeaderboard, gameRefs.isPulling, locusData.isMoving, locusData.moveVel, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z), voidHazards, playerStats.combo]);

    useEffect(() => {
        if (gameState !== 'playing' || isSectorBriefingOpen || isSectorCompleteModalOpen || showLeaderboard) return;

        const combo = playerStats.combo;
        // Non-linear milestone calculation: +12% velocity and +8% spawn density per 5-combo milestone
        const milestones = Math.floor(combo / 5);
        const velocityMilestoneBoost = Math.pow(1.12, milestones);
        const densityMilestoneBoost = Math.pow(1.08, milestones);

        const baseInterval = Math.max(1000, 3500 - (combo - 1) * 130);
        const dynamicInterval = Math.max(600, baseInterval / densityMilestoneBoost);
        const hazardSpeedMultiplier = (1.0 + (combo - 1) * 0.05) * velocityMilestoneBoost;
        const hazardSpawnChance = Math.min(0.95, (0.75 + (combo - 1) * 0.02) * densityMilestoneBoost);

        const spawnInterval = setInterval(() => {
            if (Math.random() < 0.65) {
                const types: ('shield' | 'multiplier' | 'emp' | 'magnet' | 'nanite')[] = ['shield', 'multiplier', 'emp', 'magnet', 'nanite'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                const newItem: CyberItemDrop = {
                    id: generateUniqueId('drop'),
                    type: randomType,
                    position: [(Math.random() - 0.5) * 70, 5, (Math.random() - 0.5) * 70],
                    createdAt: Date.now(),
                    size: 1.0,
                };
                setItemDrops(prev => [...prev.slice(-12), newItem]);
            }

            if (Math.random() < hazardSpawnChance) {
                const baseSpd = 15 * hazardSpeedMultiplier;
                const newHazard: RogueVoidHazard = {
                    id: generateUniqueId('haz'),
                    position: [(Math.random() - 0.5) * 80, 5, (Math.random() - 0.5) * 80],
                    velocity: [(Math.random() - 0.5) * baseSpd, 0, (Math.random() - 0.5) * baseSpd],
                    size: 1.2 + Math.random() * 0.8,
                    speed: baseSpd,
                    pulsePhase: Math.random() * Math.PI,
                };
                setVoidHazards(prev => [...prev.slice(-12), newHazard]);
            }

            if (Math.random() < 0.6) {
                const newGate: DimensionalShearGate = {
                    id: generateUniqueId('gate'),
                    position: [(Math.random() - 0.5) * 60, 5, (Math.random() - 0.5) * 60],
                    rotation: Math.random() * Math.PI,
                    passed: false,
                };
                setShearGates(prev => [...prev.slice(-6), newGate]);
            }

            // Periodic Quantum Kinetic Geometry Spawning from Singularity Anomaly
            if (Math.random() < 0.55) {
                spawnSolidObject(undefined, true);
            }
        }, dynamicInterval);

        return () => clearInterval(spawnInterval);
    }, [gameState, isSectorBriefingOpen, isSectorCompleteModalOpen, showLeaderboard, playerStats.combo]);

    const chooseSmartAugment = (stats: PlayerStats, voidHazardsCount: number): CyberAugment => {
        if (stats.coreIntegrity < 70) {
            return ALL_AUGMENTS.find(a => a.id === 'core_1') || ALL_AUGMENTS[0];
        }
        if (stats.shield < 60) {
            return ALL_AUGMENTS.find(a => a.id === 'shield_1') || ALL_AUGMENTS[0];
        }
        if (voidHazardsCount > 2 || stats.combo >= 4) {
            return ALL_AUGMENTS.find(a => a.id === 'emp_1') || ALL_AUGMENTS[0];
        }
        if (stats.magnetRadius < 15) {
            return ALL_AUGMENTS.find(a => a.id === 'magnet_1') || ALL_AUGMENTS[0];
        }
        if (stats.moveSpeed < 1.35) {
            return ALL_AUGMENTS.find(a => a.id === 'thrusters_1') || ALL_AUGMENTS[0];
        }
        return ALL_AUGMENTS.find(a => a.id === 'graviton_1') || ALL_AUGMENTS[0];
    };

    const addScoreAndXP = (scoreGained: number, xpGained: number, label?: string) => {
        if (gameState !== 'playing' || isGamePaused) return;
        setPlayerStats((prev) => {
            const isMultiplierActive = prev.activeItems.some(i => i.type === 'multiplier' && i.expiresAt > Date.now());
            const finalScoreGained = scoreGained * prev.combo * (isMultiplierActive ? 3 : 1);
            const finalXpGained = xpGained * (isMultiplierActive ? 2 : 1);

            const newScore = prev.score + finalScoreGained;
            const newHighScore = Math.max(prev.highScore, newScore);
            if (newHighScore > prev.highScore) {
                Preferences.set({ key: 'cyber_high_score', value: newHighScore.toString() });
            }

            let newXp = prev.xp + finalXpGained;
            let newLevel = prev.level;
            let newXpToNext = prev.xpToNextLevel;
            let triggeredLevelUp = false;

            if (newXp >= newXpToNext) {
                newLevel++;
                newXp = newXp - newXpToNext;
                newXpToNext = Math.round(newXpToNext * 1.5);
                triggeredLevelUp = true;
            }

            const newCombo = Math.min(16, prev.combo + 1);
            const newHighestCombo = Math.max(prev.highestCombo, newCombo);

            let maxShield = prev.maxShield;
            let shieldRegen = prev.shieldRegenRate;
            let moveSpeed = prev.moveSpeed;
            let magnetRadius = prev.magnetRadius;
            let core = prev.coreIntegrity;
            let maxCore = prev.maxCore;
            let gravitonForce = prev.gravitonForce;
            let empShocks = prev.empShocks;
            let newAugments = prev.augments;

            if (triggeredLevelUp) {
                soundEngine.playLevelUpSound();
                soundEngine.playSupernovaSound();

                const aug = chooseSmartAugment(prev, voidHazards.length);

                if (aug.id === 'shield_1') {
                    maxShield += 50;
                    shieldRegen += 3.0;
                } else if (aug.id === 'thrusters_1') {
                    moveSpeed += 0.35;
                } else if (aug.id === 'magnet_1') {
                    magnetRadius += 15;
                } else if (aug.id === 'core_1') {
                    core = maxCore + 30;
                    maxCore += 30;
                } else if (aug.id === 'graviton_1') {
                    gravitonForce += 0.12;
                } else if (aug.id === 'emp_1') {
                    empShocks += 1;
                }

                newAugments = [...prev.augments, aug.name];

                setLevelUpBanner({ level: newLevel, augName: aug.name, boost: aug.statBoost });
                setTimeout(() => setLevelUpBanner(null), 7500);

                setSupernovaFlash(true);
                setTimeout(() => setSupernovaFlash(false), 500);

                triggerFloatingText(`⚡ LEVEL 0${newLevel} OVERCLOCK :: ${aug.name.toUpperCase()} ACTIVE!`, 'text-amber-300 font-black');
            } else if (newCombo > prev.combo) {
                soundEngine.playComboSound(newCombo);
            }

            if (label) {
                triggerFloatingText(`+${finalScoreGained} ${label}`, isMultiplierActive ? 'text-amber-400 font-bold' : 'text-sky-300');
            }

            setSectorProgress(sp => {
                const updated = {
                    ...sp,
                    maxComboAchieved: Math.max(sp.maxComboAchieved, newCombo),
                    sectorScore: sp.sectorScore + finalScoreGained,
                };
                evaluateSectorObjectives(updated);
                return updated;
            });

            return {
                ...prev,
                score: newScore,
                highScore: newHighScore,
                xp: newXp,
                level: newLevel,
                xpToNextLevel: newXpToNext,
                combo: newCombo,
                comboTimer: 3.5,
                highestCombo: newHighestCombo,
                maxShield,
                shieldRegenRate: shieldRegen,
                moveSpeed,
                magnetRadius,
                coreIntegrity: core,
                maxCore,
                gravitonForce,
                empShocks,
                augments: newAugments,
            };
        });
    };

    const handleCollectItem = (item: CyberItemDrop, chargeLevel: number = 1.0) => {
        if (gameState !== 'playing' || isGamePaused) return;
        handleUserInteraction();
        soundEngine.playItemPickupSound(item.type);
        setItemDrops(prev => prev.filter(i => i.id !== item.id));

        setSectorProgress(sp => {
            const updated = { ...sp, itemsCollected: sp.itemsCollected + 1 };
            evaluateSectorObjectives(updated);
            return updated;
        });

        const isOvercharged = chargeLevel > 1.8;
        const multiplier = isOvercharged ? 2.2 : 1.0;

        if (isOvercharged) {
            setImpactPulse(1.0);
            setTimeout(() => setImpactPulse(0), 400);
            setTemporalState(t => ({
                ...t,
                chronoEnergy: Math.min(t.maxChronoEnergy, t.chronoEnergy + 4),
            }));
            soundEngine.playSupernovaSound();
        }

        if (item.type === 'shield') {
            const heal = Math.round(50 * multiplier);
            setPlayerStats(prev => ({ ...prev, shield: Math.min(prev.maxShield, prev.shield + heal) }));
            triggerFloatingText(isOvercharged ? `⚡ OVERCHARGED SHIELD RECHARGE +${heal}!` : `+${heal} SHIELD RECHARGED`, 'text-sky-300 font-black');
            addScoreAndXP(Math.round(150 * multiplier), Math.round(40 * multiplier));
        } else if (item.type === 'multiplier') {
            setPlayerStats(prev => ({
                ...prev,
                activeItems: [...prev.activeItems.filter(ai => ai.type !== 'multiplier'), { type: 'multiplier', expiresAt: Date.now() + 10000 }]
            }));
            triggerFloatingText(isOvercharged ? '⚡ OVERCHARGED SCORE BOOST!' : '⚡ SCORE BOOST ACTIVE!', 'text-amber-300 font-black');
            addScoreAndXP(Math.round(300 * multiplier), Math.round(60 * multiplier));
        } else if (item.type === 'emp') {
            setVoidHazards([]);
            triggerFloatingText('💣 EMP SINGULARITY DETONATION!', 'text-purple-300 font-black');
            soundEngine.playSupernovaSound();
            spawnSolidObject(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z) ? [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x + (Math.random() - 0.5) * 10, 12, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z + (Math.random() - 0.5) * 10] : undefined);
            addScoreAndXP(Math.round(500 * multiplier), Math.round(100 * multiplier));
        } else if (item.type === 'magnet') {
            setPlayerStats(prev => ({ ...prev, magnetRadius: prev.magnetRadius + (isOvercharged ? 20 : 12) }));
            triggerFloatingText('🌀 OVERCHARGED MAGNET EXPANSION!', 'text-emerald-300 font-black');
            addScoreAndXP(Math.round(200 * multiplier), Math.round(50 * multiplier));
        } else if (item.type === 'nanite') {
            triggerFloatingText('💎 NANITE OVERCHARGE MATRIX LEVEL UP!', 'text-pink-300 font-black');
            spawnSolidObject(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z) ? [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x + (Math.random() - 0.5) * 10, 12, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z + (Math.random() - 0.5) * 10] : undefined);
            addScoreAndXP(Math.round(1000 * multiplier), Math.round(120 * multiplier));
        }
    };

    const handleHazardHit = (hazard: RogueVoidHazard) => {
        if (gameState !== 'playing' || isGamePaused) return;
        handleUserInteraction();
        setVoidHazards(prev => prev.filter(h => h.id !== hazard.id));

        setPlayerStats((prev) => {
            if (prev.shield >= 20) {
                const newShield = Math.min(prev.maxShield, prev.shield + 25);
                soundEngine.playItemPickupSound('emp');
                triggerFloatingText('⚡ QUANTUM HAZARD ABSORPTION :: SHIELD +25!', 'text-emerald-300 font-black');

                setSectorProgress(sp => {
                    const updated = { ...sp, hazardsNeutralized: sp.hazardsNeutralized + 1 };
                    evaluateSectorObjectives(updated);
                    return updated;
                });

                setTemporalState(t => ({
                    ...t,
                    chronoEnergy: Math.min(t.maxChronoEnergy, t.chronoEnergy + 2),
                    activeModeLabel: '⚡ QUANTUM HAZARD ABSORPTION'
                }));

                return {
                    ...prev,
                    shield: newShield,
                    score: prev.score + 1500 * prev.combo,
                    highScore: Math.max(prev.highScore, prev.score + 1500 * prev.combo),
                    xp: prev.xp + 120,
                };
            } else {
                // Critical core damage when unshielded
                const newCore = Math.max(0, prev.coreIntegrity - 25);
                soundEngine.playDamageSound(false);
                triggerFloatingText('🚨 UNPROTECTED CORE DAMAGE -25', 'text-rose-600 font-bold');

                if (newCore <= 0) {
                    soundEngine.playGameOverSound();
                    setGameState('gameover');
                }

                return {
                    ...prev,
                    coreIntegrity: newCore,
                };
            }
        });
    };

    const handleGatePass = (gate: DimensionalShearGate, chargeLevel: number = 1.0) => {
        if (gameState !== 'playing' || isGamePaused) return;
        handleUserInteraction();
        soundEngine.playGatePassSound();
        const isOvercharged = chargeLevel > 2.2;

        setSectorProgress(sp => {
            const updated = { ...sp, gatesPassed: sp.gatesPassed + 1 };
            evaluateSectorObjectives(updated);
            return updated;
        });

        // Gate rift materializes kinetic physics objects into gameplay
        spawnSolidObject(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z) ? [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x + (Math.random() - 0.5) * 10, 12, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z + (Math.random() - 0.5) * 10] : undefined);
        if (isOvercharged) {
            spawnSolidObject(new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z) ? [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x + (Math.random() - 0.5) * 14, 14, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z + (Math.random() - 0.5) * 14] : undefined);
        }

        if (isOvercharged) {
            soundEngine.playSupernovaSound();
            setImpactPulse(1.2);
            setTimeout(() => setImpactPulse(0), 500);
            setVoidHazards([]);
            triggerFloatingText('🌀 OVERCHARGED CHRONO-LENS DETONATION!', 'text-emerald-300 font-black');
        } else {
            triggerFloatingText('⚡ SHEAR GATE ACCELERATION!', 'text-cyan-300 font-bold');
        }

        setTemporalState(t => ({
            ...t,
            chronoEnergy: Math.min(t.maxChronoEnergy, t.chronoEnergy + (isOvercharged ? 5 : 2)),
            isRewinding: false,
            rewindTimer: 0,
            activeModeLabel: isOvercharged ? '🌀 OVERCHARGED CHRONO REFRACTION BURST' : '⚡ SHEAR GATE ACCELERATION'
        }));

        addScoreAndXP(Math.round(600 * chargeLevel), Math.round(200 * chargeLevel));
    };

    const triggerManualChronoRewind = useCallback(() => {
        if (gameState !== 'playing' || isGamePaused) return;
        setTemporalState(t => {
            if (t.chronoEnergy < 100) {
                triggerFloatingText(`⚠️ CHRONO REWIND CHARGING (${Math.round(t.chronoEnergy)}/100%)`, 'text-amber-400 font-bold text-xs');
                return t;
            }
            soundEngine.playChronoShiftSound(0.5);
            soundEngine.playSupernovaSound();
            triggerFloatingText('🌀 MANUAL CHRONO TEMPORAL REWIND ACTIVATED!', 'text-emerald-300 font-black');
            return {
                ...t,
                chronoEnergy: 0,
                isRewinding: true,
                rewindTimer: 1.2,
                activeModeLabel: '🌀 MANUAL CHRONO TEMPORAL REWIND'
            };
        });
    }, [gameState, isGamePaused]);

    const handleObjectRammed = () => {
        if (gameState !== 'playing' || isGamePaused) return;
        triggerHapticFeedback([25, 20, 35]);
        setImpactPulse(1.0);
        setTimeout(() => setImpactPulse(0), 400);
        addScoreAndXP(120, 35, 'KINETIC IMPACT');
    };

    const handleKineticSling = (objType: string) => {
        if (gameState !== 'playing' || isGamePaused) return;
        triggerHapticFeedback([40, 30, 80]);
        setImpactPulse(1.8);
        setTimeout(() => setImpactPulse(0), 500);

        soundEngine.playKineticSlingshotSound();
        triggerFloatingText(`⚡ KINETIC ORBITAL CATAPULT [${objType.toUpperCase()}] +500 PTS`, 'text-amber-300 font-extrabold text-sm sm:text-base tracking-wide');

        addScoreAndXP(500, 80, `ORBITAL CATAPULT SLING [${objType.toUpperCase()}]`);

        // Restore core shield and chrono energy
        setPlayerStats(prev => ({
            ...prev,
            shield: Math.min(prev.maxShield, prev.shield + 25),
            comboTimer: 4.5
        }));

        setTemporalState(t => ({
            ...t,
            chronoEnergy: Math.min(t.maxChronoEnergy, t.chronoEnergy + 3)
        }));

        // Objective progress: counts towards sector items & nodes objectives
        setSectorProgress(sp => {
            const updated = {
                ...sp,
                itemsCollected: sp.itemsCollected + 1,
                nodesAbsorbed: sp.nodesAbsorbed + 1
            };
            evaluateSectorObjectives(updated);
            return updated;
        });

        // Vaporize any nearby void hazards caught in the launch wave
        setVoidHazards(hazards => {
            return hazards.filter(h => {
                if (new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)) {
                    const dx = h.position[0] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x;
                    const dy = h.position[1] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).y;
                    const dz = h.position[2] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z;
                    if (dx * dx + dy * dy + dz * dz < 484) {
                        triggerFloatingText('💥 VOID HAZARD VAPORIZED!', 'text-sky-300 font-bold');
                        return false;
                    }
                }
                return true;
            });
        });
    };

    const handleAlignSatellites = (satelliteIndex: number) => {
        if (gameState !== 'playing' || isGamePaused) return;
        setImpactPulse(1.5);
        setTimeout(() => setImpactPulse(0), 450);

        triggerFloatingText(`⚙️ CHRONOS SYNCHRO-MESH ALIGNED! [HUB #${satelliteIndex + 1}] +350 PTS`, 'text-cyan-300 font-extrabold text-sm sm:text-base tracking-wide');

        addScoreAndXP(350, 60, `CHRONOS SYNCHRO-MESH ALIGNMENT [HUB #${satelliteIndex + 1}]`);

        // Restore Chrono Stasis energy and Shield
        setTemporalState(t => ({
            ...t,
            chronoEnergy: Math.min(t.maxChronoEnergy, t.chronoEnergy + 4)
        }));

        setPlayerStats(prev => ({
            ...prev,
            shield: Math.min(prev.maxShield, prev.shield + 20),
            comboTimer: 5.0
        }));

        // Advance sector progress items & nodes
        setSectorProgress(sp => {
            const updated = {
                ...sp,
                itemsCollected: sp.itemsCollected + 1,
                nodesAbsorbed: sp.nodesAbsorbed + 2
            };
            evaluateSectorObjectives(updated);
            return updated;
        });

        // Vaporize nearby Void Hazards in Chronos Synchro shockwave
        setVoidHazards(hazards => {
            return hazards.filter(h => {
                if (new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)) {
                    const dx = h.position[0] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x;
                    const dy = h.position[1] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).y;
                    const dz = h.position[2] - new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z;
                    if (dx * dx + dy * dy + dz * dz < 400) {
                        triggerFloatingText('⚡ CHRONOS SHOCKWAVE DISRUPTED VOID HAZARD!', 'text-amber-300 font-bold');
                        return false;
                    }
                }
                return true;
            });
        });
    };

    const handleNodeAbsorbed = () => {
        if (gameState !== 'playing' || isGamePaused) return;
        setSectorProgress(sp => {
            const updated = { ...sp, nodesAbsorbed: sp.nodesAbsorbed + 1 };
            evaluateSectorObjectives(updated);
            return updated;
        });
        addScoreAndXP(10, 2);
    };

    const handleAdvanceToNextSector = (aug?: CyberAugment) => {
        setIsSectorCompleteModalOpen(false);
        setWarpActive(true);
        soundEngine.playSupernovaSound();
        triggerHapticFeedback([100, 50, 200, 50, 400]);

        setTimeout(() => {
            setWarpActive(false);
            const nextLvl = sectorLevel + 1;
            const nextDef = getSectorDefinition(nextLvl);
            setSectorLevel(nextLvl);
            setSectorProgress({
                sectorLevel: nextLvl,
                gatesPassed: 0,
                itemsCollected: 0,
                hazardsNeutralized: 0,
                maxComboAchieved: 1,
                nodesAbsorbed: 0,
                sectorScore: 0,
                centralCoreHealth: nextDef.targets.centralCoreMaxHealth || 100,
                overchargeAmmo: 0,
                isShieldActive: true,
            });

            // Spawn fresh sector items & hazards
            setItemDrops(Array.from({ length: 6 }).map((_, i) => ({
                id: generateUniqueId(`drop_sec_${nextLvl}_${i}`),
                type: (['shield', 'multiplier', 'emp', 'magnet', 'nanite'] as const)[i % 5],
                position: [(Math.random() - 0.5) * 35, 12 + i, (Math.random() - 0.5) * 35],
                createdAt: Date.now(),
                size: 1.5,
                chargeLevel: 1.0,
            })));

            setVoidHazards(Array.from({ length: 3 + nextLvl }).map((_, i) => ({
                id: generateUniqueId(`haz_sec_${nextLvl}_${i}`),
                position: [(Math.random() - 0.5) * 50, 10 + i * 2, (Math.random() - 0.5) * 50],
                velocity: [(Math.random() - 0.5) * (1.5 + nextLvl * 0.2), (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * (1.5 + nextLvl * 0.2)],
                size: 2.0 + Math.random() * 1.5,
                speed: 1.2 + nextLvl * 0.2,
                pulsePhase: Math.random() * Math.PI * 2,
            })));

            setShearGates(Array.from({ length: 3 + Math.floor(nextLvl / 2) }).map((_, i) => ({
                id: generateUniqueId(`gate_sec_${nextLvl}_${i}`),
                position: [(Math.random() - 0.5) * 45, 12 + i * 2, (Math.random() - 0.5) * 45],
                rotation: Math.random() * Math.PI * 2,
                passed: false,
                chargeLevel: 1.0,
            })));

            setIsSectorBriefingOpen(true);
            triggerFloatingText(`🚀 WARPED TO SECTOR ${nextLvl}!`, 'text-cyan-300 font-black');
        }, 1200);

        if (aug) {
            setPlayerStats(prev => ({
                ...prev,
                augments: [...prev.augments, aug.name],
                shield: Math.min(prev.maxShield + 30, prev.shield + 50),
                maxShield: prev.maxShield + 30,
                coreIntegrity: Math.min(prev.maxCore, prev.coreIntegrity + 20),
                score: prev.score + 2500,
                xp: prev.xp + 300,
            }));
        } else {
            setPlayerStats(prev => ({
                ...prev,
                score: prev.score + 2500,
                xp: prev.xp + 300,
                coreIntegrity: Math.min(prev.maxCore, prev.coreIntegrity + 20),
            }));
        }

        const nextLvl = sectorLevel + 1;
        const nextDef = getSectorDefinition(nextLvl);
        setSectorLevel(nextLvl);
        setSectorProgress({
            sectorLevel: nextLvl,
            gatesPassed: 0,
            itemsCollected: 0,
            hazardsNeutralized: 0,
            maxComboAchieved: 1,
            nodesAbsorbed: 0,
            sectorScore: 0,
            centralCoreHealth: nextDef.targets.centralCoreMaxHealth || 100,
            overchargeAmmo: 0,
            isShieldActive: true,
        });

        // Spawn fresh sector items & hazards
        setItemDrops(Array.from({ length: 6 }).map((_, i) => ({
            id: generateUniqueId(`drop_sec_${nextLvl}_${i}`),
            type: (['shield', 'multiplier', 'emp', 'magnet', 'nanite'] as const)[i % 5],
            position: [(Math.random() - 0.5) * 35, 12 + i, (Math.random() - 0.5) * 35],
            createdAt: Date.now(),
            size: 1.5,
            chargeLevel: 1.0,
        })));

        setVoidHazards(Array.from({ length: 3 + nextLvl }).map((_, i) => ({
            id: generateUniqueId(`haz_sec_${nextLvl}_${i}`),
            position: [(Math.random() - 0.5) * 50, 10 + i * 2, (Math.random() - 0.5) * 50],
            velocity: [(Math.random() - 0.5) * (1.5 + nextLvl * 0.2), (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * (1.5 + nextLvl * 0.2)],
            size: 2.0 + Math.random() * 1.5,
            speed: 1.2 + nextLvl * 0.2,
            pulsePhase: Math.random() * Math.PI * 2,
        })));

        setShearGates(Array.from({ length: 3 + Math.floor(nextLvl / 2) }).map((_, i) => ({
            id: generateUniqueId(`gate_sec_${nextLvl}_${i}`),
            position: [(Math.random() - 0.5) * 45, 12 + i * 2, (Math.random() - 0.5) * 45],
            rotation: Math.random() * Math.PI * 2,
            passed: false,
            chargeLevel: 1.0,
        })));

        setIsSectorBriefingOpen(true);
        triggerFloatingText(`🚀 WARPED TO SECTOR ${nextLvl}!`, 'text-cyan-300 font-black');
    };

    const handleSelectAugment = (aug: CyberAugment) => {
        handleUserInteraction();
        soundEngine.playItemPickupSound('multiplier');

        setPlayerStats((prev) => {
            let maxShield = prev.maxShield;
            let shieldRegen = prev.shieldRegenRate;
            let moveSpeed = prev.moveSpeed;
            let magnetRadius = prev.magnetRadius;
            let core = prev.coreIntegrity;
            let maxCore = prev.maxCore;

            if (aug.id === 'shield_1') {
                maxShield += 50;
                shieldRegen += 3.0;
            } else if (aug.id === 'thrusters_1') {
                moveSpeed += 0.35;
            } else if (aug.id === 'magnet_1') {
                magnetRadius += 15;
            } else if (aug.id === 'core_1') {
                core = maxCore + 30;
                maxCore += 30;
            }

            return {
                ...prev,
                maxShield,
                shieldRegenRate: shieldRegen,
                moveSpeed,
                magnetRadius,
                coreIntegrity: core,
                maxCore,
                augments: [...prev.augments, aug.name],
            };
        });

        setGameState('playing');
    };

    const handleSubmitScore = (submittedCallsign: string) => {
        setCallsign(submittedCallsign);
        const newEntry: LeaderboardEntry = {
            id: generateUniqueId('lb'),
            pilotName: submittedCallsign,
            score: playerStats.score,
            level: playerStats.level,
            highestCombo: playerStats.highestCombo,
            date: new Date().toISOString().split('T')[0],
            rank: 1,
            title: playerStats.score > 50000 ? 'GRID HARVESTER' : 'CYBER PILOT',
        };

        const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score);
        setLeaderboard(updated);
        Preferences.set({ key: 'cyber_leaderboard', value: JSON.stringify(updated) });
    };

    const restartGame = () => {
        handleUserInteraction();
        setSectorLevel(1);
        const sec1Def = getSectorDefinition(1);
        setSectorProgress({
            sectorLevel: 1,
            gatesPassed: 0,
            itemsCollected: 0,
            hazardsNeutralized: 0,
            maxComboAchieved: 1,
            nodesAbsorbed: 0,
            sectorScore: 0,
            centralCoreHealth: sec1Def.targets.centralCoreMaxHealth || 100,
            overchargeAmmo: 0,
            isShieldActive: true,
        });
        setIsSectorCompleteModalOpen(false);
        setIsSectorBriefingOpen(true);

        setPlayerStats({
            coreIntegrity: 100,
            maxCore: 100,
            shield: 100,
            maxShield: 100,
            shieldRegenRate: 2.5,
            level: 1,
            xp: 0,
            xpToNextLevel: 500,
            score: 0,
            highScore: playerStats.highScore,
            combo: 1,
            comboTimer: 0,
            highestCombo: 1,
            moveSpeed: 1.0,
            gravitonForce: 0.18,
            magnetRadius: 0,
            empShocks: 0,
            activeItems: [],
            augments: [],
        });
        setItemDrops([]);
        setVoidHazards([]);
        setShearGates([]);

        // Initial materialization of kinetic physics objects on start
        const initialObjs: SolidPhysicsObjectData[] = Array.from({ length: 5 }).map((_, i) => {
            const types: ('sphere' | 'box' | 'torus')[] = ['sphere', 'box', 'torus'];
            const randomType = types[i % types.length];
            const hue = (i * 72) % 360;
            const tempCol = new THREE.Color().setHSL(hue / 360, 0.9, 0.5);
            return {
                id: generateUniqueId(`init_${i}`),
                type: randomType,
                position: [(Math.random() - 0.5) * 40, 12 + i * 2, (Math.random() - 0.5) * 40],
                size: 1.8 + Math.random() * 1.2,
                hue,
                colorHex: '#' + tempCol.getHexString(),
                mass: 12 + Math.random() * 8
            };
        });
        setSolidObjects(initialObjs);
        setGameState('playing');
    };

    const spawnSolidObject = (customPos?: [number, number, number], notify: boolean = false) => {
        handleUserInteraction();
        const types: ('sphere' | 'box' | 'torus')[] = ['sphere', 'box', 'torus'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const hue = Math.floor(Math.random() * 360);
        
        const tempCol = new THREE.Color().setHSL(hue / 360, 0.9, 0.5);
        const colorHex = '#' + tempCol.getHexString();

        const spawnPos: [number, number, number] = customPos 
            ? customPos
            : (new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z)
                ? [new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).x + (Math.random() - 0.5) * 16, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).y + 12 + Math.random() * 6, new THREE.Vector3(gameRefs.locusPos.x, 5, gameRefs.locusPos.z).z + (Math.random() - 0.5) * 16]
                : [(Math.random() - 0.5) * 50, 18, (Math.random() - 0.5) * 50]);

        const newObj: SolidPhysicsObjectData = {
            id: generateUniqueId('solid'),
            type: randomType,
            position: spawnPos,
            size: 1.8 + Math.random() * 1.5,
            hue,
            colorHex,
            mass: 10 + Math.random() * 10
        };

        setSolidObjects(prev => [...prev.slice(-15), newObj]);
        soundEngine.playSolidImpactSound(2.5, hue);

        if (notify) {
            triggerFloatingText('📦 QUANTUM KINETIC OBJECT MATERIALIZED!', 'text-amber-300 font-bold');
        }
    };

    useEffect(() => {
        const handleSupernova = () => {
            setSupernovaFlash(true);
            setTimeout(() => setSupernovaFlash(false), 800);
        };

        const onKeyDown = (e: KeyboardEvent) => { 
            if (e.key.toLowerCase() === 'r' || e.code === 'KeyR') {
                triggerManualChronoRewind();
            }
        };

        window.addEventListener('supernova-detonation', handleSupernova);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('supernova-detonation', handleSupernova);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    // Continuous World Item & Kinetic Object Replenishment for extended gameplay
    useEffect(() => {
        if (gameState !== 'playing' || isGamePaused) return;

        const interval = setInterval(() => {
            setItemDrops(prev => {
                if (prev.length < 6) {
                    const i = prev.length;
                    const newDrop: CyberItemDrop = {
                        id: generateUniqueId(`drop_respawn_${Date.now()}_${i}`),
                        type: (['shield', 'multiplier', 'emp', 'magnet', 'nanite'] as const)[Math.floor(Math.random() * 5)],
                        position: [(Math.random() - 0.5) * 40, 10 + Math.random() * 4, (Math.random() - 0.5) * 40],
                        createdAt: Date.now(),
                        size: 1.5,
                        chargeLevel: 1.0,
                    };
                    return [...prev, newDrop];
                }
                return prev;
            });

            setSolidObjects(prev => {
                if (prev.length < 5) {
                    const types: ('sphere' | 'box' | 'torus')[] = ['sphere', 'box', 'torus'];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    const hue = Math.floor(Math.random() * 360);
                    const tempCol = new THREE.Color().setHSL(hue / 360, 0.9, 0.5);
                    const newObj: SolidPhysicsObjectData = {
                        id: generateUniqueId(`solid_respawn_${Date.now()}`),
                        type: randomType,
                        position: [(Math.random() - 0.5) * 36, 12 + Math.random() * 6, (Math.random() - 0.5) * 36],
                        size: 1.8 + Math.random() * 1.5,
                        hue,
                        colorHex: '#' + tempCol.getHexString(),
                        mass: 10 + Math.random() * 10
                    };
                    return [...prev, newObj];
                }
                return prev;
            });
        }, 3500);

        return () => clearInterval(interval);
    }, [gameState, isGamePaused]);

    const handlePointerLocus = (pos: THREE.Vector3 | null, isPulling: boolean, isMoving: boolean = false, moveVel: number = 0) => {
        locusPosRef.current = pos;
        setLocusData(prev => {
            if (
                prev.isPulling === isPulling &&
                prev.isMoving === isMoving &&
                Math.abs(prev.moveVel - moveVel) < 0.12 &&
                (prev.pos === pos || (prev.pos && pos && prev.pos.distanceToSquared(pos) < 0.4))
            ) {
                return prev;
            }
            return { pos, isPulling, isMoving, moveVel };
        });
    };

    const toggleAudio = () => {
        handleUserInteraction();
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
    };

    const handleGestureStart = (e: React.PointerEvent | React.TouchEvent) => {
        if (isGamePaused) return;
        handleUserInteraction();

        // If in joystick mode, App level gesture handler only initializes sound/interaction
        // but doesn't handle gravity tilt to avoid conflict
        if (gestureControlMode === 'joystick') return;

        setLocusData(prev => ({ ...prev, isPulling: true }));

        if (gestureControlMode === 'off') return;

        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.PointerEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.PointerEvent).clientY;

        gestureRef.current.startX = clientX;
        gestureRef.current.startY = clientY;
        gestureRef.current.active = true;
        gestureRef.current.lastQuadrant = -1;

        triggerHapticFeedback(12);
    };

    const handleGestureMove = (e: React.PointerEvent | React.TouchEvent) => {
        if (isGamePaused || gestureControlMode === 'joystick') return;
        if (!gestureRef.current.active || gestureControlMode === 'off') return;
        const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.PointerEvent).clientX;
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.PointerEvent).clientY;

        const dx = clientX - gestureRef.current.startX;
        const dy = clientY - gestureRef.current.startY;

        const maxPx = 65;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mag = Math.min(1.0, dist / maxPx);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const targetGx = Math.max(-14, Math.min(14, (dx / maxPx) * 14.0));
        const targetGz = Math.max(-14, Math.min(14, (dy / maxPx) * 14.0));

        gestureRef.current.gx = targetGx;
        gestureRef.current.gz = targetGz;

        const quadrant = Math.floor((angle + 180) / 90);
        if (quadrant !== gestureRef.current.lastQuadrant && mag > 0.35) {
            gestureRef.current.lastQuadrant = quadrant;
            triggerHapticFeedback(14);
        }

        setGestureVector({
            dx,
            dy,
            gx: targetGx,
            gz: targetGz,
            angle,
            magnitude: mag,
            active: true,
        });
    };

    const handleGestureEnd = () => {
        if (gestureControlMode !== 'joystick') {
            setLocusData(prev => ({ ...prev, isPulling: false }));
        }
        if (!gestureRef.current.active) return;
        gestureRef.current.active = false;
        triggerHapticFeedback(10);

        setGestureVector(prev => ({ ...prev, active: false }));
    };

    return (
        <div 
            className="relative w-full h-screen bg-slate-950 overflow-hidden touch-none selection:bg-transparent font-sans cursor-crosshair"
            onClick={handleUserInteraction}
            onPointerDown={handleGestureStart}
            onPointerMove={handleGestureMove}
            onPointerUp={handleGestureEnd}
            onPointerCancel={handleGestureEnd}
            onTouchStart={handleGestureStart}
            onTouchMove={handleGestureMove}
            onTouchEnd={handleGestureEnd}
        >
            <Canvas
                dpr={[1, 1.1]}
                gl={{ antialias: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
                shadows={false}
                camera={{ position: [0, 45, 75], fov: warpActive ? 120 : 45 }}
            >
                <ResponsiveCameraRig cameraShake={cameraShake} />
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 80, 450]} />

                <ShieldImpactSparks impactEvent={shieldImpactEvent} />

                <FractalSingularity 
                    mode={sectorLevel === 1 ? 'neuralIgnition' : sectorLevel === 2 ? 'chronos' : sectorLevel === 3 ? 'quantumRelay' : sectorLevel === 4 ? 'xenon' : sectorLevel === 5 ? 'planetaryGearbox' : sectorLevel === 6 ? 'hyperArcConduit' : sectorLevel === 7 ? 'hydraFractalCore' : sectorLevel === 8 ? 'aetherHarmonic' : sectorLevel === 9 ? 'riemannianFold' : sectorLevel === 10 ? 'chronosOmni' : fractalMode}
                    combo={playerStats.combo}
                    isPulling={locusData.isPulling}
                    speed={playerStats.moveSpeed}
                    impactPulse={impactPulse}
                    activeHazardCount={voidHazards.length}
                    timeScale={temporalState.timeScale}
                    isRewinding={temporalState.isRewinding}
                    locusPos={locusData.pos}
                    onAlignSatellites={handleAlignSatellites}
                    isPaused={isGamePaused}
                    subsystem1Power={machineSubsystems.s1Power}
                    subsystem2Power={machineSubsystems.s2Power}
                    subsystem3Power={machineSubsystems.s3Power}
                    isShieldActive={sectorProgress.isShieldActive}
                />

                <MasterMachineAperture 
                    active={machineSubsystems.isAllPartsMoving}
                    onBreachSuccess={handleMasterMachineBreach}
                    onBreachBlocked={handleMasterMachineBlocked}
                    protagonistPosRef={locusPosRef}
                    isPaused={isGamePaused}
                />

                <CyberItemsAndHazards 
                    items={itemDrops}
                    hazards={voidHazards}
                    gates={shearGates}
                    locusPos={locusData.pos}
                    isPulling={locusData.isPulling}
                    isMoving={locusData.isMoving}
                    magnetRadius={playerStats.magnetRadius}
                    timeScale={temporalState.timeScale}
                    isRewinding={temporalState.isRewinding}
                    isPaused={isGamePaused}
                    onCollectItem={handleCollectItem}
                    onHazardHit={handleHazardHit}
                    onGatePass={handleGatePass}
                />

                <GroundChargerRings 
                    rings={groundRings}
                    locusPos={locusData.pos}
                    onChargePlayer={handleChargePlayerAmmo}
                    isPaused={isGamePaused}
                />

                <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} paused={isGamePaused}>
                    <FusionSwarmScene 
                        gravityTilt={[0, -9.81, 0]}
                                                onNodeAbsorbed={handleNodeAbsorbed}
                        isPaused={isGamePaused}
                    />
                    <SolidPhysicsObjects 
                        objects={solidObjects} 
                                                onObjectRammed={handleObjectRammed}
                        onKineticSling={handleKineticSling} 
                        onCoreImpact={handleCoreImpact}
                        isPaused={isGamePaused}
                        subsystem3Power={machineSubsystems.s3Power}
                        isShieldActive={sectorProgress.isShieldActive}
                    />
                    <InteractiveLocus 
                        onPointerMove={handlePointerLocus} 
                        moveSpeedMultiplier={playerStats.moveSpeed}
                        onProtagonistCollision={handleObjectRammed}
                        onOuterOrbitDamage={handlePlayerOuterOrbitDamage}
                        onShieldViolentImpact={handleShieldViolentImpact}
                        isPaused={isGamePaused}
                        subsystem3Power={machineSubsystems.s3Power}
                        isShieldActive={sectorProgress.isShieldActive}
                        joystickVectorRef={joystickVectorRef}
                        gestureRef={gestureRef}
                        gestureControlMode={gestureControlMode}
                    />
                </Physics>

                {/* EffectComposer disabled for emergency hardware stabilization */}
            </Canvas>

            <AnimatePresence>
                {supernovaFlash && (
                    <motion.div 
                        initial={{ opacity: 0.9 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 bg-amber-100 mix-blend-screen pointer-events-none z-30"
                    />
                )}
                {shieldImpactFlash && (
                    <motion.div 
                        initial={{ opacity: 1, scale: 0.97 }}
                        animate={{ opacity: 0, scale: 1.05 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.38, ease: "easeOut" }}
                        className="absolute inset-0 border-[16px] border-rose-600 bg-rose-500/25 shadow-[inset_0_0_140px_rgba(244,63,94,0.95)] mix-blend-screen pointer-events-none z-40 flex items-center justify-center"
                    >
                        <div className="text-rose-400 font-black text-2xl sm:text-4xl tracking-widest uppercase drop-shadow-[0_0_25px_rgba(244,63,94,1)] animate-ping px-4 text-center">
                            ⚡ VIOLENT SHIELD DEFLECTION ⚡
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PERSISTENT TOP NOTIFICATION BANNER (DIRECTLY BENEATH TOP HUD ICONS) */}
            <AnimatePresence>
                {levelUpBanner ? (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.92 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                        className="absolute top-11 md:top-14 left-2 right-2 md:left-3 md:right-3 z-30 pointer-events-none flex justify-center font-mono"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-3.5 md:py-1.5 rounded-full bg-slate-950/95 border border-amber-400/80 shadow-2xl shadow-amber-500/25 text-amber-300 backdrop-blur-md max-w-full overflow-hidden">
                            <div className="p-1 rounded-full bg-amber-500/20 border border-amber-400/50 shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-amber-300 shrink-0">
                                LV.0{levelUpBanner.level} OVERCLOCK INSTALLED:
                            </span>
                            <span className="text-[10px] md:text-xs font-bold text-white truncate">
                                {levelUpBanner.augName}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-amber-200 font-mono shrink-0 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold">
                                {levelUpBanner.boost}
                            </span>
                        </div>
                    </motion.div>
                ) : activeResonanceState ? (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-11 md:top-14 left-2 right-2 md:left-3 md:right-3 z-30 pointer-events-none flex justify-center font-mono"
                    >
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950/75 border border-slate-800 text-[10px] md:text-xs font-bold text-slate-300 backdrop-blur-sm">
                            <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>{activeResonanceState}</span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-col items-center justify-center">
                <AnimatePresence>
                    {floatingPoints.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 1, y: 0, scale: 1 }}
                            animate={{ opacity: 0, y: -60, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className={`font-mono text-base md:text-xl font-black drop-shadow-lg ${p.color}`}
                        >
                            {p.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>



            {/* TOP MINIMALIST SYMBOL & VALUE HUD */}
            <div className="absolute top-2 left-2 right-2 md:top-3 md:left-3 md:right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-1.5 md:gap-2 font-mono">
                {/* Left Pill Group: Symbols & Values */}
                <div className="flex flex-wrap items-center gap-1 md:gap-1.5 pointer-events-auto">
                    {/* Interactive Sector Objective HUD Pill */}
                    {gameState === 'playing' && (
                        <SectorObjectiveHUD 
                            sectorDef={currentSectorDef}
                            sectorProgress={sectorProgress}
                            coreIntegrity={playerStats.coreIntegrity}
                            onOpenBriefing={() => setIsSectorBriefingOpen(true)}
                            subsystem1Power={machineSubsystems.s1Power}
                            subsystem2Power={machineSubsystems.s2Power}
                            subsystem3Power={machineSubsystems.s3Power}
                            subsystem4Power={machineSubsystems.s4Power}
                        />
                    )}

                    {/* Core Integrity Symbol */}
                    <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-rose-500/50 shadow-lg text-[10px] md:text-xs font-bold text-rose-400 backdrop-blur-md">
                        <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-500 animate-pulse fill-rose-500" />
                        <span>{Math.round(playerStats.coreIntegrity)}%</span>
                    </div>

                    {/* Nano Shield Symbol */}
                    <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-sky-500/50 shadow-lg text-[10px] md:text-xs font-bold text-sky-400 backdrop-blur-md">
                        <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-400 fill-sky-400/30" />
                        <span>{Math.round(playerStats.shield)}%</span>
                    </div>

                    {/* Level & XP Symbol */}
                    <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-amber-500/50 shadow-lg text-[10px] md:text-xs font-bold text-amber-300 backdrop-blur-md">
                        <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 fill-amber-400" />
                        <span>Lv.{playerStats.level}</span>
                    </div>

                    {/* Score Symbol */}
                    <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-amber-400/60 shadow-lg text-[10px] md:text-xs font-black text-amber-400 backdrop-blur-md">
                        <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                        <span>{playerStats.score.toLocaleString()}</span>
                    </div>

                    {/* Temporal Speed Symbol */}
                    <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-cyan-500/50 shadow-lg text-[10px] md:text-xs font-bold text-cyan-200 backdrop-blur-md">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: temporalState.timeScale === 0.25 ? '8s' : '3s' }} />
                        <span>{temporalState.isRewinding ? '↺ REWIND' : temporalState.timeScale + 'x'}</span>
                    </div>
                </div>

                {/* Right Group: Action Icon Buttons */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => {
                            handleUserInteraction();
                            triggerManualChronoRewind();
                            triggerHapticFeedback([40, 20, 60]);
                        }}
                        className={`px-2.5 py-1 rounded-full border transition-all backdrop-blur shadow-lg cursor-pointer flex items-center gap-1 text-[10px] md:text-xs font-black ${
                            temporalState.isRewinding 
                                ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 animate-pulse shadow-emerald-500/40' 
                                : temporalState.chronoEnergy >= 100
                                    ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 hover:bg-emerald-600/30 shadow-emerald-500/20 shadow-[0_0_12px_#34d399]'
                                    : 'bg-slate-950/80 border-slate-700/60 text-slate-500 opacity-60'
                        }`}
                        title="Trigger Manual Chrono Rewind (Requires 100% Energy - Key R)"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{temporalState.isRewinding ? '↺ REWINDING' : `REWIND [R] (${Math.round(temporalState.chronoEnergy)}%)`}</span>
                    </button>

                    <button 
                        onClick={() => {
                            handleUserInteraction();
                            setGestureControlMode(prev => prev === 'swipe' ? 'joystick' : prev === 'joystick' ? 'off' : 'swipe');
                            triggerHapticFeedback(20);
                        }}
                        className={`p-1.5 rounded-full border transition-all backdrop-blur shadow-lg cursor-pointer ${
                            gestureControlMode !== 'off' 
                                ? 'bg-amber-950/85 border-amber-400/60 text-amber-300 hover:bg-amber-500/30 shadow-amber-500/20' 
                                : 'bg-slate-950/85 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                        title={`Mobile Gesture Mode: ${gestureControlMode.toUpperCase()}`}
                    >
                        <Compass className="w-3.5 h-3.5" />
                    </button>

                    <button 
                        onClick={() => setShowQuantumVault(true)}
                        className="p-1.5 rounded-full bg-slate-950/85 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 transition-all backdrop-blur shadow-lg cursor-pointer flex items-center gap-1 px-2.5"
                        title="Quantum Vault & Cyber-Store"
                    >
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-black hidden sm:inline">VAULT</span>
                    </button>

                    <button 
                        onClick={() => setShowLoreBriefing(true)}
                        className="p-1.5 rounded-full bg-slate-950/85 border border-indigo-400/50 text-indigo-300 hover:bg-indigo-500/30 transition-all backdrop-blur shadow-lg cursor-pointer flex items-center gap-1 px-2.5"
                        title="Lore Briefing & Archives"
                    >
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black hidden sm:inline">LORE</span>
                    </button>

                    <button 
                        onClick={() => setShowLeaderboard(true)}
                        className="p-1.5 rounded-full bg-slate-950/85 border border-sky-400/50 text-sky-300 hover:bg-sky-500/30 transition-all backdrop-blur shadow-lg cursor-pointer"
                        title="Leaderboards"
                    >
                        <Trophy className="w-3.5 h-3.5 text-sky-400" />
                    </button>

                    <button 
                        onClick={toggleAudio}
                        className="p-1.5 rounded-full bg-slate-950/85 border border-slate-700/60 text-slate-200 hover:text-amber-400 hover:border-amber-400/50 transition-all backdrop-blur cursor-pointer"
                        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                    </button>
                </div>
            </div>

            {/* MOBILE GESTURE GRAVITY HOLOGRAPHIC COMPASS HUD */}
            <MobileGestureGravityHUD 
                gestureVector={gestureVector}
                gestureControlMode={gestureControlMode}
                onToggleMode={() => {
                    handleUserInteraction();
                    setGestureControlMode(prev => prev === 'swipe' ? 'joystick' : prev === 'joystick' ? 'off' : 'swipe');
                    triggerHapticFeedback(20);
                }}
                gravityTilt={[0, -9.81, 0]}
            />

            <Joystick
                visible={gestureControlMode === 'joystick'}
                sharedVectorRef={joystickVectorRef}
                onMove={(gx, gz, active) => {
                    gestureRef.current.gx = gx;
                    gestureRef.current.gz = gz;
                    gestureRef.current.active = active;

                    // Only update state if pulling status changes to prevent redundant re-renders
                    setLocusData(prev => {
                        if (prev.isPulling === active) return prev;
                        return { ...prev, isPulling: active };
                    });
                }}
            />

            <AnimatePresence>
                {showTutorialHint && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-56 right-12 z-50 pointer-events-none"
                    >
                        <div className="px-4 py-2 rounded-xl bg-amber-500/90 border border-white text-slate-950 font-black text-xs animate-bounce shadow-2xl">
                            HOLD JOYSTICK TO PULL NODES
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPACT MOBILE-FRIENDLY ACTIVE MODULES STATUS BAR WITH SYMBOLS ONLY */}
            {playerStats.augments.length > 0 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 font-mono pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl text-xs max-w-[94vw] overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1 text-[10px] font-black text-amber-400 shrink-0 pr-1.5 border-r border-slate-800/80" title={`Active Modules (${playerStats.augments.length})`}>
                        <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-300">{playerStats.augments.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {Object.entries(
                            playerStats.augments.reduce<Record<string, number>>((acc, name) => {
                                acc[name] = (acc[name] || 0) + 1;
                                return acc;
                            }, {})
                        ).map(([name, count]) => {
                            const meta = getAugmentMeta(name);
                            const IconComp = meta.icon;
                            return (
                                <span 
                                    key={name} 
                                    title={name}
                                    className={`px-2 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md cursor-help ${meta.badgeClass}`}
                                >
                                    <span className="text-xs leading-none">{meta.symbol}</span>
                                    <IconComp className="w-3.5 h-3.5" />
                                    {count > 1 && (
                                        <span className="px-1 py-0.2 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[9px] font-black">
                                            x{count}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SECTOR BRIEFING MODAL */}
            <React.Suspense fallback={null}>

</React.Suspense></div>
    );
}
