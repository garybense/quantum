import React from 'react';
import { Heart, Shield, Zap, Trophy, Clock, RotateCcw } from 'lucide-react';
import { useSessionStore } from '../game/sessionStore';

export function CoreHUD() {
    const coreIntegrity = useSessionStore(s => s.coreIntegrity);
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-rose-500/50 shadow-lg text-[10px] md:text-xs font-bold text-rose-400 backdrop-blur-md">
            <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-500 animate-pulse fill-rose-500" />
            <span>{Math.round(coreIntegrity)}%</span>
        </div>
    );
}

export function ShieldHUD() {
    const shield = useSessionStore(s => s.shield);
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-sky-500/50 shadow-lg text-[10px] md:text-xs font-bold text-sky-400 backdrop-blur-md">
            <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-400 fill-sky-400/30" />
            <span>{Math.round(shield)}%</span>
        </div>
    );
}

export function LevelHUD() {
    const level = useSessionStore(s => s.level);
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-amber-500/50 shadow-lg text-[10px] md:text-xs font-bold text-amber-300 backdrop-blur-md">
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400 fill-amber-400" />
            <span>Lv.{level}</span>
        </div>
    );
}

export function ScoreHUD() {
    const score = useSessionStore(s => s.score);
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-amber-400/60 shadow-lg text-[10px] md:text-xs font-black text-amber-400 backdrop-blur-md">
            <Trophy className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
            <span>{score.toLocaleString()}</span>
        </div>
    );
}

export function TimeScaleHUD() {
    const timeScaleLabel = useSessionStore(s => s.timeScaleLabel);
    const isRewinding = timeScaleLabel.includes('REWIND');
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-slate-950/85 border border-cyan-500/50 shadow-lg text-[10px] md:text-xs font-bold text-cyan-200 backdrop-blur-md">
            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: timeScaleLabel.includes('0.25') || timeScaleLabel.includes('0.5') ? '8s' : '3s' }} />
            <span>{isRewinding ? '↺ REWIND' : timeScaleLabel}</span>
        </div>
    );
}

export function RewindButtonHUD({
    onTriggerRewind,
    onUserInteraction,
}: {
    onTriggerRewind: () => void;
    onUserInteraction: () => void;
}) {
    const chronoEnergy = useSessionStore(s => s.chronoEnergy);
    const timeScaleLabel = useSessionStore(s => s.timeScaleLabel);
    const isRewinding = timeScaleLabel.includes('REWIND');

    return (
        <button
            onClick={() => {
                onUserInteraction();
                onTriggerRewind();
            }}
            className={`px-2.5 py-1 rounded-full border transition-all backdrop-blur shadow-lg cursor-pointer flex items-center gap-1 text-[10px] md:text-xs font-black ${
                isRewinding
                    ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 animate-pulse shadow-emerald-500/40'
                    : chronoEnergy >= 100
                        ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 hover:bg-emerald-600/30 shadow-emerald-500/20 shadow-[0_0_12px_#34d399]'
                        : 'bg-slate-950/80 border-slate-700/60 text-slate-500 opacity-60'
            }`}
            title="Trigger Manual Chrono Rewind (Requires 100% Energy - Key R)"
        >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRewinding ? '↺ REWINDING' : `REWIND [R] (${Math.round(chronoEnergy)}%)`}</span>
        </button>
    );
}
