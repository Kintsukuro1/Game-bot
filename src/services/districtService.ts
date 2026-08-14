import { prisma } from '../db/prisma.js';

export interface DistrictInfo {
  id: string;
  name: string;
  emoji: string;
  perkDescription: string;
}

export const DISTRICT_DEFINITIONS: Record<string, DistrictInfo> = {
  DOCKS: {
    id: 'DOCKS',
    name: 'Docks / Zona Portuaria',
    emoji: '🚢',
    perkDescription: '-15% en costos de vuelos internacionales y contrabando',
  },
  FINANCIAL: {
    id: 'FINANCIAL',
    name: 'Centro Financiero',
    emoji: '🏦',
    perkDescription: '3% de impuesto sobre los depósitos bancarios de la ciudad dirigidos a la tesorería de la facción',
  },
  INDUSTRIAL: {
    id: 'INDUSTRIAL',
    name: 'Distrito Industrial',
    emoji: '🏭',
    perkDescription: '+10% de daño en guerras y descuento en armas pesadas',
  },
  RED_LIGHT: {
    id: 'RED_LIGHT',
    name: 'Barrio Rojo / Mercado Negro',
    emoji: '🍷',
    perkDescription: '5% de comisión sobre todas las transacciones del Mercado Negro',
  },
};

export class DistrictService {
  /**
   * Obtiene la lista de los 4 distritos urbanos y la facción que los controla.
   */
  static async getDistricts(guildId: string = 'GLOBAL') {
    const districts = await prisma.cityDistrict.findMany({
      where: { guildId },
    });

    const result = [];
    for (const key of Object.keys(DISTRICT_DEFINITIONS)) {
      const def = DISTRICT_DEFINITIONS[key];
      const existing = districts.find((d) => d.districtId === key);

      let controllingFactionName = 'Ninguna (Territorio Neutral)';
      if (existing?.controllingFactionId) {
        const faction = await prisma.faction.findUnique({
          where: { id: existing.controllingFactionId },
        });
        if (faction) {
          controllingFactionName = faction.name;
        }
      }

      result.push({
        ...def,
        controllingFactionId: existing?.controllingFactionId || null,
        controllingFactionName,
        domainPoints: existing?.domainPoints || 0,
      });
    }

    return result;
  }

  /**
   * Añade Puntos de Dominio a una facción en un distrito específico.
   */
  static async addDomainPoints(
    guildId: string = 'GLOBAL',
    districtId: string,
    factionId: string,
    points: number
  ) {
    if (!DISTRICT_DEFINITIONS[districtId]) {
      throw new Error(`Distrito inválido: ${districtId}`);
    }

    const district = await prisma.cityDistrict.findUnique({
      where: { guildId_districtId: { guildId, districtId } },
    });

    if (!district) {
      return prisma.cityDistrict.create({
        data: {
          guildId,
          districtId,
          controllingFactionId: factionId,
          domainPoints: points,
        },
      });
    }

    const newPoints = district.domainPoints + points;
    // Si la facción supera los puntos existentes, reclama el control
    const newOwner = points > district.domainPoints ? factionId : district.controllingFactionId;

    return prisma.cityDistrict.update({
      where: { id: district.id },
      data: {
        domainPoints: newPoints,
        controllingFactionId: newOwner,
      },
    });
  }
}
