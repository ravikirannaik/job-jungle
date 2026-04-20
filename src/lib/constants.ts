// Game constants — matches the physical Job Jungle MP schedules

// Kite price per unit (fixed all rounds)
export const KITE_PRICE = 15;

// Marginal Product schedules (kites produced by nth worker)
export const PINK_KITES = [5, 8, 10, 11, 12, 12]; // total kites with 1..6 pink workers
export const BLUE_KITES = [8, 14, 19, 22, 24, 25]; // total kites with 1..6 blue workers

// Marginal Product of nth worker (kites)
export const PINK_MP = [5, 3, 2, 1, 1, 0];
export const BLUE_MP = [8, 6, 5, 3, 2, 1];

// P x MP (value of marginal product) — max wage employer should pay
export const PINK_PxMP = [75, 45, 30, 15, 15, 0];
export const BLUE_PxMP = [120, 90, 75, 45, 30, 15];

// Public Assistance (unemployment benefit per round)
export const PA_PINK = 15;
export const PA_BLUE = 35;

// Education upgrade cost
export const EDUCATION_COST = 25;

// Employer entry threshold
export const EMPLOYER_ENTRY_THRESHOLD = 100;
export const EMPLOYER_ENTRY_AFTER_ROUND = 3;

// Endowment scheme by first letter of name
export const ENDOWMENT_SCHEME: Record<string, number> = {
  A: 9, B: 9, C: 9, D: 9, E: 9, F: 9, G: 9,
  H: 10, I: 10, J: 10, K: 10, L: 10, M: 10, N: 10, O: 10, P: 10,
  Q: 7, R: 7, S: 7, T: 7, U: 7, V: 7,
  W: 5, X: 5, Y: 5, Z: 5,
};

// Max pending offers an employer can have at once (queue capacity)
export const MAX_PENDING_PER_EMPLOYER = 5;

// Default game settings
export const DEFAULT_MAX_ROUNDS = 6;
export const DEFAULT_ROUND_DURATION_SEC = 420; // 7 minutes

// Firm names assigned to employer pairs
export const FIRM_NAMES = [
  'AdamSmith Corp', 'KarlMarx Corp', 'GBecker Inc', 'Mincer LLC', 'Claudia Co', 'Borjas Ltd',
  'Firm G', 'Firm H', 'Firm I', 'Firm J',
];
