import { BASE } from './base';

export const ZERO_URL = 'https://zerosolutions.cl';
/** FlowDesk's home on the ZERO site (served by its proxy). */
export const ZERO_FLOWDESK_URL = 'https://zerosolutions.cl/flowdesk/';

/** Chile is on summer time (UTC-3) in October. */
export const ZERO_MOVE_AT = Date.parse('2026-10-14T08:00:00-03:00');

/**
 * From ZERO_MOVE_AT the landing page on FlowDesk's own domain sends visitors to zerosolutions.cl/flowdesk.
 * Never under the proxy itself (that would loop), and only "/": the app, sign-in and forms keep working.
 */
export const hasMovedToZero = (now = Date.now()) => BASE === '' && now >= ZERO_MOVE_AT;
