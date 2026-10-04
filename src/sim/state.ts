/* Velocity simulation state. Slice 0 only counts fixed steps; movement arrives in slice 1. */
export interface SimState {
  tick: number;
}

export function createSimState(): SimState {
  return { tick: 0 };
}

export function stepSim(state: SimState): void {
  state.tick += 1;
}
