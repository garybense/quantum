import React, { useRef, useState, useEffect, useCallback } from 'react';

interface JoystickProps {
    onMove: (gx: number, gz: number, active: boolean) => void;
    visible: boolean;
    sharedVectorRef: React.MutableRefObject<{ gx: number; gz: number; active: boolean }>;
}

export function Joystick({ onMove, visible, sharedVectorRef }: JoystickProps) {
    const [isInternalActive, setIsInternalActive] = useState(false);
    const baseRef = useRef<HTMLDivElement>(null);
    const thumbstickRef = useRef<HTMLDivElement>(null);
    const activeGlowRef = useRef<HTMLDivElement>(null);
    const lastActiveRef = useRef(false);

    // Helper for haptic feedback
    const triggerHaptic = useCallback((pattern: number | number[]) => {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }, []);

    const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        lastActiveRef.current = true;
        setIsInternalActive(true);
        sharedVectorRef.current.active = true;

        triggerHaptic(15);
        updatePosition(e);

        if (activeGlowRef.current) activeGlowRef.current.style.opacity = '1';
    };

    const handlePointerUp = useCallback(() => {
        lastActiveRef.current = false;
        setIsInternalActive(false);
        sharedVectorRef.current.active = false;
        sharedVectorRef.current.gx = 0;
        sharedVectorRef.current.gz = 0;

        if (thumbstickRef.current) {
            thumbstickRef.current.style.transform = `translate(0px, 0px)`;
        }
        if (activeGlowRef.current) activeGlowRef.current.style.opacity = '0';

        onMove(0, 0, false);
    }, [onMove, sharedVectorRef]);

    const updatePosition = useCallback((e: React.PointerEvent | React.TouchEvent | PointerEvent | TouchEvent) => {
        if (!baseRef.current || !lastActiveRef.current) return;

        const rect = baseRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let clientX, clientY;
        if ('touches' in e) {
            if (e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxRadius = rect.width / 2;
        const constrainedDistance = Math.min(distance, maxRadius);

        const angle = Math.atan2(deltaY, deltaX);
        const x = Math.cos(angle) * constrainedDistance;
        const y = Math.sin(angle) * constrainedDistance;

        // ZERO-LAG: Direct DOM Update for visual stick
        if (thumbstickRef.current) {
            thumbstickRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }

        // usability: Implement 5% deadzone for more immediate response
        const normalizedDistance = constrainedDistance / maxRadius;
        if (normalizedDistance < 0.05) {
            sharedVectorRef.current.gx = 0;
            sharedVectorRef.current.gz = 0;
            onMove(0, 0, true);
            return;
        }

        // Remap distance to account for deadzone (0.05 -> 1.0 becomes 0.0 -> 1.0)
        const adjustedDistance = (normalizedDistance - 0.05) / 0.95;

        // ZERO-LAG: Write directly to shared Ref for game engine access
        const gx = Math.cos(angle) * adjustedDistance * 12;
        const gz = Math.sin(angle) * adjustedDistance * 12;

        sharedVectorRef.current.gx = gx;
        sharedVectorRef.current.gz = gz;

        // Trigger React callback only for 'active' status changes (pulling logic)
        onMove(gx, gz, true);
    }, [onMove, sharedVectorRef]);

    useEffect(() => {
        if (!isInternalActive) return;

        const handleGlobalMove = (e: PointerEvent | TouchEvent) => {
            if (e.cancelable) e.preventDefault();
            updatePosition(e);
        };

        const handleGlobalUp = () => handlePointerUp();

        window.addEventListener('pointermove', handleGlobalMove as any, { passive: false });
        window.addEventListener('touchmove', handleGlobalMove as any, { passive: false });
        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('touchend', handleGlobalUp);
        window.addEventListener('touchcancel', handleGlobalUp);

        return () => {
            window.removeEventListener('pointermove', handleGlobalMove as any);
            window.removeEventListener('touchmove', handleGlobalMove as any);
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('touchend', handleGlobalUp);
            window.removeEventListener('touchcancel', handleGlobalUp);
        };
    }, [isInternalActive, updatePosition, handlePointerUp]);

    if (!visible) return null;

    return (
        <div className="absolute bottom-12 right-12 z-50 pointer-events-auto select-none">
            <div
                ref={baseRef}
                className={`relative w-40 h-40 rounded-full bg-slate-950/40 border-2 border-cyan-500/20 backdrop-blur-md flex items-center justify-center touch-none transition-colors duration-300 ${isInternalActive ? 'border-cyan-400/60 bg-slate-900/60' : ''}`}
                onPointerDown={handlePointerDown}
                onTouchStart={handlePointerDown}
            >
                {/* Active Glow - Direct Opacity control */}
                <div
                    ref={activeGlowRef}
                    className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.4)] opacity-0 transition-opacity duration-300 pointer-events-none"
                />

                {/* Decorative inner UI rings */}
                <div className={`absolute inset-4 rounded-full border border-cyan-500/5`} />
                <div className={`absolute inset-10 rounded-full border border-cyan-500/5`} />

                {/* Visual center crosshair */}
                <div className="absolute w-full h-[1px] bg-cyan-500/10" />
                <div className="absolute h-full w-[1px] bg-cyan-500/10" />

                {/* Thumbstick - Zero-Lag DOM Element */}
                <div
                    ref={thumbstickRef}
                    className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/30 bg-slate-800/80 shadow-lg will-change-transform z-10`}
                    style={{
                        background: isInternalActive ? 'linear-gradient(to bottom right, #22d3ee, #2563eb)' : '',
                        boxShadow: isInternalActive ? '0 0 25px rgba(6,182,212,0.6)' : ''
                    }}
                >
                    <div className={`w-5 h-5 rounded-full bg-white/40 ${isInternalActive ? 'animate-pulse' : ''}`} />
                </div>
            </div>

            <div className="text-center mt-2 font-mono text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">
                Direct Drive Link
            </div>
        </div>
    );
}
