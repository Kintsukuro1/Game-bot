// ────────────────────────────────────────────────────────────────
// ARCHIVO DE CONFIGURACIÓN Y CATÁLOGOS ESTÁTICOS DEL JUEGO (GAME DATA)
// Fuente Única de Verdad (Single Source of Truth) para equilibrado,
// ítems, maestrías, carreras, crímenes y servicios.
// ────────────────────────────────────────────────────────────────

// ── 1. Gimnasios y Tiers de Entrenamiento ──
export interface GymInfo {
  tier: number;
  name: string;
  cost: number;
  energyPerTrain: number;
  multiplier: number;
  requiredExp: number;
}

export const GYMS: GymInfo[] = [
  { tier: 1, name: 'Premier Fitness', cost: 0, energyPerTrain: 5, multiplier: 2.0, requiredExp: 0 },
  { tier: 2, name: "Average Joe's", cost: 1000, energyPerTrain: 5, multiplier: 2.4, requiredExp: 200 },
  { tier: 3, name: "Woody's Workout", cost: 5000, energyPerTrain: 5, multiplier: 2.8, requiredExp: 500 },
  { tier: 4, name: 'Global Gym', cost: 15000, energyPerTrain: 5, multiplier: 3.2, requiredExp: 1000 },
  { tier: 5, name: "Gold's Gym", cost: 50000, energyPerTrain: 10, multiplier: 4.5, requiredExp: 2500 },
  { tier: 6, name: 'Anarchy Fitness', cost: 250000, energyPerTrain: 10, multiplier: 6.0, requiredExp: 6000 },
  { tier: 7, name: 'The Asylum Heavy Weight', cost: 1000000, energyPerTrain: 10, multiplier: 8.5, requiredExp: 15000 },
];

// ── 2. Callejones Criminales (Crímenes) ──
export interface CrimeDefinition {
  id: string;
  name: string;
  category: string;
  nerveCost: number;
  minLevel: number;
  baseSuccessRate: number;
  minReward: number;
  maxReward: number;
  crimeExpReward: number;
  failJailMinutes: number;
}

export const CRIMES: CrimeDefinition[] = [
  {
    id: 'search_cash',
    name: 'Buscar dinero tirado (Search for Cash)',
    category: 'Basic',
    nerveCost: 2,
    minLevel: 1,
    baseSuccessRate: 0.90,
    minReward: 5,
    maxReward: 40,
    crimeExpReward: 10,
    failJailMinutes: 0,
  },
  {
    id: 'shoplifting',
    name: 'Hurto en tiendas (Shoplifting)',
    category: 'Basic',
    nerveCost: 3,
    minLevel: 1,
    baseSuccessRate: 0.80,
    minReward: 25,
    maxReward: 150,
    crimeExpReward: 25,
    failJailMinutes: 15,
  },
  {
    id: 'pickpocketing',
    name: 'Robo de carteras (Pickpocketing)',
    category: 'Theft',
    nerveCost: 4,
    minLevel: 2,
    baseSuccessRate: 0.70,
    minReward: 80,
    maxReward: 350,
    crimeExpReward: 45,
    failJailMinutes: 20,
  },
  {
    id: 'larceny',
    name: 'Robo a propiedad (Larceny)',
    category: 'Theft',
    nerveCost: 6,
    minLevel: 3,
    baseSuccessRate: 0.60,
    minReward: 200,
    maxReward: 800,
    crimeExpReward: 80,
    failJailMinutes: 30,
  },
  {
    id: 'armed_robbery',
    name: 'Atraco a mano armada (Armed Robbery)',
    category: 'Felony',
    nerveCost: 8,
    minLevel: 5,
    baseSuccessRate: 0.50,
    minReward: 600,
    maxReward: 2500,
    crimeExpReward: 150,
    failJailMinutes: 45,
  },
  {
    id: 'hacker_bank',
    name: 'Intrusión Cibernética (Cyber Hacking)',
    category: 'Felony',
    nerveCost: 10,
    minLevel: 7,
    baseSuccessRate: 0.40,
    minReward: 1500,
    maxReward: 6000,
    crimeExpReward: 250,
    failJailMinutes: 60,
  },
];

// ── 3. Cursos Universitarios (Educación) ──
export interface CourseDefinition {
  id: string;
  name: string;
  category: string;
  cost: number;
  durationHours: number;
  bonusDescription: string;
}

export const COURSES: CourseDefinition[] = [
  {
    id: 'BIO101',
    name: 'Introducción a la Biología',
    category: 'Biology',
    cost: 500,
    durationHours: 1,
    bonusDescription: '+10% curación de botiquines médicos y menor tiempo de hospital.',
  },
  {
    id: 'LAW101',
    name: 'Derecho Comunitario (Common Law)',
    category: 'Law',
    cost: 1000,
    durationHours: 2,
    bonusDescription: 'Descuento del 20% en costos de fianza (Bail) y permiso para comprar libertad.',
  },
  {
    id: 'BUS101',
    name: 'Gestión Comercial (Business Mgmt)',
    category: 'Business',
    cost: 1500,
    durationHours: 3,
    bonusDescription: '+10% ganancias en salario de trabajo e interés bancario.',
  },
  {
    id: 'COMBAT101',
    name: 'Tácticas de Combate Urbano',
    category: 'Combat',
    cost: 2000,
    durationHours: 4,
    bonusDescription: '+5% precisión permanente en combates PvP y World Bosses.',
  },
];

// ── 4. Bienes Raíces (Propiedades) ──
export interface PropertyDefinition {
  type: string;
  name: string;
  price: number;
  maxHappy: number;
}

export const PROPERTIES: PropertyDefinition[] = [
  { type: 'Shack', name: 'Choza Inicial', price: 0, maxHappy: 100 },
  { type: 'Apartment', name: 'Departamento Moderno', price: 25000, maxHappy: 500 },
  { type: 'Penthouse', name: 'Penthouse de Lujo', price: 250000, maxHappy: 1500 },
  { type: 'Private Island', name: 'Isla Privada', price: 2500000, maxHappy: 5000 },
];

// ── 5. Profesiones y Especializaciones ──
export interface ProfessionInfo {
  id: 'HACKER' | 'CONTRABANDISTA' | 'SICARIO';
  name: string;
  emoji: string;
  description: string;
  perks: string[];
}

export const PROFESSIONS: ProfessionInfo[] = [
  {
    id: 'HACKER',
    name: 'Hacker Informático',
    emoji: '💻',
    description: 'Especialista en intrusión de sistemas y vulneración de cuentas bancarias.',
    perks: [
      'Acceso al comando de Hacking Bancario contra otros jugadores',
      'Roba entre 3% y 8% del saldo en banco del objetivo',
      'Tasa de éxito potenciada por tu estadística de Inteligencia',
    ],
  },
  {
    id: 'CONTRABANDISTA',
    name: 'Contrabandista Internacional',
    emoji: '📦',
    description: 'Experto en logística clandestina y evasión de aduanas.',
    perks: [
      '10% de descuento automático en todas las compras del Mercado Negro',
      '-50% de tiempo de espera en vuelos internacionales',
      'Doble capacidad de carga de mercancías del extranjero',
    ],
  },
  {
    id: 'SICARIO',
    name: 'Sicario & Cazador de Recompensas',
    emoji: '🎯',
    description: 'Asesino a sueldo implacable especializado en duelos de alto riesgo.',
    perks: [
      'Multiplicador x2 en recompensas cobradas del Tablón de Bounties',
      'Probabilidad de Asalto Crítico (+50% daño) en combates PvP',
      'Mayor botín robado al asaltar (MUG) jugadores vencidos',
    ],
  },
];

// ── 6. Agencias de Viajes (Vuelos Internacionales) ──
export interface DestinationDefinition {
  id: string;
  name: string;
  cost: number;
  durationMinutes: number;
}

export const DESTINATIONS: DestinationDefinition[] = [
  { id: 'Mexico', name: 'México 🇲🇽', cost: 500, durationMinutes: 15 },
  { id: 'Colombia', name: 'Colombia 🇨🇴', cost: 800, durationMinutes: 25 },
  { id: 'United Kingdom', name: 'Reino Unido 🇬🇧', cost: 1500, durationMinutes: 45 },
  { id: 'Russia', name: 'Rusia 🇷🇺', cost: 2200, durationMinutes: 60 },
  { id: 'Japan', name: 'Japón 🇯🇵', cost: 3000, durationMinutes: 90 },
  { id: 'South Africa', name: 'Sudáfrica 🇿🇦', cost: 3800, durationMinutes: 100 },
  { id: 'Switzerland', name: 'Suiza 🇨🇭', cost: 5000, durationMinutes: 120 },
  { id: 'United Arab Emirates', name: 'Emiratos Árabes Unidos 🇦🇪', cost: 7000, durationMinutes: 150 },
];

// ── 7. Carreras Ilegales de Drag Racing ──
export interface RaceTrack {
  id: string;
  name: string;
  distanceKm: number;
  entryFee: number;
}

export const TRACKS: RaceTrack[] = [
  { id: 'Industrial Ring', name: 'Anillo Industrial', distanceKm: 1.5, entryFee: 100 },
  { id: 'Downtown Highway', name: 'Autopista Central', distanceKm: 3.2, entryFee: 500 },
  { id: 'Speedway', name: 'Autódromo de Sinford', distanceKm: 5.0, entryFee: 2000 },
];

// ── 8. Bolsa de Valores (Stock Market) ──
export interface StockDefinition {
  symbol: string;
  name: string;
  price: number;
}

export const INITIAL_STOCKS: StockDefinition[] = [
  { symbol: 'TNC', name: 'Torn National Bank', price: 150 },
  { symbol: 'SYS', name: 'Sinford Systems', price: 420 },
  { symbol: 'MED', name: 'PharmaCorp Meds', price: 890 },
  { symbol: 'OIL', name: 'Underworld Energy', price: 1250 },
];

// ── 9. Árbol de Maestrías del Personaje (Perks) ──
export type MasteryBranch = 'combat' | 'crime' | 'business' | 'faction';

export interface PerkDefinition {
  id: string;
  name: string;
  branch: MasteryBranch;
  cost: number;
  description: string;
  emoji: string;
}

export const PERKS: PerkDefinition[] = [
  { id: 'PERK_ENERGY_CAP', name: 'Tanque Energético', branch: 'combat', cost: 1, description: '+25 Energía Máxima permanente', emoji: '⚡' },
  { id: 'PERK_NERVE_CAP', name: 'Mente Fría', branch: 'crime', cost: 1, description: '+5 Nerve Máximo permanente', emoji: '🧠' },
  { id: 'PERK_STRENGTH_BOOST', name: 'Fuerza Bruta', branch: 'combat', cost: 1, description: '+15 a Fuerza de combate', emoji: '💪' },
  { id: 'PERK_DEFENSE_BOOST', name: 'Piel de Titanio', branch: 'combat', cost: 1, description: '+15 a Defensa de combate', emoji: '🛡️' },
  { id: 'PERK_SPEED_BOOST', name: 'Reflejos Felinos', branch: 'combat', cost: 1, description: '+15 a Velocidad de combate', emoji: '⚡' },
  { id: 'PERK_CRIME_SKILL', name: 'Gato Callejero', branch: 'crime', cost: 1, description: '+10 a Habilidad de Crimen', emoji: '🕵️' },
  { id: 'PERK_WORK_STATS', name: 'Ética Laboral', branch: 'business', cost: 1, description: '+15 a Trabajo Manual e Inteligencia', emoji: '💼' },
];
