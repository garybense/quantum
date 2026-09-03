// Web Audio API Synthesizer - Audio Engine 3.0 (Distribution Grade)
// Zero-allocation synthesis loop + Pre-allocated Gain Pool
// Designed for seamless performance during high-intensity 3D combat

class SoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private droneGain: GainNode | null = null;
    private pullOsc: OscillatorNode | null = null;
    private pullGain: GainNode | null = null;
    private isMuted: boolean = false;
    private isInitialized: boolean = false;

    // Load Shedding & Performance Management
    private activeVoiceCount: number = 0;
    private maxVoices: number = 6; // Tight cap for extreme stability on mobile
    private lastImpactTime: number = 0;

    // Pre-allocated Gain Nodes for common effects to reduce GC pressure
    private gainPool: GainNode[] = [];
    private poolSize: number = 8;

    private harmonicScale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51];

    public init() {
        if (this.isInitialized) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioCtx();
            
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Setup Pool
            for (let i = 0; i < this.poolSize; i++) {
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0, this.ctx.currentTime);
                g.connect(this.masterGain);
                this.gainPool.push(g);
            }

            // Low-CPU Background Drone (Single Sine instead of 4)
            this.droneGain = this.ctx.createGain();
            this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            this.droneGain.connect(this.masterGain);
            const drone = this.ctx.createOscillator();
            drone.frequency.setValueAtTime(65.41, this.ctx.currentTime);
            drone.connect(this.droneGain);
            drone.start();

            // Dynamic Pull/Vortex Synth
            this.pullGain = this.ctx.createGain();
            this.pullGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.pullGain.connect(this.masterGain);
            this.pullOsc = this.ctx.createOscillator();
            this.pullOsc.type = 'sawtooth';
            this.pullOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(120, this.ctx.currentTime);
            this.pullOsc.connect(filter);
            filter.connect(this.pullGain);
            this.pullOsc.start();

            this.isInitialized = true;
        } catch (e) {
            console.warn('SoundEngine 3.0 Init Failure:', e);
        }
    }

    private getAvailableGain(): GainNode | null {
        if (!this.ctx || this.isMuted) return null;
        // Simple round-robin search
        return this.gainPool[this.activeVoiceCount % this.poolSize];
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playFusionTone(stage: number, mass: number = 1.0) {
        if (!this.isInitialized || !this.ctx || this.isMuted || this.activeVoiceCount > this.maxVoices) return;
        this.resume();

        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        const noteIndex = Math.min(this.harmonicScale.length - 1, stage * 2);
        const baseFreq = this.harmonicScale[noteIndex] / Math.pow(mass, 0.15);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + 0.1);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.15, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.35);

        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playSolidImpactSound(force: number = 2.5, _hue?: number, _size?: number, _mass?: number, _type?: string) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastImpactTime < 0.08) return;
        this.lastImpactTime = now;

        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        const freq = 150 + force * 15;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.min(0.2, force * 0.04), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        osc.onended = () => osc.disconnect();
    }

    public updatePullDrone(active: boolean, intensity: number) {
        if (!this.isInitialized || !this.ctx || !this.pullGain || !this.pullOsc || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (active) {
            this.pullOsc.frequency.setTargetAtTime(50 + intensity * 40, now, 0.2);
            this.pullGain.gain.setTargetAtTime(0.05 + intensity * 0.05, now, 0.2);
        } else {
            this.pullGain.gain.setTargetAtTime(0, now, 0.3);
        }
    }

    public playChronoShiftSound(timeScale: number) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = timeScale < 1.0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(timeScale < 1.0 ? 330 : 220, now);
        osc.frequency.exponentialRampToValueAtTime(timeScale < 1.0 ? 110 : 440, now + 0.2);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.2);
        osc.onended = () => osc.disconnect();
    }

    public playSpinningObjectWobble(spinRotSpeed: number = 5.0, hue: number = 200, size: number = 1.0, objType: string = 'sphere') {
        const intensity = Math.min(1.0, Math.max(0.12, spinRotSpeed * 0.1));
        const wobbleRateHz = Math.min(26, Math.max(3.5, spinRotSpeed * 2.4));
        this.playWobbleResonance(intensity, wobbleRateHz, hue, size, objType);
    }

    public playWobbleResonance(intensity: number = 0.5, wobbleRateHz: number = 8.0, hue: number = 200, size: number = 1.0, objType: string = 'sphere') {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = objType === 'box' ? 'sawtooth' : (objType === 'torus' ? 'triangle' : 'sine');
        const baseFreq = (160 + (hue / 360) * 400) / Math.max(0.4, size);
        osc.frequency.setValueAtTime(baseFreq, now);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.1 * intensity, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.35);
        osc.onended = () => osc.disconnect();
    }

    public playParticleCollisionSound(speed: number = 1.0, mass: number = 1.0, stage: number = 0, hue: number = 180) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        const noteIndex = Math.min(this.harmonicScale.length - 1, Math.floor((hue / 360) * 12) + stage);
        const pitch = this.harmonicScale[noteIndex] * Math.min(2.0, Math.max(0.5, speed * 0.8));

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, now);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.min(0.15, 0.05 + speed * 0.05 * mass), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.2);
        osc.onended = () => osc.disconnect();
    }

    public playLevelUpSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        [523.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const g = this.ctx!.createGain();
            g.connect(this.masterGain!);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc.connect(g);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
            osc.onended = () => { osc.disconnect(); g.disconnect(); };
        });
    }

    public playItemPickupSound(_type?: string) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        osc.onended = () => osc.disconnect();
    }

    public playShatterSound(size: number = 1.0, hue: number = 200) {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        const baseFreq = 1200 + (hue % 360);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.2);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.25);
        osc.onended = () => osc.disconnect();
    }

    public playShieldViolentImpactSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.45);
        osc.onended = () => osc.disconnect();
    }

    public playHazardHitSound() {
        this.playDamageSound(false);
    }

    public playSupernovaSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        g.connect(this.masterGain!);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.6);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
    }

    public playKineticSlingshotSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.25);
        osc.onended = () => osc.disconnect();
    }

    public playTachyonPulseSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        osc.onended = () => osc.disconnect();
    }

    public playChronosSynchroMeshSound() {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        osc.frequency.setValueAtTime(660, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.1);
        osc.onended = () => osc.disconnect();
    }

    public playDamageSound(isShield: boolean = true) {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        osc.type = isShield ? 'sine' : 'square';
        osc.frequency.setValueAtTime(isShield ? 300 : 100, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.1);
        osc.onended = () => osc.disconnect();
    }

    public playComboSound(multiplier: number = 2) {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.getAvailableGain();
        if (!g) return;
        const pitch = 440 * Math.pow(1.05, Math.min(8, multiplier));
        osc.frequency.setValueAtTime(pitch, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.08);
        osc.onended = () => osc.disconnect();
    }

    public playGatePassSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.2);
        osc.onended = () => osc.disconnect();
    }

    public playGameOverSound() {
        if (!this.isInitialized || !this.ctx || !this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        g.connect(this.masterGain!);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.9);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime, 0.1);
        }
        return this.isMuted;
    }

    public getMuted(): boolean {
        return this.isMuted;
    }
}

export const soundEngine = new SoundEngine();
