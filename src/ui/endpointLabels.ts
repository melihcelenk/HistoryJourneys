import type { EndpointSlot } from '../app/store';

/** Names of the two ends of a journey, shared by the top bar and the start screen. */
export const SLOT_LABELS: Record<EndpointSlot, string> = { from: 'Başlangıç', to: 'Varış' };

/** Shown in a slot that has no figure yet. */
export const EMPTY_SLOT_LABEL = 'Figür seç';
