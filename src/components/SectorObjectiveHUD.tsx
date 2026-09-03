import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ChevronDown, ChevronUp, Info, Shield, ShieldOff, Zap, Flame, Cpu, Radio } from 'lucide-react';
import { SectorDefinition, SectorProgress } from '../types';

interface SectorObjectiveHUDProps {
    sectorDef: SectorDefinition;
    sectorProgress: SectorProgress;
    coreIntegrity?: number;
    onOpenBriefing?: () => void;
    subsystem1Power?: number;
    subsystem2Power?: number;
    subsystem3Power?: number;
    subsystem4Power?: number;
}

export function SectorObjectiveHUD({
    sectorDef,
    sectorProgress,
    onOpenBriefing,
    subsystem1Power = 0,
    subsystem2Power = 0,
    subsystem3Power = 0,
    subsystem4Power = 0,
}: SectorObjectiveHUDProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { targets } = sectorDef;

    const gatesPct = Math.min(100, Math.floor((sectorProgress.gatesPassed / targets.gatesPassedTarget) * 100));
    const itemsPct = Math.min(100, Math.floor((sectorProgress.itemsCollected / targets.itemsCollectedTarget) * 100));
    const comboPct = Math.min(100, Math.floor((sectorProgress.maxComboAchieved / targets.comboTarget) * 100));
    const nodesPct = Math.min(100, Math.floor((sectorProgress.nodesAbsorbed / targets.nodesAbsorbedTarget) * 100));

    const totalActiveSubsystems = (subsystem1Power > 0 ? 1 : 0) + (subsystem2Power > 0 ? 1 : 0) + (subsystem3Power > 0 ? 1 : 0) + (subsystem4Power > 0 ? 1 : 0);
    const coreHealthPct = Math.max(0, Math.min(100, Math.floor((sectorProgress.centralCoreHealth / (targets.centralCoreMaxHealth || 100)) * 100)));

    return (
        <div className="relative font-mono pointer-events-auto">
            {/* Extremely compact icon pill */}
            <div className="rounded-full bg-slate-950/90 border border-cyan-500/60 backdrop-blur-md shadow-2xl text-slate-100">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-2.5 py-1 flex items-center gap-2 hover:bg-slate-900/80 transition-colors text-xs font-bold cursor-pointer rounded-full"
                >
                    <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                    <span className="text-cyan-300 font-black">S{sectorDef.sectorLevel} CORE: {coreHealthPct}%</span>
                    
                    {sectorProgress.isShieldActive ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[10px] text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold">
                            <Shield className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> SHIELDED
                        </span>
                    ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-black animate-bounce">
                            <ShieldOff className="w-2.5 h-2.5 text-emerald-400" /> EXPOSED!
                        </span>
                    )}

                    {sectorProgress.overchargeAmmo >= 100 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px] text-amber-300 border border-amber-400/50 flex items-center gap-1 font-black animate-pulse">
                            <Zap className="w-2.5 h-2.5 text-amber-400" /> 3x AMMO!
                        </span>
                    )}

                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {/* Expanded overlay dropdown menu */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, scale: 0.95 }}
                            animate={{ height: 'auto', opacity: 1, scale: 1 }}
                            exit={{ height: 0, opacity: 0, scale: 0.95 }}
                            className="p-3 w-64 space-y-2.5 text-xs border border-slate-700/80 bg-slate-950/98 absolute top-full left-0 mt-1.5 rounded-xl shadow-2xl z-40 overflow-hidden"
                        >
                            <div className="flex justify-between items-center text-[10px] text-amber-400 font-bold uppercase border-b border-slate-800 pb-1">
                                <span>CENTRAL OBJECTIVE: DESTROY CORE</span>
                                {onOpenBriefing && (
                                    <button 
                                        onClick={onOpenBriefing}
                                        className="text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Info className="w-3 h-3" /> BRIEFING
                                    </button>
                                )}
                            </div>

                            {/* Core Health Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black">
                                    <span className="text-slate-300">🎯 CENTRAL CORE INTEGRITY:</span>
                                    <span className={coreHealthPct > 30 ? 'text-cyan-300' : 'text-rose-400 animate-pulse'}>
                                        {sectorProgress.centralCoreHealth}/{targets.centralCoreMaxHealth} ({coreHealthPct}%)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                    <div 
                                        className={`h-full transition-all duration-300 ${coreHealthPct > 50 ? 'bg-gradient-to-r from-cyan-500 to-sky-400' : coreHealthPct > 20 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'}`}
                                        style={{ width: `${coreHealthPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Overcharge Ammo Charge Level */}
                            <div className="space-y-1 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30">
                                <div className="flex justify-between text-[10px] font-bold text-amber-300">
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> GROUND AMMO OVERCHARGE:</span>
                                    <span>{Math.floor(sectorProgress.overchargeAmmo)}%</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-amber-900">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-200"
                                        style={{ width: `${Math.min(100, sectorProgress.overchargeAmmo)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-amber-200/80 leading-tight">
                                    {sectorProgress.overchargeAmmo >= 100 
                                        ? "⚡ 3x CORE-BUSTER READY! Fling object into central core!" 
                                        : "Hover in glowing ground rings to charge Overcharge Ammo!"}
                                </p>
                            </div>

                            {/* MACHINE SUBSYSTEM MOTION STATES */}
                            <div className="pt-2 border-t border-slate-800 space-y-1.5">
                                <div className="text-[10px] text-cyan-400 font-bold flex justify-between">
                                    <span>⚙️ MACHINE SUBSYSTEM MOTIONS</span>
                                    <span className={totalActiveSubsystems === 4 ? 'text-emerald-400 font-black' : 'text-amber-300'}>
                                        {totalActiveSubsystems}/4 ACTIVE
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 text-[9.5px]">
                                    {/* Subsystem 1: Nodes */}
                                    <div className={`p-1.5 rounded border ${subsystem1Power > 0 ? 'bg-purple-950/40 text-purple-200 border-purple-500/40' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                                        <div className="flex justify-between font-bold">
                                            <span>🌀 ROTOR (NODES)</span>
                                            <span>{subsystem1Power > 0 ? `${subsystem1Power.toFixed(1)}x` : 'FROZEN'}</span>
                                        </div>
                                        <div className="text-[8.5px] opacity-80 mt-0.5">
                                            Need {targets.nodeThreshold} Nodes ({sectorProgress.nodesAbsorbed}/{targets.nodeThreshold})
                                        </div>
                                    </div>

                                    {/* Subsystem 2: Gates */}
                                    <div className={`p-1.5 rounded border ${subsystem2Power > 0 ? 'bg-amber-950/40 text-amber-200 border-amber-500/40' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                                        <div className="flex justify-between font-bold">
                                            <span>⚙️ COGS (GATES)</span>
                                            <span>{subsystem2Power > 0 ? `${subsystem2Power.toFixed(1)}x` : 'FROZEN'}</span>
                                        </div>
                                        <div className="text-[8.5px] opacity-80 mt-0.5">
                                            Need {targets.gateThreshold} Gates ({sectorProgress.gatesPassed}/{targets.gateThreshold})
                                        </div>
                                    </div>

                                    {/* Subsystem 3: Drops */}
                                    <div className={`p-1.5 rounded border ${subsystem3Power > 0 ? 'bg-sky-950/40 text-sky-200 border-sky-500/40' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                                        <div className="flex justify-between font-bold">
                                            <span>⭕ RELAY (DROPS)</span>
                                            <span>{subsystem3Power > 0 ? `${subsystem3Power.toFixed(1)}x` : 'FROZEN'}</span>
                                        </div>
                                        <div className="text-[8.5px] opacity-80 mt-0.5">
                                            Need {targets.dropThreshold} Drops ({sectorProgress.itemsCollected}/{targets.dropThreshold})
                                        </div>
                                    </div>

                                    {/* Subsystem 4: Combo */}
                                    <div className={`p-1.5 rounded border ${subsystem4Power > 0 ? 'bg-indigo-950/40 text-indigo-200 border-indigo-500/40' : 'bg-slate-900/60 text-slate-500 border-slate-800'}`}>
                                        <div className="flex justify-between font-bold">
                                            <span>⚡ SURGE (COMBO)</span>
                                            <span>{subsystem4Power > 0 ? `${subsystem4Power.toFixed(1)}x` : 'FROZEN'}</span>
                                        </div>
                                        <div className="text-[8.5px] opacity-80 mt-0.5">
                                            Need {targets.comboThreshold}x Combo ({sectorProgress.maxComboAchieved}/{targets.comboThreshold}x)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

