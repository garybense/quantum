// Mulberry32 seedable PRNG for deterministic simulation

export function createRNG(seed: number) {
    let s = seed >>> 0;
    return function nextFloat(): number {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function getDailySeed(dateStr?: string): number {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < date.length; i++) {
        const char = date.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}
