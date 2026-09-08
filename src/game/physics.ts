import { CircleBody } from './state';
import { MARBLE_TUNING } from './tuning';

export function integrate(body: CircleBody, dt: number): void {
    if (!body.active) return;
    body.x += body.vx * dt;
    body.z += body.vz * dt;
}

export function resolveCircleCollision(a: CircleBody, b: CircleBody, restitution: number = MARBLE_TUNING.RESTITUTION): boolean {
    if (!a.active || !b.active) return false;

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const distSq = dx * dx + dz * dz;
    const minDist = a.radius + b.radius;

    if (distSq >= minDist * minDist || distSq === 0) {
        return false;
    }

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const nz = dz / dist;

    // Overlap resolution
    const overlap = minDist - dist;
    const totalMass = a.mass + b.mass;
    if (totalMass > 0) {
        a.x -= nx * overlap * (b.mass / totalMass);
        a.z -= nz * overlap * (b.mass / totalMass);
        b.x += nx * overlap * (a.mass / totalMass);
        b.z += nz * overlap * (a.mass / totalMass);
    }

    // Relative velocity along normal
    const rvx = b.vx - a.vx;
    const rvz = b.vz - a.vz;
    const velAlongNormal = rvx * nx + rvz * nz;

    if (velAlongNormal > 0) return true; // Moving apart

    const impulseMag = -(1 + restitution) * velAlongNormal / (1 / a.mass + 1 / b.mass);

    a.vx -= (impulseMag / a.mass) * nx;
    a.vz -= (impulseMag / a.mass) * nz;
    b.vx += (impulseMag / b.mass) * nx;
    b.vz += (impulseMag / b.mass) * nz;

    return true;
}

export function reflectArenaWall(body: CircleBody, arenaRadius: number, restitution: number = MARBLE_TUNING.RESTITUTION): boolean {
    if (!body.active) return false;

    const distSq = body.x * body.x + body.z * body.z;
    const maxR = arenaRadius - body.radius;

    if (distSq < maxR * maxR) return false;

    const dist = Math.sqrt(distSq);
    if (dist === 0) return false;

    const nx = body.x / dist;
    const nz = body.z / dist;

    // Clamp inside wall
    body.x = nx * maxR;
    body.z = nz * maxR;

    // Reflect velocity
    const dot = body.vx * nx + body.vz * nz;
    if (dot > 0) {
        body.vx = (body.vx - (1 + restitution) * dot * nx);
        body.vz = (body.vz - (1 + restitution) * dot * nz);
    }

    return true;
}

export function reflectShieldRing(
    body: CircleBody,
    shieldRadius: number,
    restitution: number = MARBLE_TUNING.RESTITUTION
): boolean {
    if (!body.active) return false;

    const distSq = body.x * body.x + body.z * body.z;
    const minDist = shieldRadius + body.radius;

    if (distSq > minDist * minDist) return false;

    const dist = Math.sqrt(distSq);
    if (dist === 0) return false;

    const nx = body.x / dist;
    const nz = body.z / dist;

    body.x = nx * minDist;
    body.z = nz * minDist;

    const dot = body.vx * nx + body.vz * nz;
    if (dot < 0) {
        body.vx = body.vx - (1 + restitution) * dot * nx;
        body.vz = body.vz - (1 + restitution) * dot * nz;
    }

    return true;
}
