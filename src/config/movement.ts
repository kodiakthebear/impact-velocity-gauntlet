/* Velocity player movement. Starting values are Impact's (legacy updatePlayer/moveBody), tuned later.
   Units: metres, seconds, radians. */

export const BODY = {
  radius: 0.45,
  standHeight: 1.8,
  crouchHeight: 1.15,
  /* gap kept between the body and anything it collides with */
  skin: 0.001,
  /* overlaps thinner than this count as touching, not colliding */
  touchEpsilon: 0.001,
};

export const GRAVITY = 22;

export const GROUND = {
  walkSpeed: 7.5,
  sprintSpeed: 11.5,
  crouchSpeed: 4.5,
  accel: 9,
  friction: 8.5,
  /* friction scales with at least this speed, so slow drift stops quickly */
  frictionFloorSpeed: 4,
  /* below this horizontal speed the player stops dead */
  stopSpeed: 0.02,
  jumpSpeed: 8.6,
};

export const AIR = {
  speed: 11.5,
  accel: 1.6,
  /* small, sharp extra acceleration that allows strafe-jumping */
  strafeSpeed: 1.6,
  strafeAccel: 38,
};

export const SLIDE = {
  minStartSpeed: 7,
  boost: 1.32,
  maxSpeed: 16.5,
  endSpeed: 4.5,
  friction: 0.55,
};

export const WALL_RUN = {
  /* side rays start this far above the feet and reach this far from the body centre */
  probeHeight: 1.1,
  probeRange: 0.95,
  minSpeed: 5.5,
  maxUpSpeed: 4,
  gravity: 14,
  extraFall: 6,
  maxFallSpeed: 1.5,
  stick: 2,
  jumpPush: 7.5,
  jumpUp: 7.5,
  jumpForward: 2.5,
};

export const LOOK = {
  pitchLimit: 1.5,
};
