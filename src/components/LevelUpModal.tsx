import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Cpu, Sparkles, Flame, Crosshair, Radio } from 'lucide-react';
import { CyberAugment } from '../types';
import { getAugmentMeta } from '../App';

interface LevelUpModalProps {
    level: number;
    augments: CyberAugment[];
    onSelectAugment: (augment: CyberAugment) => void;
}

export function LevelUpModal({ level, augments, onSelectAugment }: LevelUpModalProps) {
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Shield': return <Shield className="w-7 h-7 text-sky-400" />;
            case 'Zap': return <Zap className="w-7 h-7 text-amber-400" />;
            case 'Sparkles': return <Sparkles className="w-7 h-7 text-pink-400" />;
            case 'Flame': return <Flame className="w-7 h-7 text-rose-400" />;
            case 'Crosshair': return <Crosshair className="w-7 h-7 text-emerald-400" />;
            case 'Radio': return <Radio className="w-7 h-7 text-indigo-400" />;
            default: return <Cpu className="w-7 h-7 text-emerald-400" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl w-full bg-slate-900/90 border border-amber-500/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-amber-500/20 text-slate-100 font-mono relative overflow-hidden"
            >
                {/* Background Cyber Ambient Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center mb-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-xs text-amber-300 uppercase tracking-widest font-bold mb-2">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                        <span>CYBER DILATION :: OVERCLOCK READY</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
                        LEVEL UP <span className="text-amber-400">0{level}</span>
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                        Select a Cybernetic Augment to integrate into your Protagonist Core:
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    {augments.map((aug) => {
                        const meta = getAugmentMeta(aug.name);
                        return (
                            <motion.button
                                key={aug.id}
                                whileHover={{ scale: 1.04, y: -4 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onSelectAugment(aug)}
                                className="flex flex-col items-start p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-400/80 hover:bg-slate-800 text-left transition-all group shadow-lg hover:shadow-amber-500/20 cursor-pointer"
                            >
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 mb-3 group-hover:border-amber-400/60 transition-colors flex items-center gap-2.5">
                                    {getIcon(aug.icon)}
                                    <span className="text-xl leading-none">{meta.symbol}</span>
                                </div>
                                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                                    <span>{aug.name}</span>
                                </h3>
                                <div className={`text-[11px] font-bold my-1.5 px-2.5 py-0.5 rounded border flex items-center gap-1 ${meta.badgeClass}`}>
                                    <span>{meta.symbol}</span>
                                    <span>{aug.statBoost}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    {aug.description}
                                </p>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
