import { STEP_EPSILON } from '../config/time.ts';

export interface FixedStepResult {
  /* whole simulation steps to run this frame */
  steps: number;
  /* leftover time carried into the next frame, always less than one step */
  accumulator: number;
  /* accumulator / step, for interpolating rendering between the last two states */
  alpha: number;
  /* time discarded because the frame needed more than maxSteps */
  dropped: number;
}

/* Fixed-timestep accumulator: converts variable frame time into whole simulation steps. Pure. */
export function advanceFixedStep(
  accumulator: number,
  frameDt: number,
  step: number,
  maxSteps: number,
): FixedStepResult {
  let acc = accumulator + Math.max(0, frameDt);
  const wanted = Math.floor((acc + STEP_EPSILON) / step);
  const steps = Math.min(wanted, maxSteps);
  acc = Math.max(0, acc - steps * step);
  let dropped = 0;
  if (wanted > maxSteps) {
    const keep = acc % step;
    dropped = acc - keep;
    acc = keep;
  }
  return { steps, accumulator: acc, alpha: acc / step, dropped };
}
