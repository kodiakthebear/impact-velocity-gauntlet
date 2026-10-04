/* Velocity simulation timing. The simulation always advances in whole fixed steps. */
export const SIM_HZ = 60;
export const SIM_STEP = 1 / SIM_HZ;
/* Most steps run for one rendered frame; after a long stall the backlog is dropped instead of spiralling. */
export const MAX_SUBSTEPS = 5;
/* Absorbs floating-point drift so a frame of exactly one step's length is not counted as slightly short. */
export const STEP_EPSILON = 1e-9;
/* Weight of the newest frame in the smoothed frame-time readout. */
export const FRAME_TIME_SMOOTHING = 0.1;
