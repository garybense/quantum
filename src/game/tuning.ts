// Single home for all gameplay constants.
// Lock rule: values locked after signoff, change only if task says "retune X".

export const MARBLE_TUNING = {
    v_max: 34,
    k_accel: 7.5,
    radius: 1.7,
    W_SPEED: 0.02,
    RESTITUTION: 0.75,
} as const;

export const ORBIT_TUNING = {
    CAPTURE_RADIUS: 6.5,
    R_BASE: 3.0,
    R_PER_MASS: 0.22,
    OMEGA_K: 42,
    SPINUP_MAX: 2.2,
    SPINUP_TIME: 1.2,
    LAUNCH_K: 1.15,
    RECOIL_K: 0.35,
    SLOTS: 4,
    DECAY_AFTER_S: 12,
} as const;

export const SLING_TUNING = {
    PERFECT_WINDOW_MS: 70,
    CRIT_MULT: 2.0,
    DMG_K: 0.5,
    DMG_SCALE: 0.08, // ½mv² scale 0.08
} as const;

export const SHIELD_TUNING = {
    PANELS: 6,
    PANEL_HP_BASE: 400, // multiplied by sector level
    PANEL_REGEN_S: 12,
    REGEN_SLOW_PER_SUBSYS: 0.25,
} as const;

export const CORE_TUNING = {
    VULN_PANELS: 3,
    ENRAGE_AT: 0.3,
} as const;

export const FEEL_TUNING = {
    HIT_STOP_MS: 90,
    SHAKE_MAX: 1.6,
    SLOWMO_SCALE: 0.85,
} as const;
