import React, { useRef, useEffect, useCallback } from 'react';
import { gameRefs } from '../game/refs';
import { simState } from '../game/state';
import { launchOrbiter } from '../game/systems/orbit';

interface TouchControlsProps {
    onRewind?: () => void;
    onPerfectRelease?: (x: number, z: number) => void;
}

export function TouchControls({ onRewind, onPerfectRelease }: TouchControlsProps) {
    const stickBaseRef = useRef<HTMLDivElement>(null);
    const thumbstickRef = useRef<HTMLDivElement>(null);
    const activeGlowRef = useRef<HTMLDivElement>(null);
    const slingButtonRef = useRef<HTMLDivElement>(null);

    // Pointer ID tracking for multi-touch safety
    const stickPointerIdRef = useRef<number | null>(null);
    const slingPointerIdRef = useRef<number | null>(null);

    const stickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pressStartTimeRef = useRef<number>(0);
    const lastFireTimeRef = useRef<number>(0);

    // Keyboard state tracking
    const keysPressedRef = useRef<{ W: boolean; A: boolean; S: boolean; D: boolean }>({
        W: false,
        A: false,
        S: false,
        D: false,
    });

    const triggerHaptic = useCallback((pattern: number | number[]) => {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }, []);

    const fireOneOrbiter = useCallback(() => {
        const now = performance.now();
        if (now - lastFireTimeRef.current < 90) return;

        // Find newest orbiter (highest slot index occupied)
        let targetSlot = -1;
        for (let i = simState.orbitSlots.length - 1; i >= 0; i--) {
            if (simState.orbitSlots[i].occupied) {
                targetSlot = i;
                break;
            }
        }

        if (targetSlot >= 0) {
            const launched = launchOrbiter(simState, targetSlot);
            if (launched) {
                lastFireTimeRef.current = now;
                if (launched.isCrit) {
                    if (onPerfectRelease) onPerfectRelease(launched.x, launched.z);
                } else {
                    triggerHaptic([20, 10, 20]);
                }
            }
        }
    }, [triggerHaptic, onPerfectRelease]);

    // Handle stick move DOM updates
    const updateStickPosition = useCallback((clientX: number, clientY: number) => {
        if (!stickBaseRef.current || !thumbstickRef.current) return;

        const maxRadius = 60; // Max radius for stick drag
        const deltaX = clientX - stickOriginRef.current.x;
        const deltaY = clientY - stickOriginRef.current.y;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const constrainedDistance = Math.min(distance, maxRadius);

        const angle = Math.atan2(deltaY, deltaX);
        const x = Math.cos(angle) * constrainedDistance;
        const y = Math.sin(angle) * constrainedDistance;

        // Direct DOM update for thumbstick position
        thumbstickRef.current.style.transform = `translate(${x}px, ${y}px)`;

        // Deadzone 0.05
        const normalizedDistance = constrainedDistance / maxRadius;
        if (normalizedDistance < 0.05) {
            gameRefs.joystickVector.gx = 0;
            gameRefs.joystickVector.gz = 0;
            gameRefs.joystickVector.active = true;
            return;
        }

        const adjustedDistance = (normalizedDistance - 0.05) / 0.95;
        // Direction vectors: gx (X axis), gz (Z axis / Y in screen space)
        const gx = Math.cos(angle) * adjustedDistance;
        const gz = Math.sin(angle) * adjustedDistance;

        gameRefs.joystickVector.gx = gx;
        gameRefs.joystickVector.gz = gz;
        gameRefs.joystickVector.active = true;
    }, []);

    const resetStick = useCallback(() => {
        stickPointerIdRef.current = null;
        gameRefs.joystickVector.active = false;
        gameRefs.joystickVector.gx = 0;
        gameRefs.joystickVector.gz = 0;

        if (stickBaseRef.current) {
            stickBaseRef.current.style.display = 'none';
        }
        if (thumbstickRef.current) {
            thumbstickRef.current.style.transform = `translate(0px, 0px)`;
        }
    }, []);

    // Pointer events on window for stick and sling
    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            // Check if user touched the sling button element or its bounds
            const slingElem = slingButtonRef.current;
            if (slingElem) {
                const rect = slingElem.getBoundingClientRect();
                if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                ) {
                    // Sling button hit!
                    slingPointerIdRef.current = e.pointerId;
                    gameRefs.isPulling = true;
                    pressStartTimeRef.current = performance.now();
                    triggerHaptic(15);
                    if (slingElem) {
                        slingElem.style.transform = 'scale(0.92)';
                        slingElem.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                    }
                    return;
                }
            }

            // Left 65% of screen spawns dynamic virtual stick
            if (e.clientX <= window.innerWidth * 0.65) {
                if (stickPointerIdRef.current !== null) return; // Already tracking a stick touch

                stickPointerIdRef.current = e.pointerId;
                stickOriginRef.current = { x: e.clientX, y: e.clientY };

                if (stickBaseRef.current) {
                    stickBaseRef.current.style.display = 'flex';
                    stickBaseRef.current.style.left = `${e.clientX - 60}px`;
                    stickBaseRef.current.style.top = `${e.clientY - 60}px`;
                }

                if (thumbstickRef.current) {
                    thumbstickRef.current.style.transform = `translate(0px, 0px)`;
                }

                gameRefs.joystickVector.active = true;
                gameRefs.joystickVector.gx = 0;
                gameRefs.joystickVector.gz = 0;
                triggerHaptic(10);
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerId === stickPointerIdRef.current) {
                updateStickPosition(e.clientX, e.clientY);
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (e.pointerId === stickPointerIdRef.current) {
                resetStick();
            }

            if (e.pointerId === slingPointerIdRef.current) {
                slingPointerIdRef.current = null;
                gameRefs.isPulling = false;

                if (slingButtonRef.current) {
                    slingButtonRef.current.style.transform = 'scale(1)';
                    slingButtonRef.current.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }

                fireOneOrbiter();
            }
        };

        const handlePointerCancel = (e: PointerEvent) => {
            if (e.pointerId === stickPointerIdRef.current) {
                resetStick();
            }

            if (e.pointerId === slingPointerIdRef.current) {
                slingPointerIdRef.current = null;
                gameRefs.isPulling = false;

                if (slingButtonRef.current) {
                    slingButtonRef.current.style.transform = 'scale(1)';
                    slingButtonRef.current.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };
    }, [updateStickPosition, resetStick, fireOneOrbiter, triggerHaptic]);

    // Keyboard Controls handler
    useEffect(() => {
        const updateKeyboardVector = () => {
            const keys = keysPressedRef.current;
            let gx = 0;
            let gz = 0;

            if (keys.W) gz -= 1;
            if (keys.S) gz += 1;
            if (keys.A) gx -= 1;
            if (keys.D) gx += 1;

            if (gx !== 0 && gz !== 0) {
                const len = Math.sqrt(gx * gx + gz * gz);
                gx /= len;
                gz /= len;
            }

            const active = keys.W || keys.A || keys.S || keys.D;
            if (stickPointerIdRef.current === null) {
                gameRefs.joystickVector.gx = gx;
                gameRefs.joystickVector.gz = gz;
                gameRefs.joystickVector.active = active;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toUpperCase();

            if (key === 'W' || e.key === 'ArrowUp') { keysPressedRef.current.W = true; updateKeyboardVector(); }
            if (key === 'S' || e.key === 'ArrowDown') { keysPressedRef.current.S = true; updateKeyboardVector(); }
            if (key === 'A' || e.key === 'ArrowLeft') { keysPressedRef.current.A = true; updateKeyboardVector(); }
            if (key === 'D' || e.key === 'ArrowRight') { keysPressedRef.current.D = true; updateKeyboardVector(); }

            if (e.code === 'Space') {
                e.preventDefault();
                gameRefs.isPulling = true;
                pressStartTimeRef.current = performance.now();
                if (slingButtonRef.current) {
                    slingButtonRef.current.style.transform = 'scale(0.92)';
                    slingButtonRef.current.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                }
            }

            if (key === 'R') {
                if (onRewind) onRewind();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();

            if (key === 'W' || e.key === 'ArrowUp') { keysPressedRef.current.W = false; updateKeyboardVector(); }
            if (key === 'S' || e.key === 'ArrowDown') { keysPressedRef.current.S = false; updateKeyboardVector(); }
            if (key === 'A' || e.key === 'ArrowLeft') { keysPressedRef.current.A = false; updateKeyboardVector(); }
            if (key === 'D' || e.key === 'ArrowRight') { keysPressedRef.current.D = false; updateKeyboardVector(); }

            if (e.code === 'Space') {
                e.preventDefault();
                gameRefs.isPulling = false;
                if (slingButtonRef.current) {
                    slingButtonRef.current.style.transform = 'scale(1)';
                    slingButtonRef.current.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }
                fireOneOrbiter();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [fireOneOrbiter, onRewind]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 select-none overflow-hidden touch-none">
            {/* Dynamic Virtual Stick (Spawns under finger on left 65% of screen) */}
            <div
                ref={stickBaseRef}
                className="fixed w-30 h-30 -ml-15 -mt-15 rounded-full bg-slate-950/40 border-2 border-cyan-500/30 backdrop-blur-sm flex items-center justify-center pointer-events-none will-change-transform"
                style={{ display: 'none', width: '120px', height: '120px', marginLeft: '-60px', marginTop: '-60px' }}
            >
                {/* Active Glow */}
                <div
                    ref={activeGlowRef}
                    className="absolute inset-0 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.4)] pointer-events-none"
                />

                {/* Decorative inner UI rings */}
                <div className="absolute inset-3 rounded-full border border-cyan-500/10" />
                <div className="absolute inset-6 rounded-full border border-cyan-500/10" />

                {/* Visual center crosshair */}
                <div className="absolute w-full h-[1px] bg-cyan-500/20" />
                <div className="absolute h-full w-[1px] bg-cyan-500/20" />

                {/* Thumbstick */}
                <div
                    ref={thumbstickRef}
                    className="w-12 h-12 rounded-full flex items-center justify-center border border-cyan-300/50 bg-cyan-500/30 shadow-lg will-change-transform z-10"
                >
                    <div className="w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>
            </div>

            {/* SLING Button (Right thumb zone, hit target >=72px: 80px / w-20 h-20) */}
            <div className="absolute bottom-8 right-8 pointer-events-auto flex flex-col items-center gap-1">
                <div
                    ref={slingButtonRef}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/60 border-2 border-rose-500/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.25)] transition-transform duration-75 active:scale-95 touch-none"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                        <span className="font-mono text-xs sm:text-sm font-black text-white tracking-widest uppercase drop-shadow">
                            SLING
                        </span>
                    </div>
                </div>
                <span className="font-mono text-[9px] text-rose-400/70 uppercase tracking-wider font-bold">
                    Hold/Release
                </span>
            </div>
        </div>
    );
}
