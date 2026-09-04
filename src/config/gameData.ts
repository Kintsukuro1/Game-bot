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
export type FacultyCategory = 'Biology' | 'Law' | 'Business' | 'Combat' | 'ComputerScience';

export interface CourseDefinition {
  id: string;
  name: string;
  category: FacultyCategory;
  prerequisiteId?: string;
  cost: number;
  durationHours: number;
  bonusDescription: string;
  statBonus?: {
    intelligence?: number;
    endurance?: number;
    manualLabor?: number;
    crimeSkill?: number;
    strength?: number;
  };
  passivePerk?: {
    type:
      | 'HEALING_BOOST'
      | 'HOSPITAL_REDUCTION'
      | 'HEALTH_CAP'
      | 'BAIL_DISCOUNT'
      | 'BUST_SUCCESS'
      | 'AUTO_BUST'
      | 'SALARY_BOOST'
      | 'STOCK_DIVIDEND'
      | 'BANK_INTEREST_BOOST'
      | 'COMBAT_ACCURACY'
      | 'COMBAT_CRIT'
      | 'BOSS_DAMAGE'
      | 'CYBER_EXP'
      | 'CYBER_STEAL'
      | 'HACK_NERVE_REDUCTION';
    value: number;
  };
}

export const COURSES: CourseDefinition[] = [
  // ── 1. Facultad de Medicina & Bioquímica ──
  {
    id: 'BIO101',
    name: 'Introducción a la Biología',
    category: 'Biology',
    cost: 500,
    durationHours: 1,
    bonusDescription: '+10% curación con botiquines médicos.',
    statBonus: { intelligence: 5 },
    passivePerk: { type: 'HEALING_BOOST', value: 0.10 },
  },
  {
    id: 'BIO201',
    name: 'Farmacología Clandestina',
    category: 'Biology',
    prerequisiteId: 'BIO101',
    cost: 2500,
    durationHours: 3,
    bonusDescription: '-20% tiempo de convalecencia en Hospital.',
    statBonus: { endurance: 10 },
    passivePerk: { type: 'HOSPITAL_REDUCTION', value: 0.20 },
  },
  {
    id: 'BIO301',
    name: 'Licenciatura en Medicina & Genética',
    category: 'Biology',
    prerequisiteId: 'BIO201',
    cost: 10000,
    durationHours: 8,
    bonusDescription: '+15% HP Máximo permanente.',
    statBonus: { intelligence: 20, endurance: 15 },
    passivePerk: { type: 'HEALTH_CAP', value: 0.15 },
  },

  // ── 2. Facultad de Derecho & Criminología ──
  {
    id: 'LAW101',
    name: 'Derecho Comunitario (Common Law)',
    category: 'Law',
    cost: 1000,
    durationHours: 2,
    bonusDescription: '-20% descuento en costo de fianza (Bail) en cárcel.',
    statBonus: { intelligence: 5 },
    passivePerk: { type: 'BAIL_DISCOUNT', value: 0.20 },
  },
  {
    id: 'LAW201',
    name: 'Procedimientos Penales & Fugas',
    category: 'Law',
    prerequisiteId: 'LAW101',
    cost: 5000,
    durationHours: 4,
    bonusDescription: '+15% éxito al rescatar aliados prisioneros (Bust).',
    statBonus: { crimeSkill: 10 },
    passivePerk: { type: 'BUST_SUCCESS', value: 0.15 },
  },
  {
    id: 'LAW301',
    name: 'Licenciatura en Criminología & Litigio',
    category: 'Law',
    prerequisiteId: 'LAW201',
    cost: 15000,
    durationHours: 10,
    bonusDescription: '-35% descuento acumulado en fianzas de prisión.',
    statBonus: { intelligence: 20, crimeSkill: 15 },
    passivePerk: { type: 'BAIL_DISCOUNT', value: 0.35 },
  },

  // ── 3. Facultad de Economía & Finanzas ──
  {
    id: 'BUS101',
    name: 'Gestión Comercial (Business Mgmt)',
    category: 'Business',
    cost: 1500,
    durationHours: 3,
    bonusDescription: '+10% ganancias en salario de empleos.',
    statBonus: { intelligence: 5, manualLabor: 5 },
    passivePerk: { type: 'SALARY_BOOST', value: 0.10 },
  },
  {
    id: 'BUS201',
    name: 'Mercado de Capitales & Inversiones',
    category: 'Business',
    prerequisiteId: 'BUS101',
    cost: 6000,
    durationHours: 5,
    bonusDescription: '+15% dividendos cobrados en la Bolsa de Valores.',
    statBonus: { intelligence: 10 },
    passivePerk: { type: 'STOCK_DIVIDEND', value: 0.15 },
  },
  {
    id: 'BUS301',
    name: 'Licenciatura en Alta Dirección (MBA)',
    category: 'Business',
    prerequisiteId: 'BUS201',
    cost: 20000,
    durationHours: 12,
    bonusDescription: '+2% adicional en tasa de interés de inversiones bancarias.',
    statBonus: { intelligence: 25, manualLabor: 15 },
    passivePerk: { type: 'BANK_INTEREST_BOOST', value: 0.02 },
  },

  // ── 4. Facultad de Ciencias Militares & Tácticas ──
  {
    id: 'COMBAT101',
    name: 'Tácticas de Combate Urbano',
    category: 'Combat',
    cost: 2000,
    durationHours: 4,
    bonusDescription: '+5% precisión permanente en combates PvP y Bosses.',
    statBonus: { strength: 5 },
    passivePerk: { type: 'COMBAT_ACCURACY', value: 0.05 },
  },
  {
    id: 'COMBAT201',
    name: 'Balística & Operaciones de Asalto',
    category: 'Combat',
    prerequisiteId: 'COMBAT101',
    cost: 8000,
    durationHours: 6,
    bonusDescription: '+8% daño crítico en duelos PvP.',
    statBonus: { strength: 10 },
    passivePerk: { type: 'COMBAT_CRIT', value: 0.08 },
  },
  {
    id: 'COMBAT301',
    name: 'Licenciatura en Estrategia Bélica',
    category: 'Combat',
    prerequisiteId: 'COMBAT201',
    cost: 25000,
    durationHours: 14,
    bonusDescription: '+10% daño extra contra World Bosses y Guerras.',
    statBonus: { strength: 20, endurance: 15 },
    passivePerk: { type: 'BOSS_DAMAGE', value: 0.10 },
  },

  // ── 5. Facultad de Ciberseguridad e Informática ──
  {
    id: 'COMP101',
    name: 'Algoritmos & Programación Inicial',
    category: 'ComputerScience',
    cost: 1800,
    durationHours: 3,
    bonusDescription: '+15% EXP obtenida en crímenes cibernéticos.',
    statBonus: { intelligence: 5 },
    passivePerk: { type: 'CYBER_EXP', value: 0.15 },
  },
  {
    id: 'COMP201',
    name: 'Ciberseguridad & Scripting Ofensivo',
    category: 'ComputerScience',
    prerequisiteId: 'COMP101',
    cost: 7500,
    durationHours: 6,
    bonusDescription: '+15% dinero robado al hackear cuentas bancarias.',
    statBonus: { intelligence: 10 },
    passivePerk: { type: 'CYBER_STEAL', value: 0.15 },
  },
  {
    id: 'COMP301',
    name: 'Licenciatura en Ingeniería de Sistemas',
    category: 'ComputerScience',
    prerequisiteId: 'COMP201',
    cost: 22000,
    durationHours: 12,
    bonusDescription: '-50% costo de Nerve en Hacking cibernético.',
    statBonus: { intelligence: 25, crimeSkill: 10 },
    passivePerk: { type: 'HACK_NERVE_REDUCTION', value: 0.50 },
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
