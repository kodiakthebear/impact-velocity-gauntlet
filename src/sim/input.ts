/* One tick of player intent. Look angles are absolute so a replay needs nothing but these frames. */
export interface InputFrame {
  /* -1 left .. 1 right */
  moveX: number;
  /* -1 back .. 1 forward */
  moveZ: number;
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
  yaw: number;
  pitch: number;
}

export function neutralInput(yaw = 0, pitch = 0): InputFrame {
  return { moveX: 0, moveZ: 0, sprint: false, crouch: false, jump: false, yaw, pitch };
}

/* Compact replay encoding: [moveX, moveZ, buttons, yaw, pitch]. JSON round-trips numbers exactly. */
export type EncodedInput = [number, number, number, number, number];

const SPRINT = 1;
const CROUCH = 2;
const JUMP = 4;

export function encodeInput(f: InputFrame): EncodedInput {
  const buttons = (f.sprint ? SPRINT : 0) | (f.crouch ? CROUCH : 0) | (f.jump ? JUMP : 0);
  return [f.moveX, f.moveZ, buttons, f.yaw, f.pitch];
}

export function decodeInput(e: EncodedInput): InputFrame {
  const [moveX, moveZ, buttons, yaw, pitch] = e;
  return {
    moveX,
    moveZ,
    sprint: (buttons & SPRINT) !== 0,
    crouch: (buttons & CROUCH) !== 0,
    jump: (buttons & JUMP) !== 0,
    yaw,
    pitch,
  };
}
