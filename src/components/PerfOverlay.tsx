import React, { useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

export function RenderPerfStats() {
    const { gl } = useThree();
    const [stats, setStats] = useState({ fps: 60, calls: 0, triangles: 0 });
    const framesRef = useRef(0);
    const lastTimeRef = useRef(performance.now());

    useFrame(() => {
        framesRef.current++;
        const now = performance.now();
        if (now - lastTimeRef.current >= 500) {
            const fps = Math.round((framesRef.current * 1000) / (now - lastTimeRef.current));
            const calls = gl.info.render.calls;
            const triangles = gl.info.render.triangles;
            setStats({ fps, calls, triangles });
            framesRef.current = 0;
            lastTimeRef.current = now;
        }
    });

    const isDev = (import.meta as any).env?.DEV;
    if (!isDev) return null;

    return (
        <div className="fixed bottom-2 left-2 z-50 bg-slate-950/90 border border-emerald-500/60 text-emerald-400 font-mono text-[10px] px-2.5 py-1 rounded-md shadow-lg pointer-events-none flex gap-3">
            <span>FPS: {stats.fps}</span>
            <span>CALLS: {stats.calls}</span>
            <span>TRIS: {stats.triangles.toLocaleString()}</span>
        </div>
    );
}
