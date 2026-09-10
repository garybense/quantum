// Web Audio API Synthesizer - Audio Engine 3.0 (Distribution Grade)
// Zero-allocation synthesis loop + Pre-allocated Gain Pool
// Music Director: 4 continuous loop layers (Doctor Who sci-fi synth style)

class SoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private masterMusicGain: GainNode | null = null;

    // Music Director Layers & Gains
    private padGain: GainNode | null = null;
    private pulseGain: GainNode | null = null;
    private arpGain: GainNode | null = null;
    private percGain: GainNode | null = null;

    private padOscs: OscillatorNode[] = [];
    private pulseOscs: OscillatorNode[] = [];
    private arpOscs: OscillatorNode[] = [];
    private musicInterval: any = null;

    private isMuted: boolean = false;
    private isInitialized: boolean = false;

    // Load Shedding & Rate Limiting
    private activeVoiceCount: number = 0;
    private maxVoices: number = 6;
    private lastSfxTime: number = 0;
    private minSfxIntervalMs: number = 60; // Global rate limit: min 60ms between SFX starts
    private activeWobbleCount: number = 0; // Wobble cap: max 1 concurrent voice globally
    private lastImpactTime: number = 0;

    // Pre-allocated Gain Nodes
    private gainPool: GainNode[] = [];
    private poolSize: number = 8;

    private harmonicScale = [
        130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25,
        659.25, 783.99, 880.0, 1046.5, 1318.51,
    ];

    public init() {
        if (this.isInitialized) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            // Master Music Gain for Sidechain Ducking
            this.masterMusicGain = this.ctx.createGain();
            this.masterMusicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            this.masterMusicGain.connect(this.masterGain);

            // Setup Pool for SFX
            for (let i = 0; i < this.poolSize; i++) {
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0, this.ctx.currentTime);
                g.connect(this.masterGain);
                this.gainPool.push(g);
            }

            this.initMusicDirector();
            this.isInitialized = true;
        } catch (e) {
            console.warn('SoundEngine 3.0 Init Failure:', e);
        }
    }

    // Dr. Who / Sci-Fi Layered Music Director
    private initMusicDirector() {
        if (!this.ctx || !this.masterMusicGain) return;
        const now = this.ctx.currentTime;

        // Layer 1: Pad (Gliding Sci-Fi Outer Space Sound)
        this.padGain = this.ctx.createGain();
        this.padGain.gain.setValueAtTime(0.12, now);
        this.padGain.connect(this.masterMusicGain);

        const pad1 = this.ctx.createOscillator();
        const pad2 = this.ctx.createOscillator();
        pad1.type = 'sine';
        pad2.type = 'triangle';
        pad1.frequency.setValueAtTime(146.83, now); // D3
        pad2.frequency.setValueAtTime(220.0, now); // A3

        // Sci-Fi Detune Float
        pad1.detune.setValueAtTime(-5, now);
        pad2.detune.setValueAtTime(5, now);

        pad1.connect(this.padGain);
        pad2.connect(this.padGain);
        pad1.start(now);
        pad2.start(now);
        this.padOscs = [pad1, pad2];

        // Layer 2: Pulse (Galloping Doctor Who Triplet Bassline)
        this.pulseGain = this.ctx.createGain();
        this.pulseGain.gain.setValueAtTime(0, now);
        this.pulseGain.connect(this.masterMusicGain);

        const pulseOsc = this.ctx.createOscillator();
        pulseOsc.type = 'sawtooth';
        pulseOsc.frequency.setValueAtTime(73.42, now); // D2
        const pulseFilter = this.ctx.createBiquadFilter();
        pulseFilter.type = 'lowpass';
        pulseFilter.frequency.setValueAtTime(350, now);
        pulseOsc.connect(pulseFilter);
        pulseFilter.connect(this.pulseGain);
        pulseOsc.start(now);
        this.pulseOscs = [pulseOsc];

        // Layer 3: Arp (Sci-Fi Arpeggiator Sweep)
        this.arpGain = this.ctx.createGain();
        this.arpGain.gain.setValueAtTime(0, now);
        this.arpGain.connect(this.masterMusicGain);

        const arpOsc = this.ctx.createOscillator();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(293.66, now); // D4
        const arpFilter = this.ctx.createBiquadFilter();
        arpFilter.type = 'bandpass';
        arpFilter.frequency.setValueAtTime(800, now);
        arpOsc.connect(arpFilter);
        arpFilter.connect(this.arpGain);
        arpOsc.start(now);
        this.arpOscs = [arpOsc];

        // Layer 4: Percussion (Cybernetic Noise Pulse)
        this.percGain = this.ctx.createGain();
        this.percGain.gain.setValueAtTime(0, now);
        this.percGain.connect(this.masterMusicGain);

        // Doctor Who Arpeggio Step Ticker (runs without stopping oscillators)
        const arpNotes = [293.66, 349.23, 440.0, 523.25, 587.33, 698.46, 880.0, 698.46];
        let step = 0;
        this.musicInterval = setInterval(() => {
            if (!this.ctx || this.isMuted) return;
            step = (step + 1) % arpNotes.length;
            const stepNow = this.ctx.currentTime;
            arpOsc.frequency.setTargetAtTime(arpNotes[step], stepNow, 0.04);
            pulseOsc.frequency.setTargetAtTime(step % 2 === 0 ? 73.42 : 110.0, stepNow, 0.05);
        }, 150);
    }

    public updateMusicIntensity(intensity: number) {
        if (!this.ctx || !this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const clampedInt = Math.max(0, Math.min(3, intensity));

        const targetPad = 0.12;
        const targetPulse = clampedInt >= 1 ? 0.10 : 0;
        const targetArp = clampedInt >= 2 ? 0.08 : 0;
        const targetPerc = clampedInt >= 3 ? 0.08 : 0;

        if (this.padGain) this.padGain.gain.setTargetAtTime(targetPad, now, 0.3);
        if (this.pulseGain) this.pulseGain.gain.setTargetAtTime(targetPulse, now, 0.3);
        if (this.arpGain) this.arpGain.gain.setTargetAtTime(targetArp, now, 0.3);
        if (this.percGain) this.percGain.gain.setTargetAtTime(targetPerc, now, 0.3);
    }

    public duckMusic(durationMs: number = 150) {
        if (!this.ctx || !this.masterMusicGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.masterMusicGain.gain.cancelScheduledValues(now);
        this.masterMusicGain.gain.setValueAtTime(0.08, now);
        this.masterMusicGain.gain.setTargetAtTime(0.2, now + durationMs / 1000, 0.1);
    }

    private getAvailableGain(): GainNode | null {
        if (!this.ctx || this.isMuted) return null;
        const now = performance.now();
        if (now - this.lastSfxTime < this.minSfxIntervalMs) {
            return null;
        }
        if (this.activeVoiceCount >= this.maxVoices) {
            return null;
        }
        this.lastSfxTime = now;
        return this.gainPool[this.activeVoiceCount % this.poolSize];
    }

    public resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playNearMissWhoosh() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const g = this.getAvailableGain();
        if (!g) return;

        const now = this.ctx.currentTime;
        this.activeVoiceCount++;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);

        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.2, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(g);
        osc.start(now);
        osc.stop(now + 0.16);

        osc.onended = () => {
            osc.disconnect();
            filter.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playFusionTone(stage: number, mass: number = 1.0) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
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
        this.duckMusic(150);

        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public updatePullDrone(active: boolean, intensity: number) {
    }

    public playChronoShiftSound(timeScale: number) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playSpinningObjectWobble(spinRotSpeed: number = 5.0, hue: number = 200, size: number = 1.0, objType: string = 'sphere') {
        if (this.activeWobbleCount >= 1) return;
        const intensity = Math.min(1.0, Math.max(0.12, spinRotSpeed * 0.1));
        const wobbleRateHz = Math.min(26, Math.max(3.5, spinRotSpeed * 2.4));
        this.playWobbleResonance(intensity, wobbleRateHz, hue, size, objType);
    }

    public playWobbleResonance(intensity: number = 0.5, wobbleRateHz: number = 8.0, hue: number = 200, size: number = 1.0, objType: string = 'sphere') {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeWobbleCount++;
        this.activeVoiceCount++;

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
        osc.onended = () => {
            osc.disconnect();
            this.activeWobbleCount = Math.max(0, this.activeWobbleCount - 1);
            this.activeVoiceCount--;
        };
    }

    public playParticleCollisionSound(speed: number = 1.0, mass: number = 1.0, stage: number = 0, hue: number = 180) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
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
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playShatterSound(size: number = 1.0, hue: number = 200) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.duckMusic(200);
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playShieldViolentImpactSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.duckMusic(150);
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playHazardHitSound() {
        this.playDamageSound(false);
    }

    public playSupernovaSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.duckMusic(300);
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
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.25);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playTachyonPulseSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playChronosSynchroMeshSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(660, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.1);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playDamageSound(isShield: boolean = true) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.duckMusic(150);
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        osc.type = isShield ? 'sine' : 'square';
        osc.frequency.setValueAtTime(isShield ? 300 : 100, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.1);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playComboSound(multiplier: number = 2) {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
        const osc = this.ctx.createOscillator();
        const pitch = 440 * Math.pow(1.05, Math.min(8, multiplier));
        osc.frequency.setValueAtTime(pitch, now);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.08);
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playGatePassSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const g = this.getAvailableGain();
        if (!g) return;

        this.activeVoiceCount++;
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
        osc.onended = () => {
            osc.disconnect();
            this.activeVoiceCount--;
        };
    }

    public playGameOverSound() {
        if (!this.isInitialized || !this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        this.duckMusic(400);
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
