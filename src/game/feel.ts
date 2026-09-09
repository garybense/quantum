import { FEEL_TUNING } from './tuning';

let shakeAmplitude = 0;

export const feelManager = {
    getShake(): number {
        return shakeAmplitude;
    },
    requestShake(amplitude: number) {
        shakeAmplitude = Math.min(FEEL_TUNING.SHAKE_MAX, Math.max(shakeAmplitude, amplitude));
    },
    update(dt: number) {
        if (shakeAmplitude > 0.001) {
            shakeAmplitude *= Math.exp(-12.0 * dt);
        } else {
            shakeAmplitude = 0;
        }
    }
};
