# 🔍 04_CURRENT_STATE.md — Estado de Implementación y Roadmap Técnico (`src/`)

## 1. Mapeo de Módulos Implementados

| Sistema | Estado en `src/` | Archivo Principal | Estado de Pruebas |
| :--- | :---: | :--- | :---: |
| **Persistencia & Guild Isolation** | 🟢 100% | [src/db/prisma.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/db/prisma.ts) | 🟢 Tests OK |
| **Combate por Partes Corporales** | 🟢 100% | [src/services/combatService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/combatService.ts) | 🟢 Tests OK |
| **Crímenes & Crime Skill** | 🟢 100% | [src/services/crimeService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/crimeService.ts) | 🟢 Tests OK |
| **Prisión / Fianza / Bust** | 🟢 100% | [src/services/jailService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/jailService.ts) | 🟢 Tests OK |
| **Bounties & Contratos** | 🟢 100% | [src/services/bountyService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/bountyService.ts) | 🟢 Tests OK |
| **Facciones & Guerras** | 🟢 100% | [src/services/factionService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/factionService.ts) | 🟢 Tests OK |
| **Propiedades & Hospedaje** | 🟢 100% | [src/services/propertyService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/propertyService.ts) | 🟢 Tests OK |
| **Empresas Privadas & Empleos** | 🟢 100% | [src/services/companyService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/companyService.ts) | 🟢 Tests OK |
| **Bolsa de Valores & Acciones** | 🟢 100% | [src/services/stockService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/stockService.ts) | 🟢 Tests OK |
| **Gimnasio & Tiers de Entrenamiento** | 🟢 100% | [src/services/gymService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/gymService.ts) | 🟢 Tests OK |
| **Mercado Negro & Drogas** | 🟢 100% | [src/services/blackMarketService.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/services/blackMarketService.ts) | 🟢 Tests OK |
| **UI de Discord (Embeds & Menús)** | 🟢 100% | [src/ui/embeds.ts](file:///c:/Users/Felipe/Desktop/Proyectos/Juego%20discord/src/ui/embeds.ts) | 🟢 Visual Base OK |

---

## 2. Roadmap de Refactorización Técnica (`src/`)

### Paso 1: Nuevos Modelos Prisma Independientes
* Crear los modelos `PlayerMastery`, `CityDistrict` y `PlayerAddiction` en `prisma/schema.prisma` para aislar la lógica sin contaminar las tablas existentes.

### Paso 2: Consolidación de Comandos Slash (`src/commands/`)
* Registrar únicamente **`/ciudad`** (Hub Visual principal) y **`/admin`** (Moderación/Soporte).
* Eliminar registros slash secundarios para mantener limpia la lista de comandos de Discord.

### Paso 3: Reglas Anti-Farm y Maestrías en Servicios (`src/services/`)
* Aplicar el límite de máximo 2 Mugs/día por víctima en `combatService.ts`.
* Anular XP en PvP repetido al mismo objetivo en < 1 hora.
* Conectar la ganancia de Experiencia de Maestría por uso en Gimnasio, Crímenes, Trabajos y Guerras.
