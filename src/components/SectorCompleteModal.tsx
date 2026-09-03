import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowRight, Zap, CheckCircle2, Sparkles, Award, Shield } from 'lucide-react';
import { SectorDefinition, SectorProgress, CyberAugment } from '../types';
import { getAugmentMeta } from '../App';

interface SectorCompleteModalProps {
    currentSectorDef: SectorDefinition;
    nextSectorDef: SectorDefinition;
    sectorProgress: SectorProgress;
    bonusXP: number;
    bonusScore: number;
    augmentRewardOptions: CyberAugment[];
    onSelectRewardAndAdvance: (aug?: CyberAugment) => void;
}

export function SectorCompleteModal({
    currentSectorDef,
    nextSectorDef,
    sectorProgress,
    bonusXP,
    bonusScore,
    augmentRewardOptions,
    onSelectRewardAndAdvance,
}: SectorCompleteModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl font-mono">
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="max-w-2xl w-full max-h-[92vh] overflow-y-auto bg-slate-900/95 border border-amber-500/60 rounded-2xl p-6 md:p-8 shadow-2xl shadow-amber-500/20 text-slate-100 relative"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-xs text-amber-300 font-bold uppercase tracking-widest mb-2 animate-bounce">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>SECTOR OBJECTIVES COMPLETED</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        SECTOR {currentSectorDef.sectorLevel} CLEARED!
                    </h2>
                    <p className="text-xs text-amber-300 font-bold mt-1">
                        {currentSectorDef.title}
                    </p>
                </div>

                {/* Metrics Breakdown Card */}
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 mb-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/30">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">GATES PASSED</div>
                        <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {sectorProgress.gatesPassed}/{currentSectorDef.targets.gatesPassedTarget}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-sky-500/30">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">DROPS COLLECTED</div>
                        <div className="text-lg font-black text-sky-400 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {sectorProgress.itemsCollected}/{currentSectorDef.targets.itemsCollectedTarget}
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-indigo-500/30">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">MAX COMBO</div>
                        <div className="text-lg font-black text-indigo-400 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {sectorProgress.maxComboAchieved}x
                        </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/30">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">BONUS REWARDS</div>
                        <div className="text-xs font-black text-amber-300">
                            +{bonusScore} PTS / +{bonusXP} XP
                        </div>
                    </div>
                </div>

                {/* Unlocked System Synthesis / State Upgrade */}
                {currentSectorDef.unlockedStateChange && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-400/60 mb-5 relative z-10 text-xs">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                            NEW SYSTEM SYNTHESIZED:
                        </div>
                        <div className="font-black text-white text-sm text-cyan-200">
                            ⚡ {currentSectorDef.unlockedStateChange.systemName}
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5">
                            {currentSectorDef.unlockedStateChange.description}
                        </p>
                    </div>
                )}

                {/* Choose Sector Reward Module */}
                <div className="mb-6 relative z-10">
                    <h3 className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        SELECT TACTICAL MODULE UPGRADE FOR SECTOR {nextSectorDef.sectorLevel}:
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {augmentRewardOptions.slice(0, 2).map((aug) => {
                            const meta = getAugmentMeta(aug.name);
                            return (
                                <motion.button
                                    key={aug.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectRewardAndAdvance(aug)}
                                    className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-amber-400/80 text-left transition-all group cursor-pointer shadow-lg hover:shadow-amber-500/20"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{meta.symbol}</span>
                                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                            {aug.name}
                                        </h4>
                                    </div>
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mb-1.5 ${meta.badgeClass}`}>
                                        {aug.statBoost}
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-snug">
                                        {aug.description}
                                    </p>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Sector Briefing */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 relative z-10 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-400 uppercase mb-1">
                        <ArrowRight className="w-4 h-4" />
                        <span>NEXT OBJECTIVE: {nextSectorDef.title}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        {nextSectorDef.description}
                    </p>
                    <div className="mt-2 text-[11px] font-semibold text-cyan-300/90 italic bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
                        {nextSectorDef.strategyTip}
                    </div>
                </div>

                {/* Advance Button */}
                <button
                    onClick={() => onSelectRewardAndAdvance()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>WARP TO SECTOR {nextSectorDef.sectorLevel}</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </motion.div>
        </div>
    );
}
