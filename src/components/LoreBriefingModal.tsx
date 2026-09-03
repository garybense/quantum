import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Shield, Zap, Terminal, Sparkles, ArrowRight, X } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { soundEngine } from '../audio';

interface LoreBriefingModalProps {
    onClose: () => void;
}

export function LoreBriefingModal({ onClose }: LoreBriefingModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl font-mono">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/90 border-2 border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-amber-500/20 border-b border-indigo-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 shadow-lg animate-pulse">
                            <Terminal className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-indigo-300 tracking-wider">
                                LORE DATABASE: AURA PROTOCOL
                            </h2>
                            <p className="text-xs text-slate-400">
                                Classified Quantum Archives — Terminal Log #7041
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/30 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 transition-all cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs md:text-sm leading-relaxed">
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-black text-indigo-300 mb-1">THE COLLAPSE OF THE QUANTUM GRID</h4>
                            <p className="text-slate-400">
                                In the year 2142, the Central Cybernetic Singularity experienced a catastrophic dimensional feedback loop. The Master Machine Aperture fractured into four unstable sub-sectors, threatening to plunge humanity into perpetual temporal stasis.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">OBJECTIVE 01</span>
                                <h5 className="font-bold text-slate-200 mt-1 mb-2">PULL & SLING</h5>
                                <p className="text-xs text-slate-400">
                                    Utilize your gravitational tether to capture drifting cyber-nodes and fling them through rotating sector gates with maximum momentum.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span>High Kinetic Velocity</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">OBJECTIVE 02</span>
                                <h5 className="font-bold text-slate-200 mt-1 mb-2">SHIELD EVASION</h5>
                                <p className="text-xs text-slate-400">
                                    Avoid touching the lethal outer perimeter shielding. Centrifugal shear forces cause heavy core damage and fatal breaches.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs text-sky-300 font-bold">
                                <Shield className="w-4 h-4 text-sky-400" />
                                <span>Maintain Safe Radius</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">OBJECTIVE 03</span>
                                <h5 className="font-bold text-slate-200 mt-1 mb-2">CHRONO MASTERY</h5>
                                <p className="text-xs text-slate-400">
                                    Activate temporal stasis loops to slow chaotic particle velocities and synchronize all four machine subsystems for sector ascension.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs text-purple-300 font-bold">
                                <Cpu className="w-4 h-4 text-purple-400" />
                                <span>Subsystem Overdrive</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex flex-col gap-3">
                            <div className="text-[10px] leading-tight">
                                <span className="font-black uppercase block mb-1 text-amber-300">PILOT DIRECTIVE</span>
                                Master the orbital slingshot mechanics to achieve top global rankings in the Quantum Vault.
                            </div>
                            <button
                                onClick={() => {
                                    soundEngine.playLevelUpSound();
                                    onClose();
                                }}
                                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
                            >
                                <span>ENGAGE SIMULATION</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 text-slate-400 flex flex-col gap-3">
                            <div className="text-[10px] leading-tight">
                                <span className="font-black uppercase block mb-1 text-slate-300">LEGAL & PRIVACY</span>
                                Use of the Aura Protocol constitutes acceptance of cybernetic data harvesting terms.
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => Browser.open({ url: 'https://quantum-confusion.web.app/privacy' }).catch(() => window.open('/privacy.html', '_blank'))}
                                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] uppercase tracking-wider border border-slate-700 transition-all cursor-pointer"
                                >
                                    Privacy Policy
                                </button>
                                <button
                                    onClick={() => Browser.open({ url: 'https://quantum-confusion.web.app/terms' }).catch(() => window.open('/terms.html', '_blank'))}
                                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9px] uppercase tracking-wider border border-slate-700 transition-all cursor-pointer"
                                >
                                    Terms of Use
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
