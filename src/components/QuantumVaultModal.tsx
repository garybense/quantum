import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Sparkles, ShoppingBag, Cpu, CheckCircle2, Lock, Flame, Star, Trophy, X, Crown } from 'lucide-react';
import { soundEngine } from '../audio';

interface QuantumVaultModalProps {
    score: number;
    playerCredits: number;
    onPurchaseItem: (itemId: string, cost: number, itemType: string) => void;
    onClose: () => void;
}

interface StoreItem {
    id: string;
    name: string;
    description: string;
    priceCredits: number;
    realPriceUsd: string;
    category: 'boost' | 'skin' | 'pass';
    icon: any;
    badge: string;
    perk: string;
}

const VAULT_STORE_ITEMS: StoreItem[] = [
    {
        id: 'refill_pack',
        name: 'Quantum Energy Refill Pack',
        description: 'Instantly restores 100% Core Integrity and overcharges Nanoshield capacitors to max capacity.',
        priceCredits: 2500,
        realPriceUsd: '$0.99',
        category: 'boost',
        icon: Zap,
        badge: 'INSTANT REPAIR',
        perk: '+100% Core HP & Shield',
    },
    {
        id: 'chrono_pass',
        name: 'Chrono Stasis VIP Pass',
        description: 'Permanently unlocks 3x Slow-Mo duration extension and zero cooldown on orbital slingshot velocity.',
        priceCredits: 7500,
        realPriceUsd: '$3.99',
        category: 'pass',
        icon: Sparkles,
        badge: 'BEST VALUE',
        perk: '3x Slow-Mo & Slingshot Mastery',
    },
    {
        id: 'skin_obsidian',
        name: 'Cyber-Void Obsidian Skin',
        description: 'Exclusive matte black stealth armor with hyper-vibrant crimson neon vector trails and zero friction.',
        priceCredits: 12000,
        realPriceUsd: '$4.99',
        category: 'skin',
        icon: Flame,
        badge: 'EXCLUSIVE SKIN',
        perk: 'Stealth Void Aura & Trail',
    },
    {
        id: 'neural_subscription',
        name: 'Aura Neural Pass (Monthly)',
        description: 'Ultimate subscription tier: 2x permanent XP gain, zero shield shear damage, and unlimited daily drops.',
        priceCredits: 25000,
        realPriceUsd: '$9.99/mo',
        category: 'pass',
        icon: Crown,
        badge: 'VIP PASS',
        perk: '2x XP & Zero Shear Damage',
    },
];

export function QuantumVaultModal({
    score,
    playerCredits,
    onPurchaseItem,
    onClose,
}: QuantumVaultModalProps) {
    const [selectedTab, setSelectedTab] = useState<'all' | 'boost' | 'skin' | 'pass'>('all');
    const [purchasedItems, setPurchasedItems] = useState<Record<string, boolean>>({});
    const [purchaseModalItem, setPurchaseModalItem] = useState<StoreItem | null>(null);

    const filteredItems = VAULT_STORE_ITEMS.filter(item => selectedTab === 'all' || item.category === selectedTab);

    const handleBuy = (item: StoreItem) => {
        soundEngine.playLevelUpSound();
        setPurchasedItems(prev => ({ ...prev, [item.id]: true }));
        onPurchaseItem(item.id, item.priceCredits, item.category);
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
                                QUANTUM VAULT & CYBER-STORE
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold">
                                    LIVE MONETIZATION
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Upgrade your cybernetic resonance, unlock exclusive skins, and acquire VIP pass privileges.
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
                    <div className="flex items-center gap-2">
                        {(['all', 'boost', 'skin', 'pass'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    soundEngine.playLevelUpSound();
                                    setSelectedTab(tab);
                                }}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer uppercase ${
                                    selectedTab === tab
                                        ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                                }`}
                            >
                                {tab}s
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
                        const IconComponent = item.icon;
                        const isPurchased = purchasedItems[item.id];
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
                                                <IconComponent className="w-6 h-6 text-amber-400" />
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
                                        <span className="text-slate-400 font-bold">Perk:</span>
                                        <span className="text-amber-300 font-black">{item.perk}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-emerald-400">{item.realPriceUsd}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">or {item.priceCredits.toLocaleString()} CR</span>
                                    </div>
                                    {isPurchased ? (
                                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            <span>UNLOCKED</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPurchaseModalItem(item)}
                                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                            <span>ACQUIRE</span>
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
                        <span>Secure Google Play Store In-App Billing & Quantum Token Verification.</span>
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
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/9aid backdrop-blur-md">
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
                                Acquire <strong className="text-white">{purchaseModalItem.name}</strong> for <span className="text-emerald-400 font-bold">{purchaseModalItem.realPriceUsd}</span> ({purchaseModalItem.priceCredits.toLocaleString()} Credits)?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPurchaseModalItem(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={() => handleBuy(purchaseModalItem)}
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
