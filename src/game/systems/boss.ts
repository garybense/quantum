import { SimState, ShieldPanelState, WarningArc } from '../state';
import { SHIELD_TUNING, CORE_TUNING, SLING_TUNING } from '../tuning';

export interface BossContactEvent {
    type: 'panel_hit' | 'panel_shattered' | 'core_hit' | 'counterattack_triggered' | 'vulnerability_started';
    panelIndex?: number;
    damage?: number;
    crit?: boolean;
}

export function initBoss(state: SimState, sectorLevel = 1, maxCoreHp = 1000) {
    const boss = state.boss;
    boss.sectorLevel = sectorLevel;
    boss.coreHp = maxCoreHp;
    boss.maxCoreHp = maxCoreHp;
    boss.ringRadius = 9.5;
    boss.ringRotation = 0;
    boss.spinSpeed = 0.5;
    boss.isVulnerable = false;
    boss.vulnerabilityTimer = 0;
    boss.isEnraged = false;
    boss.slowmoTimer = 0;

    const panelHp = SHIELD_TUNING.PANEL_HP_BASE * sectorLevel;
    for (let i = 0; i < boss.panels.length; i++) {
        const p = boss.panels[i];
        p.id = i;
        p.angleOffset = (Math.PI * 2 / 6) * i;
        p.span = (Math.PI * 2 / 6) * 0.85;
        p.hp = panelHp;
        p.maxHp = panelHp;
        p.alive = true;
        p.regenTimer = 0;
        p.scale = 1.0;
    }

    for (const arc of boss.warningArcs) {
        arc.active = false;
    }
}

function normalizeAngle(a: number): number {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

export function updateBoss(state: SimState, dt: number, subsystemsPowered = 4): BossContactEvent[] {
    const events: BossContactEvent[] = [];
    const boss = state.boss;

    // Check Enrage (sector >= 5, coreHp <= 30%)
    if (boss.sectorLevel >= 5 && boss.coreHp / boss.maxCoreHp <= CORE_TUNING.ENRAGE_AT) {
        boss.isEnraged = true;
    } else {
        boss.isEnraged = false;
    }

    // Spin speed
    const spinMult = boss.isEnraged ? 1.6 : 1.0;
    boss.spinSpeed = 0.5 * spinMult;
    boss.ringRotation = (boss.ringRotation + boss.spinSpeed * dt) % (Math.PI * 2);

    // Panel Regeneration
    // Each powered subsystem slows regen by REGEN_SLOW_PER_SUBSYS (0.25)
    // regenMultiplier = 1 + subsystemsPowered * 0.25
    const regenSlowMult = 1.0 + subsystemsPowered * SHIELD_TUNING.REGEN_SLOW_PER_SUBSYS;
    const enrageRegenMult = boss.isEnraged ? 1.5 : 1.0;
    const effectiveRegenDuration = (SHIELD_TUNING.PANEL_REGEN_S * regenSlowMult) / enrageRegenMult;

    let deadPanelCount = 0;
    for (let i = 0; i < boss.panels.length; i++) {
        const p = boss.panels[i];
        if (!p.alive) {
            deadPanelCount++;
            p.regenTimer += dt;
            if (p.regenTimer >= effectiveRegenDuration) {
                p.alive = true;
                p.hp = p.maxHp;
                p.scale = 0.05;
                p.regenTimer = 0;
            }
        } else {
            if (p.scale < 1.0) {
                p.scale = Math.min(1.0, p.scale + dt * 2.5);
            }
        }
    }

    // Vulnerability Check
    const isNowVulnerable = deadPanelCount >= CORE_TUNING.VULN_PANELS;
    if (isNowVulnerable && !boss.isVulnerable) {
        boss.isVulnerable = true;
        boss.slowmoTimer = 1.0; // 1s slowmo transition
        events.push({ type: 'vulnerability_started' });
    } else if (!isNowVulnerable && boss.isVulnerable) {
        boss.isVulnerable = false;
    }

    if (boss.slowmoTimer > 0) {
        boss.slowmoTimer = Math.max(0, boss.slowmoTimer - dt);
    }

    // Update Warning Arcs & Counterattacks
    for (const arc of boss.warningArcs) {
        if (!arc.active) continue;
        arc.timer += dt;
        if (arc.timer >= arc.duration) {
            arc.active = false;
            // Execute counterattack
            if (arc.type === 'shockwave') {
                // Radial shockwave damages marble if in shockwave ring
                const dx = state.marble.x - arc.x;
                const dz = state.marble.z - arc.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (Math.abs(dist - arc.radius) < 3.0) {
                    // Shockwave contact with marble
                    events.push({ type: 'counterattack_triggered', damage: 20 });
                }
            } else if (arc.type === 'turret') {
                // Turret pulse projectile from sim pool towards marble
                const dx = state.marble.x - arc.x;
                const dz = state.marble.z - arc.z;
                const dist = Math.sqrt(dx * dx + dz * dz) || 1;
                const speed = 12.0;
                // Reuse inactive hazard slot for turret projectile
                const freeHaz = state.hazards.find(h => !h.active);
                if (freeHaz) {
                    freeHaz.active = true;
                    freeHaz.x = arc.x;
                    freeHaz.z = arc.z;
                    freeHaz.vx = (dx / dist) * speed;
                    freeHaz.vz = (dz / dist) * speed;
                    freeHaz.radius = 1.0;
                    freeHaz.mass = 2.0;
                }
            }
        }
    }

    return events;
}

export function damageShieldPanel(state: SimState, panelIndex: number, damage: number, isCrit = false): BossContactEvent[] {
    const events: BossContactEvent[] = [];
    const p = state.boss.panels[panelIndex];
    if (!p || !p.alive) return events;

    const actualDmg = isCrit ? damage * SLING_TUNING.CRIT_MULT : damage;
    p.hp -= actualDmg;

    events.push({ type: 'panel_hit', panelIndex, damage: actualDmg, crit: isCrit });

    if (p.hp <= 0) {
        p.hp = 0;
        p.alive = false;
        p.scale = 0;
        p.regenTimer = 0;
        events.push({ type: 'panel_shattered', panelIndex });

        // Counterattack trigger
        const boss = state.boss;
        if (boss.sectorLevel >= 2) {
            // Radial shockwave on panel death
            const arc = boss.warningArcs.find(a => !a.active);
            if (arc) {
                const angle = boss.ringRotation + p.angleOffset;
                arc.active = true;
                arc.x = Math.cos(angle) * boss.ringRadius;
                arc.z = Math.sin(angle) * boss.ringRadius;
                arc.angle = angle;
                arc.radius = boss.ringRadius;
                arc.timer = 0;
                arc.duration = 0.6; // 600ms telegraph
                arc.type = 'shockwave';
            }
        }
        if (boss.sectorLevel >= 3) {
            // Gap turret pulse aimed at marble
            const arc = boss.warningArcs.find(a => !a.active);
            if (arc) {
                const angle = boss.ringRotation + p.angleOffset;
                arc.active = true;
                arc.x = Math.cos(angle) * boss.ringRadius;
                arc.z = Math.sin(angle) * boss.ringRadius;
                arc.angle = angle;
                arc.radius = boss.ringRadius;
                arc.timer = 0;
                arc.duration = 0.6;
                arc.type = 'turret';
            }
        }
    }

    return events;
}

export function damageBossCore(state: SimState, damage: number, isCrit = false): BossContactEvent[] {
    const events: BossContactEvent[] = [];
    const boss = state.boss;
    if (!boss.isVulnerable) return events;

    const actualDmg = isCrit ? damage * SLING_TUNING.CRIT_MULT : damage;
    boss.coreHp = Math.max(0, boss.coreHp - actualDmg);
    events.push({ type: 'core_hit', damage: actualDmg, crit: isCrit });

    return events;
}

export function getPanelAtAngle(state: SimState, angle: number): number {
    const boss = state.boss;
    for (let i = 0; i < boss.panels.length; i++) {
        const p = boss.panels[i];
        if (!p.alive) continue;
        const pAngle = normalizeAngle(boss.ringRotation + p.angleOffset);
        const diff = Math.abs(normalizeAngle(angle - pAngle));
        if (diff <= p.span / 2) {
            return i;
        }
    }
    return -1; // Gap
}

export function isAngleOpenGap(state: SimState, angle: number): boolean {
    return getPanelAtAngle(state, angle) === -1;
}
