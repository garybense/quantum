import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, ShoppingBag, Zap, CheckCircle2, Flame, X, Circle, Eye } from 'lucide-react';
import { soundEngine } from '../audio';
import { META_UPGRADES, MetaUpgradeDefinition } from '../game/metaUpgrades';

interface QuantumVaultModalProps {
    score: number;
    playerCredits: number;
    purchasedUpgrades: string[];
    selectedTrail: string;
    onBuyUpgrade: (upgradeId: string, cost: number) => void;
    onSelectTrail: (trailId: string) => void;
    onClose: () => void;
}

export function QuantumVaultModal({
    score,
    playerCredits,
    purchasedUpgrades,
    selectedTrail,
    onBuyUpgrade,
    onSelectTrail,
    onClose,
}: QuantumVaultModalProps) {
    const [selectedTab, setSelectedTab] = useState<'all' | 'start_shield' | 'magnet' | 'fifth_orbit' | 'trail_cosmetic'>('all');
    const [purchaseModalItem, setPurchaseModalItem] = useState<MetaUpgradeDefinition | null>(null);

    const filteredItems = META_UPGRADES.filter(
        item => selectedTab === 'all' || item.category === selectedTab
    );

    const handleConfirmBuy = (item: MetaUpgradeDefinition) => {
        soundEngine.playLevelUpSound();
        onBuyUpgrade(item.id, item.costCredits);
        setPurchaseModalItem(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl font-mono">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/85 border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500/20 via-indigo-600/20 to-purple-600/20 border-b border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-lg animate-pulse">
                            <ShoppingBag className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-amber-300 tracking-wider flex items-center gap-2">
                                QUANTUM VAULT & META SHOP
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold">
                                    PERMANENT UPGRADES
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Invest earned credits into permanent cybernetic enhancements and orbital cosmetics.
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

                {/* Subheader / Tabs & Currency */}
                <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {[
                            { id: 'all', label: 'ALL' },
                            { id: 'start_shield', label: 'SHIELD' },
                            { id: 'magnet', label: 'MAGNET' },
                            { id: 'fifth_orbit', label: 'ORBIT' },
                            { id: 'trail_cosmetic', label: 'TRAILS' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    soundEngine.playLevelUpSound();
                                    setSelectedTab(tab.id as any);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer uppercase ${
                                    selectedTab === tab.id
                                        ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300">
                            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span className="text-xs font-bold">RESONANCE XP: {score.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300">
                            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                            <span className="text-xs font-bold">CREDITS: {playerCredits.toLocaleString()} CR</span>
                        </div>
                    </div>
                </div>

                {/* Store Catalog Grid */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredItems.map(item => {
                        const isPurchased = purchasedUpgrades.includes(item.id);
                        const isAffordable = playerCredits >= item.costCredits;
                        const isTrailCosmetic = item.category === 'trail_cosmetic';
                        const isEquipped = isTrailCosmetic && selectedTrail === item.value;

                        return (
                            <motion.div
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 border border-slate-800 hover:border-amber-500/60 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                                                {item.category === 'start_shield' && <Shield className="w-6 h-6 text-amber-400" />}
                                                {item.category === 'magnet' && <Zap className="w-6 h-6 text-amber-400" />}
                                                {item.category === 'fifth_orbit' && <Circle className="w-6 h-6 text-amber-400" />}
                                                {item.category === 'trail_cosmetic' && <Flame className="w-6 h-6 text-amber-400" />}
                                            </div>
                                            <div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                                    {item.badge}
                                                </span>
                                                <h3 className="text-base font-black text-slate-100 mt-1">{item.name}</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{item.description}</p>
                                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs mb-4">
                                        <span className="text-slate-400 font-bold">PERK:</span>
                                        <span className="text-amber-300 font-black">{item.perk}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-emerald-400">{item.costCredits.toLocaleString()} CR</span>
                                        <span className="text-[10px] text-slate-500 font-bold">PERMANENT UPGRADE</span>
                                    </div>

                                    {isPurchased ? (
                                        isTrailCosmetic ? (
                                            <button
                                                onClick={() => onSelectTrail(isEquipped ? 'default' : (item.value as string))}
                                                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                                                    isEquipped
                                                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                                                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                                                }`}
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>{isEquipped ? 'EQUIPPED' : 'EQUIP'}</span>
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                <span>UNLOCKED</span>
                                            </div>
                                        )
                                    ) : (
                                        <button
                                            onClick={() => setPurchaseModalItem(item)}
                                            disabled={!isAffordable}
                                            className={`px-5 py-2 rounded-xl font-black text-xs tracking-wider shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                                isAffordable
                                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
                                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                            <span>{isAffordable ? 'ACQUIRE' : 'NEED CREDITS'}</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer / Info */}
                <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Upgrades persist across restarts and automatically apply on run start.</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
                    >
                        RETURN TO SIMULATION
                    </button>
                </div>
            </motion.div>

            {/* Purchase Confirmation Modal */}
            <AnimatePresence>
                {purchaseModalItem && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl text-center"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-4 text-amber-300">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-black text-amber-300 mb-2">CONFIRM ACQUISITION</h3>
                            <p className="text-xs text-slate-300 mb-6">
                                Acquire <strong className="text-white">{purchaseModalItem.name}</strong> for <span className="text-emerald-400 font-bold">{purchaseModalItem.costCredits.toLocaleString()} Credits</span>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPurchaseModalItem(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={() => handleConfirmBuy(purchaseModalItem)}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                                >
                                    CONFIRM PURCHASE
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
