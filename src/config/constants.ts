import dotenv from 'dotenv';
dotenv.config();

// Servidor por Defecto
export const DEFAULT_GUILD_ID = process.env.DEFAULT_GUILD_ID || 'GLOBAL';

// Constantes Económicas y Limites Anti-Exploits
export const MAX_CASINO_BET = BigInt(process.env.MAX_CASINO_BET || '100000');
export const MAX_INVESTMENT_CAP = BigInt(process.env.MAX_INVESTMENT_CAP || '1000000');
export const INVESTMENT_INTEREST_RATE_28_DAYS = Number(process.env.INVESTMENT_INTEREST_RATE_28_DAYS || '0.06');
export const COMPANY_PAYBACK_DAYS = Number(process.env.COMPANY_PAYBACK_DAYS || '60');

// Facciones & Sindicatos
export const FACTION_CREATION_FEE = BigInt(process.env.FACTION_CREATION_FEE || '50000');
export const FACTION_MAX_MEMBERS = Number(process.env.FACTION_MAX_MEMBERS || '20');

// Servicios Médicos y Rehabilitación en Suiza
export const SWITZERLAND_DETOX_COST = BigInt(process.env.SWITZERLAND_DETOX_COST || '25000');

// Combate PvP & Hospitalización
export const COMBAT_ENERGY_COST = Number(process.env.COMBAT_ENERGY_COST || '25');
export const NEWBIE_LEVEL_PROTECTION = Number(process.env.NEWBIE_LEVEL_PROTECTION || '2');
export const HOSPITAL_DURATION_MINUTES = Number(process.env.HOSPITAL_DURATION_MINUTES || '60');
