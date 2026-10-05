import type { SimState } from './state.ts';

/* FNV-1a over the exact bit patterns of the state's numbers: equal hashes mean bit-identical states.
   Feeding every tick into one hasher fingerprints a whole trajectory, which matters because different
   paths can end in the same state (landing snaps height, speed caps snap velocity). */
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export class StateHasher {
  private h = FNV_OFFSET;
  private readonly view = new DataView(new ArrayBuffer(8));

  add(s: SimState): this {
    const p = s.player;
    const n = p.wallNormal;
    const values = [
      s.tick, s.respawns, s.justRespawned ? 1 : 0,
      p.pos.x, p.pos.y, p.pos.z, p.vel.x, p.vel.y, p.vel.z, p.yaw, p.pitch,
      p.onGround ? 1 : 0, p.crouched ? 1 : 0, p.sliding ? 1 : 0, p.wallRunning ? 1 : 0, p.jumpHeld ? 1 : 0,
      n ? 1 : 0, n ? n.x : 0, n ? n.y : 0, n ? n.z : 0,
    ];
    for (const v of values) {
      this.view.setFloat64(0, v);
      for (let i = 0; i < 8; i++) this.h = Math.imul(this.h ^ this.view.getUint8(i), FNV_PRIME);
    }
    return this;
  }

  digest(): string {
    return (this.h >>> 0).toString(16).padStart(8, '0');
  }
}

export function hashSimState(s: SimState): string {
  return new StateHasher().add(s).digest();
}
