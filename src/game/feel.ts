import { FEEL_TUNING } from './tuning';

let shakeAmplitude = 0;
let zoomPulseAmount = 0;

export const feelManager = {
    getShake(): number {
        return shakeAmplitude;
    },
    requestShake(amplitude: number) {
        shakeAmplitude = Math.min(FEEL_TUNING.SHAKE_MAX, Math.max(shakeAmplitude, amplitude));
    },
    getZoomPulse(): number {
        return zoomPulseAmount;
    },
    triggerZoomPulse(amount: number = 0.1) {
        zoomPulseAmount = amount;
    },
    update(dt: number) {
        if (shakeAmplitude > 0.001) {
            shakeAmplitude *= Math.exp(-12.0 * dt);
        } else {
            shakeAmplitude = 0;
        }

        if (zoomPulseAmount > 0.001) {
            zoomPulseAmount *= Math.exp(-6.0 * dt);
        } else {
            zoomPulseAmount = 0;
        }
    }
};
