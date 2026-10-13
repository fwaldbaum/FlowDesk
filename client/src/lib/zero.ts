export const ZERO_URL = 'https://zerosolutions.cl';

/**
 * From this moment the FlowDesk landing page sends visitors to ZERO Solutions. Chile is on summer
 * time (UTC-3) in October. Only "/" moves: the app, sign-in, ZERO sign-on and embedded forms keep working.
 */
export const ZERO_MOVE_AT = Date.parse('2026-10-14T08:00:00-03:00');

export const hasMovedToZero = (now = Date.now()) => now >= ZERO_MOVE_AT;
