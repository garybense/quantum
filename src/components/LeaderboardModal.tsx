import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Globe, User, X, Award, Flame, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
    leaderboard: LeaderboardEntry[];
    userHighScore: number;
    userLevel: number;
    userCallsign: string;
    onClose: () => void;
}

export function LeaderboardModal({
    leaderboard,
    userHighScore,
    userLevel,
    userCallsign,
    onClose,
}: LeaderboardModalProps) {
    const [tab, setTab] = useState<'all' | 'top10'>('all');

    const sortedEntries = [...leaderboard].sort((a, b) => b.score - a.score);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-mono">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl w-full bg-slate-900/95 border border-sky-500/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-sky-500/20 text-slate-100 relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/50">
                            <Trophy className="w-6 h-6 text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                                CYBER LEADERBOARDS
                            </h2>
                            <p className="text-xs text-sky-400">
                                Global Cybernetic Pilots & Grid High-Scores
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Personal Best Bar */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/40 mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-amber-400" />
                        <div>
                            <div className="text-xs text-slate-400 uppercase">YOUR CALLSIGN & BEST HARVEST</div>
                            <div className="text-sm font-bold text-amber-300">{userCallsign || 'NEO_PILOT'}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase">BEST SCORE</div>
                        <div className="text-lg font-black text-white">{userHighScore.toLocaleString()}</div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="max-h-72 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {sortedEntries.slice(0, tab === 'top10' ? 10 : 50).map((entry, idx) => {
                        const isTop3 = idx < 3;
                        const rankColors = ['text-amber-400 border-amber-500/50 bg-amber-500/10', 'text-slate-300 border-slate-400/50 bg-slate-400/10', 'text-amber-600 border-amber-700/50 bg-amber-700/10'];

                        return (
                            <div 
                                key={`lb_${entry.id}_${idx}`}
                                className={`flex items-center justify-between p-3 rounded-lg border text-xs md:text-sm transition-all ${
                                    isTop3 ? rankColors[idx] : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-base w-6 text-center">
                                        #{idx + 1}
                                    </span>
                                    <div>
                                        <div className="font-bold flex items-center gap-1.5">
                                            <span>{entry.pilotName}</span>
                                            <span className="text-[10px] opacity-75 font-normal px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                                                {entry.title}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Level {entry.level} • {entry.highestCombo}x Combo • {entry.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="font-black text-base tracking-wider">
                                    {entry.score.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
