import { describe, expect, it } from 'vitest';
import { MAX_SUBSTEPS, SIM_STEP } from '../../src/config/time.ts';
import { advanceFixedStep } from '../../src/sim/loop.ts';

/* A power-of-two step keeps the arithmetic exact so results can be compared with toBe. */
const STEP = 1 / 64;

describe('advanceFixedStep', () => {
  it('runs no step and carries time when the frame is shorter than a step', () => {
    const r = advanceFixedStep(0, STEP / 2, STEP, 5);
    expect(r).toEqual({ steps: 0, accumulator: STEP / 2, alpha: 0.5, dropped: 0 });
  });

  it('carries the remainder so two half-step frames make one step', () => {
    const a = advanceFixedStep(0, STEP / 2, STEP, 5);
    const b = advanceFixedStep(a.accumulator, STEP / 2, STEP, 5);
    expect(b.steps).toBe(1);
    expect(b.accumulator).toBe(0);
  });

  it('runs several steps for a long frame and keeps the fraction', () => {
    const r = advanceFixedStep(0, STEP * 3.25, STEP, 5);
    expect(r.steps).toBe(3);
    expect(r.accumulator).toBe(STEP * 0.25);
    expect(r.alpha).toBe(0.25);
    expect(r.dropped).toBe(0);
  });

  it('caps steps at maxSteps and drops the whole-step backlog', () => {
    const r = advanceFixedStep(0, STEP * 9.5, STEP, 5);
    expect(r.steps).toBe(5);
    expect(r.dropped).toBe(STEP * 4);
    expect(r.accumulator).toBe(STEP * 0.5);
  });

  it('ignores negative frame time', () => {
    expect(advanceFixedStep(STEP / 4, -1, STEP, 5)).toEqual({ steps: 0, accumulator: STEP / 4, alpha: 0.25, dropped: 0 });
  });

  it('counts a frame of exactly one real 60 Hz step as one step despite float drift', () => {
    let acc = 0;
    let total = 0;
    for (let i = 0; i < 600; i++) {
      const r = advanceFixedStep(acc, SIM_STEP, SIM_STEP, MAX_SUBSTEPS);
      acc = r.accumulator;
      total += r.steps;
      expect(r.steps).toBe(1);
    }
    expect(total).toBe(600);
  });
});
