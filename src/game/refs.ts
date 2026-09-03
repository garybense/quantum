export interface HotGameRefs {
    locusPos: { x: number; z: number };
    isPulling: boolean;
    isMoving: boolean;
    moveVel: number;
    joystickVector: { gx: number; gz: number; active: boolean };
}

export const gameRefs: HotGameRefs = {
    locusPos: { x: 0, z: 0 },
    isPulling: false,
    isMoving: false,
    moveVel: 0,
    joystickVector: { gx: 0, gz: 0, active: false },
};
