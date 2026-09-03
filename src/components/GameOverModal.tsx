import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RotateCcw, Trophy, Award, Flame, Zap, Sparkles } from 'lucide-react';

interface GameOverModalProps {
    score: number;
    level: number;
    highestCombo: number;
    highScore: number;
    isNewHighScore: boolean;
    initialCallsign: string;
    onRestart: () => void;
    onSubmitScore: (callsign: string) => void;
}

export function GameOverModal({
    score,
    level,
    highestCombo,
    highScore,
    isNewHighScore,
    initialCallsign,
    onRestart,
    onSubmitScore,
}: GameOverModalProps) {
    const [callsign, setCallsign] = useState(initialCallsign || 'NEO_PILOT');
    const [submitted, setSubmitted] = useState(false);

    const getRankTitle = (s: number, lvl: number) => {
        if (s > 100000) return 'SINGULARITY GOD';
        if (s > 50000) return 'GRID OVERLORD';
        if (s > 25000) return 'CYBER OVERLORD';
        if (s > 10000) return 'QUANTUM PILOT';
        if (lvl > 5) return 'RESONANCE VOYAGER';
        return 'CYBER INITIATE';
    };

    const title = getRankTitle(score, level);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!callsign.trim()) return;
        onSubmitScore(callsign.trim().toUpperCase());
        setSubmitted(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-950/90 backdrop-blur-lg font-mono">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-md w-full max-h-[92vh] overflow-y-auto bg-slate-900/95 border border-rose-500/60 rounded-2xl p-4 md:p-6 shadow-2xl shadow-rose-500/20 text-slate-100 relative"
            >
                {/* Header */}
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/60 text-[11px] text-rose-300 font-bold uppercase tracking-wider mb-1.5 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>CYBERNETIC CORE COLLAPSE</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        SYSTEM TERMINATED
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Void Hazard corruption overwhelmed your Cybernetic Core.
                    </p>
                </div>

                {/* Score & Rank Card */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 mb-4 relative overflow-hidden">
                    {isNewHighScore && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-[9px] font-bold text-amber-300 uppercase animate-bounce">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>NEW HIGH SCORE!</span>
                        </div>
                    )}

                    <div className="text-center mb-3">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">FINAL HARVEST SCORE</div>
                        <div className="text-3xl font-black text-amber-400 tracking-wider my-0.5">
                            {score.toLocaleString()}
                        </div>
                        <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900 border border-amber-500/40 text-[11px] font-bold text-amber-300">
                            RANK: {title}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-700/80 pt-2.5 text-xs">
                        <div>
                            <span className="text-[10px] text-slate-400">LEVEL REACHED:</span>
                            <div className="font-bold text-white text-sm">0{level}</div>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400">HIGHEST COMBO:</span>
                            <div className="font-bold text-sky-400 text-sm">{highestCombo}x</div>
                        </div>
                    </div>
                </div>

                {/* Callsign Entry for Leaderboard */}
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="mb-4">
                        <label className="block text-[11px] text-slate-300 font-bold mb-1 uppercase">
                            ENTER CALLSIGN FOR LEADERBOARDS:
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                maxLength={12}
                                value={callsign}
                                onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                                placeholder="NEO_PILOT"
                                className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 uppercase outline-none"
                            />
                            <button 
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                SUBMIT
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-center text-xs font-bold text-emerald-300 mb-4">
                        ✓ CALLSIGN [{callsign}] REGISTERED ON GLOBAL LEADERBOARDS!
                    </div>
                )}

                {/* Instant Replay Button */}
                <button
                    onClick={onRestart}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>RESTART</span>
                </button>
            </motion.div>
        </div>
    );
}
