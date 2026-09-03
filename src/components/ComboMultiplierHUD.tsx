import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Flame, Sparkles } from 'lucide-react';

interface ComboMultiplierHUDProps {
    combo: number;
    comboTimer: number;
}

export function ComboMultiplierHUD({ combo, comboTimer }: ComboMultiplierHUDProps) {
    return null;

    // Determine tier color and glow intensity based on combo level
    const getComboTheme = (c: number) => {
        if (c >= 12) return {
            border: 'border-fuchsia-400',
            bg: 'bg-fuchsia-950/90',
            text: 'text-fuchsia-200',
            badgeBg: 'bg-fuchsia-500/30',
            glow: 'shadow-[0_0_25px_#e879f9]',
            gradient: 'from-fuchsia-500 via-pink-500 to-amber-400',
        };
        if (c >= 8) return {
            border: 'border-rose-400',
            bg: 'bg-rose-950/90',
            text: 'text-rose-200',
            badgeBg: 'bg-rose-500/30',
            glow: 'shadow-[0_0_20px_#fb7185]',
            gradient: 'from-rose-500 to-amber-500',
        };
        if (c >= 5) return {
            border: 'border-amber-400',
            bg: 'bg-amber-950/90',
            text: 'text-amber-200',
            badgeBg: 'bg-amber-500/30',
            glow: 'shadow-[0_0_15px_#fbbf24]',
            gradient: 'from-amber-400 to-yellow-300',
        };
        if (c >= 3) return {
            border: 'border-emerald-400',
            bg: 'bg-emerald-950/90',
            text: 'text-emerald-200',
            badgeBg: 'bg-emerald-500/30',
            glow: 'shadow-[0_0_12px_#34d399]',
            gradient: 'from-emerald-400 to-teal-300',
        };
        return {
            border: 'border-cyan-400',
            bg: 'bg-cyan-950/90',
            text: 'text-cyan-200',
            badgeBg: 'bg-cyan-500/30',
            glow: 'shadow-[0_0_10px_#22d3ee]',
            gradient: 'from-cyan-400 to-sky-300',
        };
    };

    const theme = getComboTheme(combo);
    const scaleFactor = Math.min(1.4, 1.0 + (combo - 1) * 0.04);
    const pulseSpeed = Math.max(0.4, 2.0 - (combo - 1) * 0.1);

    return (
        <motion.div
            animate={{ scale: [scaleFactor * 0.95, scaleFactor * 1.03, scaleFactor] }}
            transition={{ duration: 0.3 }}
            className={`pointer-events-none flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl ${theme.bg} border ${theme.border} ${theme.glow} backdrop-blur-md transition-all`}
        >
            <div className="relative flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: pulseSpeed * 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border border-dashed border-white/40"
                />
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${theme.badgeBg} ${theme.text}`}>
                    {combo >= 8 ? <Flame className="w-4 h-4 animate-bounce text-amber-300" /> : <Zap className="w-4 h-4 animate-pulse text-cyan-300" />}
                </div>
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-mono">
                        ({comboTimer > 0 ? `${comboTimer.toFixed(1)}s` : 'STABLE'})
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black ${theme.text} tracking-tight`}>
                        {combo}x
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                        SCORE MULTIPLIER
                    </span>
                </div>
            </div>

            {/* Sparkle badge */}
            <div className="flex flex-col items-center justify-center pl-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: `${pulseSpeed * 2}s` }} />
            </div>
        </motion.div>
    );
}
