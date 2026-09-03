import React from 'react';
import { motion } from 'motion/react';
import { Target, Play, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectorDefinition } from '../types';

interface SectorBriefingModalProps {
    sectorDef: SectorDefinition;
    onStartSector: () => void;
}

export function SectorBriefingModal({ sectorDef, onStartSector }: SectorBriefingModalProps) {
    const { targets } = sectorDef;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/90 backdrop-blur-xl font-mono overflow-hidden">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="max-w-sm sm:max-w-md landscape:max-w-2xl w-full bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-amber-500/20 text-slate-100 relative my-auto flex flex-col landscape:grid landscape:grid-cols-2 landscape:gap-3.5 justify-between max-h-[98vh] overflow-hidden"
            >
                {/* Glow Accent */}
                <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* LEFT COLUMN IN LANDSCAPE / TOP IN PORTRAIT */}
                <div className="flex flex-col justify-between gap-1.5 sm:gap-2">
                    {/* Header */}
                    <div className="text-center landscape:text-left relative z-10">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-0.5">
                            <Target className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>GRID MISSION BRIEFING</span>
                        </div>
                        <h2 className="text-sm sm:text-lg font-black text-white tracking-tight leading-tight">
                            {sectorDef.title}
                        </h2>
                        <p className="text-[10px] sm:text-[11px] text-cyan-300 font-bold">
                            {sectorDef.subtitle}
                        </p>
                    </div>

                    {/* Combined Objective & Instructional Purpose */}
                    <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950/90 border border-amber-500/35 relative z-10 text-[10px] sm:text-[11px] text-slate-200 leading-snug font-sans">
                        <div className="font-mono font-bold text-amber-400 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            📜 OBJECTIVE & BRIEFING
                        </div>
                        <p className="line-clamp-4 landscape:line-clamp-5">
                            {sectorDef.grandNarrative ? `${sectorDef.grandNarrative} ` : ''}
                            {sectorDef.description}
                        </p>
                    </div>

                    {/* Tactical Strategy Tip - Hidden in portrait if tight, visible in landscape */}
                    <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 relative z-10 text-[9px] sm:text-[10px] text-cyan-200/90 leading-tight">
                        💡 <span className="font-bold text-cyan-300">TIP:</span> {sectorDef.strategyTip}
                    </div>
                </div>

                {/* RIGHT COLUMN IN LANDSCAPE / BOTTOM IN PORTRAIT */}
                <div className="flex flex-col justify-between gap-2 mt-2 landscape:mt-0 relative z-10">
                    {/* Sector Objectives Checklist */}
                    <div>
                        <h3 className="text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            MACHINE SUBSYSTEM THRESHOLDS & CORE GOAL:
                        </h3>
                        <div className="grid grid-cols-2 gap-1 sm:gap-1.5 text-xs">
                            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-slate-400 uppercase font-bold truncate">ROTOR (NODES)</div>
                                    <div className="font-black text-white text-[10px] sm:text-[11px]">{targets.nodeThreshold} Nodes</div>
                                </div>
                            </div>

                            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-slate-400 uppercase font-bold truncate">COGS (GATES)</div>
                                    <div className="font-black text-white text-[10px] sm:text-[11px]">{targets.gateThreshold} Gates</div>
                                </div>
                            </div>

                            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-slate-400 uppercase font-bold truncate">RELAY (DROPS)</div>
                                    <div className="font-black text-white text-[10px] sm:text-[11px]">{targets.dropThreshold} Drops</div>
                                </div>
                            </div>

                            <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[8px] text-slate-400 uppercase font-bold truncate">SURGE (COMBO)</div>
                                    <div className="font-black text-white text-[10px] sm:text-[11px]">{targets.comboThreshold}x Combo</div>
                                </div>
                            </div>
                        </div>

                        {/* Central Core Goal Badge */}
                        <div className="mt-2 p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[9.5px] text-rose-200">
                            🎯 <span className="font-black text-rose-300 uppercase">DESTROY CENTRAL CORE ({targets.centralCoreMaxHealth} HP):</span> Lower shield by collecting all 4 object types, or charge Ground Ammo Rings to breach shield with kinetic slings!
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={onStartSector}
                        className="w-full py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 mt-auto"
                    >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>COMMENCE SECTOR {sectorDef.sectorLevel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

