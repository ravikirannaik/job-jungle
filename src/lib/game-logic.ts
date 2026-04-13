import {
  ENDOWMENT_SCHEME,
  PINK_PxMP,
  BLUE_PxMP,
  PINK_KITES,
  BLUE_KITES,
  PINK_MP,
  BLUE_MP,
  KITE_PRICE,
} from './constants';

/**
 * Calculate endowment from first letter of name.
 * A-G=$9, H-P=$10, Q-V=$7, W-Z=$5
 */
export function calculateEndowment(name: string): number {
  const letter = name.trim()[0]?.toUpperCase();
  if (!letter) return 7;
  return ENDOWMENT_SCHEME[letter] ?? 7;
}

/**
 * Get the P x MP value for the nth hire of a given skill.
 * hirePosition is 1-indexed (1 = first hire).
 * Returns 0 if position exceeds schedule length.
 */
export function getPxMP(skill: 'pink' | 'blue', hirePosition: number): number {
  const schedule = skill === 'pink' ? PINK_PxMP : BLUE_PxMP;
  const idx = hirePosition - 1;
  if (idx < 0 || idx >= schedule.length) return 0;
  return schedule[idx];
}

/**
 * Get total kites produced by n workers of a given skill.
 */
export function getTotalKites(skill: 'pink' | 'blue', numWorkers: number): number {
  const schedule = skill === 'pink' ? PINK_KITES : BLUE_KITES;
  if (numWorkers <= 0) return 0;
  if (numWorkers > schedule.length) return schedule[schedule.length - 1];
  return schedule[numWorkers - 1];
}

/**
 * Get marginal product (in kites) for the nth worker.
 */
export function getMP(skill: 'pink' | 'blue', hirePosition: number): number {
  const schedule = skill === 'pink' ? PINK_MP : BLUE_MP;
  const idx = hirePosition - 1;
  if (idx < 0 || idx >= schedule.length) return 0;
  return schedule[idx];
}

/**
 * Calculate employer revenue for a round given hire counts.
 */
export function calculateRevenue(pinkHired: number, blueHired: number): number {
  const pinkKites = getTotalKites('pink', pinkHired);
  const blueKites = getTotalKites('blue', blueHired);
  return (pinkKites + blueKites) * KITE_PRICE;
}

/**
 * Generate a 4-digit room code (avoiding ambiguous chars).
 */
export function generateRoomCode(): string {
  const chars = '2345679ACDEFGHJKLMNPQRSTUVWXY';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Generate a session token for player reconnection.
 */
export function generateSessionToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
