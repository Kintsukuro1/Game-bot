# 🎮 Plan de Desarrollo — Juego Estilo Torn para Discord

> Documento maestro de planificación.
>
> **Objetivo:** construir un juego de navegador/Discord inspirado en la estructura de Torn, adaptado a Discord, con economía persistente, progresión, combate, crimen, empresas, facciones, mercado y sistemas sociales.
>
> **Enfoque:** desarrollar por fases incrementales. Cada fase debe dejar el proyecto en un estado funcional y comprobable antes de avanzar.

---

<details open>
<summary><b>📌 Tabla de Contenidos / Índice de Navegación</b> (Click para replegar)</summary>

### 📑 Fases del Proyecto
- [0. Objetivo del proyecto](#0-objetivo-del-proyecto)
- [1. Alcance general](#1-alcance-general)
- [2. Niveles de lanzamiento](#2-niveles-de-lanzamiento)
- [3. FASE 0 — PREPRODUCCIÓN](#3-fase-0--preproducción)
- [4. FASE 1 — FUNDACIONES TÉCNICAS](#4-fase-1--fundaciones-técnicas)
- [5. FASE 2 — JUGADOR Y PROGRESIÓN BÁSICA](#5-fase-2--jugador-y-progresión-básica)
- [6. FASE 3 — INVENTARIO Y ECONOMÍA BÁSICA](#6-fase-3--inventario-y-economía-básica)
- [7. FASE 4 — GIMNASIO](#7-fase-4--gimnasio)
- [8. FASE 5 — COMBATE PvP](#8-fase-5--combate-pvp)
- [9. FASE 6 — CRÍMENES](#9-fase-6--crímenes)
- [10. FASE 7 — BOUNTIES Y MISIONES BÁSICAS](#10-fase-7--bounties-y-misiones-básicas)
- [11. FASE 8 — NIVEL MÍNIMAMENTE LISTO](#11-fase-8--nivel-mínimamente-listo)
- [12. FASE 9 — JOBS Y EDUCACIÓN](#12-fase-9--jobs-y-educación)
- [13. FASE 10 — FACTIONS](#13-fase-10--factions)
- [14. FASE 11 — GUERRAS Y CONFLICTOS](#14-fase-11--guerras-y-conflictos)
- [15. FASE 12 — PROPIEDADES](#15-fase-12--propiedades)
- [16. FASE 13 — VIAJES](#16-fase-13--viajes)
- [17. FASE 14 — MERCADO Y TRADING](#17-fase-14--mercado-y-trading)
- [18. FASE 15 — BANCO E INVERSIONES](#18-fase-15--banco-e-inversiones)
- [19. FASE 16 — EMPRESAS](#19-fase-16--empresas)
- [20. FASE 17 — RACING](#20-fase-17--racing)
- [21. FASE 18 — CASINO](#21-fase-18--casino)
- [22. FASE 19 — ITEMS AVANZADOS](#22-fase-19--items-avanzados)
- [23. FASE 20 — PROGRESIÓN AVANZADA](#23-fase-20--progresión-avanzada)
- [24. FASE 21 — ADMINISTRACIÓN](#24-fase-21--administración)
- [25. FASE 22 — ANTI-EXPLOIT](#25-fase-22--anti-exploit)
- [26. FASE 23 — BALANCE](#26-fase-23--balance)
- [27. FASE 24 — UX DE DISCORD](#27-fase-24--ux-de-discord)
- [28. FASE 25 — EVENTOS Y CONTENIDO DINÁMICO](#28-fase-25--eventos-y-contenido-dinámico)
- [29. FASE 26 — ANALYTICS](#29-fase-26--analytics)
- [30. FASE 27 — TESTING FINAL](#30-fase-27--testing-final)
- [31. FASE 28 — BETA ABIERTA](#31-fase-28--beta-abierta)
- [32. FASE 29 — LANZAMIENTO](#32-fase-29--lanzamiento)
- [33. FASE 30 — POST-LANZAMIENTO](#33-fase-30--post-lanzamiento)
- [34. ESTRUCTURA PROPUESTA DEL PROYECTO](#34-estructura-propuesta-del-proyecto)
- [35. ORDEN REAL DE IMPLEMENTACIÓN](#35-orden-real-de-implementación)
- [36. DEFINICIÓN DE "DONE"](#36-definición-de-done)
- [37. CHECKPOINTS DEL PROYECTO](#37-checkpoints-del-proyecto)
- [38. BACKLOG FUTURO](#38-backlog-futuro)
- [39. ESTADO ACTUAL DEL PROYECTO](#39-estado-actual-del-proyecto)
- [40. PRÓXIMO PASO](#40-próximo-paso)

### 📖 Anexo A — Decisiones de Diseño y Mecánicas
  - [A.1 Visión actual](#a1-visión-actual)
  - [A.2 Mundo](#a2-mundo)
  - [A.3 Hub de ciudad](#a3-hub-de-ciudad)
  - [A.4 Filosofía de interfaz](#a4-filosofía-de-interfaz)
  - [A.5 Progresión y desbloqueos](#a5-progresión-y-desbloqueos)
  - [A.6 Descubrimiento](#a6-descubrimiento)
  - [A.7 Primeros 30 minutos](#a7-primeros-30-minutos)
  - [A.8 Primer combate](#a8-primer-combate)
  - [A.9 NPCs con personalidad](#a9-npcs-con-personalidad)
  - [A.10 Tienda inicial de armas](#a10-tienda-inicial-de-armas)
  - [A.11 Tienda de conveniencia](#a11-tienda-de-conveniencia)
  - [A.12 Gimnasio inicial](#a12-gimnasio-inicial)
  - [A.13 Recursos base](#a13-recursos-base)
  - [A.14 Sistema de vida corporal](#a14-sistema-de-vida-corporal)
  - [A.15 Estados corporales](#a15-estados-corporales)
  - [A.16 Efectos de las extremidades](#a16-efectos-de-las-extremidades)
  - [A.17 Efectos de las piernas](#a17-efectos-de-las-piernas)
  - [A.18 Torso](#a18-torso)
  - [A.19 Cabeza](#a19-cabeza)
  - [A.20 Extremidades a 0 HP](#a20-extremidades-a-0-hp)
  - [A.21 Torso/cabeza a 0 HP](#a21-torsocabeza-a-0-hp)
  - [A.22 Estado corporal vs. estado vital](#a22-estado-corporal-vs-estado-vital)
  - [A.23 Hospital](#a23-hospital)
  - [A.24 Inventario inicial](#a24-inventario-inicial)
  - [A.25 Estadísticas iniciales](#a25-estadísticas-iniciales)
  - [A.26 NPCs y narrativa](#a26-npcs-y-narrativa)
  - [A.27 Filosofía del tutorial](#a27-filosofía-del-tutorial)
  - [A.28 Primer objetivo](#a28-primer-objetivo)
  - [A.29 Nivel 2](#a29-nivel-2)
  - [A.30 Principios de diseño consolidados](#a30-principios-de-diseño-consolidados)

### 📖 Anexo B — Guía Completa de Funcionamiento del Sistema (Fases 0 a 16)
  - [B.1 Arquitectura y Aislamiento por Servidor](#b1-arquitectura-y-aislamiento-por-servidor-guild-id-isolation)
  - [B.2 Jugador y Salud Corporal](#b2-jugador-progresión-y-salud-corporal-fase-2)
  - [B.3 Economía y Transacciones](#b3-economía-inventario-y-transacciones-fases-3-14-y-15)
  - [B.4 Gimnasio y Fórmula Logarítmica](#b4-gimnasio-y-fórmula-logarítmica-de-torn-fase-4)
  - [B.5 Combate PvP y Post-Acciones](#b5-combate-pvp-y-post-acciones-fase-5)
  - [B.6 Crímenes y Prisión](#b6-crímenes-crime-skill-y-prisión--jail-fase-6)
  - [B.7 Bounties y Misiones](#b7-bounties-pvp-y-misiones-diarias-fase-7)
  - [B.8 Trabajos y Educación](#b8-trabajos-y-educación-fase-9)
  - [B.9 Facciones y Crímenes Organizados](#b9-facciones-tesorería-y-crímenes-organizados-fase-10)
  - [B.10 Guerras de Facción y Rankings](#b10-guerras-entre-facciones-y-rankings-fase-11)
  - [B.11 Propiedades y Personal](#b11-propiedades-y-personal-fase-12)
  - [B.12 Viajes Internacionales](#b12-viajes-internacionales-fase-13)
  - [B.13 Mercado y Trading](#b13-mercado-abierto-y-trading-directo-fase-14)
  - [B.14 Inversiones y Bolsa de Valores](#b14-inversiones-bancarias-y-bolsa-de-valores-fase-15)
  - [B.15 Empresas y Gestión](#b15-empresas-y-empleados-fase-16)
  - [B.16 Suite de Administración](#b16-suite-de-administración-admin)

</details>


## 0. Objetivo del proyecto

### 0.1 Visión
Crear un juego persistente de crimen, combate y economía para Discord en el que cada jugador pueda:
Crear y desarrollar un personaje.
Ganar y gastar dinero.
Entrenar estadísticas.
Combatir contra otros jugadores.
Cometer crímenes.
Comprar y utilizar equipamiento.
Trabajar y progresar profesionalmente.
Crear/ingresar en facciones.
Participar en guerras.
Crear/gestionar empresas.
Comprar propiedades.
Viajar.
Invertir.
Participar en carreras.
Apostar.
Completar misiones.
Desarrollar una progresión a largo plazo.
### 0.2 Principios de diseño
Persistencia: el progreso del jugador debe guardarse.
Economía: el dinero debe tener fuentes y sumideros controlados.
Cooldowns: las acciones importantes deben tener límites temporales.
Progresión: siempre debe existir un siguiente objetivo.
Interacción: el juego debe incentivar la interacción entre jugadores.
Balance: ninguna estrategia debe dominar todo el juego.
Auditoría: las acciones económicas y administrativas importantes deben quedar registradas.
Discord-first: la interfaz debe aprovechar slash commands, botones, menús, embeds, roles y canales.
Modularidad: cada sistema debe poder modificarse sin romper los demás.
Escalabilidad: primero se construye un MVP pequeño; después se amplía.

---


## 1. Alcance general

### 1.1 Sistemas principales
| Sistema | Prioridad | MVP | Completo |
| :--- | :--- | :--- | :--- |
| Cuenta / jugador | Crítica | Sí | Sí |
| Estadísticas | Crítica | Sí | Sí |
| Energía / cooldowns | Crítica | Sí | Sí |
| Dinero / economía | Crítica | Sí | Sí |
| Inventario | Crítica | Sí | Sí |
| Tiendas | Alta | Sí | Sí |
| Equipamiento | Alta | Sí | Sí |
| Gimnasio | Alta | Sí | Sí |
| Combate PvP | Alta | Sí | Sí |
| Crímenes | Alta | Sí | Sí |
| Cárcel | Media | Sí | Sí |
| Trabajo | Media | No | Sí |
| Educación | Media | No | Sí |
| Facciones | Alta | No | Sí |
| Guerra | Alta | No | Sí |
| Propiedades | Media | No | Sí |
| Empresas | Media | No | Sí |
| Viajes | Media | No | Sí |
| Mercado | Media | No | Sí |
| Banco | Media | No | Sí |
| Stocks | Baja | No | Sí |
| Misiones | Media | No | Sí |
| Carreras | Baja | No | Sí |
| Casino | Baja | No | Sí |
| Bounties | Alta | No | Sí |
| Social | Media | Sí | Sí |
| Administración | Crítica | Sí | Sí |
| Logs / auditoría | Crítica | Sí | Sí |

---


## 2. Niveles de lanzamiento

El proyecto tendrá tres grandes objetivos.
### 2.1 Nivel 1 — MÍNIMAMENTE LISTO
El juego ya se puede jugar.
- Debe permitir:
- Registro.
- Perfil.
- Dinero.
- Energía.
- Vida.
- Estadísticas.
- Inventario.
- Tienda.
- Comprar objetos.
- Equipar armas.
- Gimnasio.
- Combate PvP básico.
- Crímenes básicos.
- Cárcel.
- Cooldowns.
- Persistencia.
- Logs.
- Administración básica.
- Criterio
- Un jugador nuevo debe poder:
> Registrarse → conseguir dinero → comprar equipo → entrenar → cometer crímenes → combatir → ganar/perder dinero → progresar.

---

### 2.2 Nivel 2 — LISTO CON LO NECESARIO
El juego ya tiene una economía y progresión suficientemente completas para mantener jugadores.
- Añade:
- Facciones.
- Bounties.
- Misiones.
- Jobs.
- Educación.
- Propiedades.
- Viajes.
- Mercado.
- Banco.
- Trading.
- Sistema económico más completo.
- Eventos.
- Rankings.
- Mejor balance.
- Anti-abuso.
- Herramientas administrativas completas.
- Criterio
- Un jugador puede desarrollar una estrategia propia:
- Combatiente.
- Criminal.
- Empresario.
- Inversionista.
- Líder de faction.

---

### 2.3 Nivel 3 — COMPLETO
Incluye prácticamente todo el ecosistema:
Empresas.
Guerras.
Racing.
Stocks.
Casino.
Organized Crimes.
Sistema avanzado de educación.
Propiedades avanzadas.
Sistema avanzado de items.
Eventos.
Logros.
Rankings.
Mercado avanzado.
Temporadas/eventos especiales.
Balance avanzado.
Herramientas de administración.
Analytics.
Sistemas anti-bot/anti-exploit.
Optimización.
Criterio
El juego puede considerarse una versión completa y sostenible.

---


## 3. FASE 0 — PREPRODUCCIÓN

#### Objetivo
Definir exactamente qué vamos a construir antes de programar.

---

### Fase 0.1 — Definición del juego
#### Tareas
- [x] Definir nombre provisional.
- [x] Definir temática.
- [x] Definir tono.
- [x] Definir si será una adaptación o una obra original inspirada en Torn.
- [x] Definir qué mecánicas se replican conceptualmente.
- [x] Definir qué mecánicas serán originales.
- [x] Definir plataforma principal.
- [x] Definir si habrá interfaz web complementaria.
- [x] Definir cantidad inicial de jugadores objetivo.
#### Resultado
Documento:
`01_GAME_DESIGN.md`

---

### Fase 0.2 — Reglas fundamentales
- Definir:
- [x] Energía.
- [x] Nerve.
- [x] Vida.
- [x] Happy.
- [x] Dinero.
- [x] Experience.
- [x] Nivel.
- [x] Battle Stats.
- [x] Working Stats.
- [x] Cooldowns.
- [x] Hospital.
- [x] Jail.
- [x] Muerte/permanencia de personaje si existe.
- [x] Límites diarios.
- [x] Límites de acciones.
#### Resultado
`02_CORE_RULES.md`

---

### Fase 0.3 — Economía
- Definir:
#### Fuentes de dinero
- [x] Crímenes.
- [x] Combate.
- [x] Trabajos.
- [x] Empresas.
- [x] Misiones.
- [x] Trading.
- [x] Stocks.
- [x] Carreras.
- [x] Casino.
#### Sumideros
- [x] Armas.
- [x] Medical.
- [x] Gym.
- [x] Educación.
- [x] Propiedades.
- [x] Viajes.
- [x] Facciones.
- [x] Empresas.
- [x] Reparaciones.
- [x] Apuestas.
- [x] Impuestos/comisiones.
#### Resultado
`03_ECONOMY.md`

---

### Fase 0.4 — Arquitectura
- Definir:
- [x] Lenguaje.
- [x] Framework de Discord.
- [x] Base de datos.
- [x] ORM.
- [x] Sistema de migraciones.
- [x] Cache.
- [x] Jobs scheduler.
- [x] Sistema de logs.
- [x] Hosting.
- [x] CI/CD.
- [x] Backups.
- [x] Variables de entorno.
- [x] Arquitectura de módulos.
#### Resultado
`04_ARCHITECTURE.md`

---


## 4. FASE 1 — FUNDACIONES TÉCNICAS

#### Objetivo
Construir la base sobre la que funcionará todo el juego.

---

### Fase 1.1 — Proyecto
- [x] Crear repositorio.
- [x] Configurar ramas.
- [x] Configurar lint.
- [x] Configurar formatter.
- [x] Configurar tests.
- [x] Configurar variables de entorno.
- [x] Crear configuración de desarrollo.
- [x] Crear configuración de producción.
- [x] Crear README.
- [x] Crear changelog.

---

### Fase 1.2 — Discord
- [x] Crear bot.
- [x] Registrar slash commands.
- [x] Configurar intents.
- [x] Crear sistema de permisos.
- [x] Crear manejo de errores.
- [x] Crear respuestas estándar.
- [x] Crear embeds estándar.
- [x] Crear botones.
- [x] Crear select menus.
- [x] Crear modals.
- [x] Crear sistema de paginación.

---

### Fase 1.3 — Base de datos
#### Entidades iniciales
```text
User
Player
Wallet
Cooldown
Stats
Inventory
Item
Weapon
Transaction
AuditLog
```
#### Tareas
- [x] Crear esquema.
- [x] Crear migraciones.
- [x] Crear seed inicial.
- [x] Crear repositories/services.
- [x] Crear transacciones atómicas.
- [x] Crear sistema de locking cuando sea necesario.

---

### Fase 1.4 — Scheduler
#### Necesario para
regeneración de energía.
regeneración de nerve.
recuperación de vida.
fin de hospital.
fin de jail.
viajes.
trabajos.
educación.
inversiones.
carreras.
eventos.
#### Tareas
- [x] Crear scheduler.
- [x] Crear tareas recurrentes.
- [x] Crear tareas diferidas.
- [x] Crear recuperación después de reinicio.
- [x] Crear protección contra ejecución duplicada.

---


## 5. FASE 2 — JUGADOR Y PROGRESIÓN BÁSICA

#### Objetivo
Crear el personaje y sus estadísticas.

---

### Fase 2.1 — Registro
- [x] `/register`
- [x] Crear personaje.
- [x] Nombre.
- [x] Fecha de creación.
- [x] Nivel inicial.
- [x] Dinero inicial.
- [x] Energía inicial.
- [x] Nerve inicial.
- [x] Vida inicial.
- [x] Happy inicial.

---

### Fase 2.2 — Perfil
- [x] `/profile`
- [x] `/stats`
- [x] `/inventory`
- [x] `/equipment`
- Mostrar:
```text
Nivel
Experience
Money
Energy
Nerve
Life
Happy

Strength
Defense
Speed
Dexterity

Manual Labor
Intelligence
Endurance
```

---

### Fase 2.3 — Regeneración
- Implementar:
- [x] Energy regeneration.
- [x] Nerve regeneration.
- [x] Life regeneration.
- [x] Cooldown timers.
- [x] Maximum values.
- [x] Boost modifiers.

---

### Fase 2.4 — Nivel
- [x] Experience.
- [x] Level up.
- [x] Recompensas.
- [x] Desbloqueos.
- [x] Fórmula de experiencia.

---


## 6. FASE 3 — INVENTARIO Y ECONOMÍA BÁSICA

#### Objetivo
Permitir que el jugador compre, tenga y utilice objetos.

---

### Fase 3.1 — Items (Datos extraídos de Torn Wiki)
#### Tipos
- [x] Medical (Small First Aid Kit, First Aid Kit, Morphine, Blood Bag, Empty Blood Bag).
- [x] Food (Feathery Hotel Coupon, Big Mac, etc.).
- [x] Candy (Lollipop, Box of Sweet Hearts, Bag of Candy Kisses, Bag of Reindeer Droppings, Bag of Tootsie Rolls, Bag of Bloody Eyeballs).
- [x] Alcohol (Bottle of Beer, Champagne, Saké, Tequila, Kandy Kane, Pumpkin Brew, Christmas Cocktail, Minty Mayhem, Wicked Witch, Mistletoe Madness, Stinky Swamp Punch, Christmas Spirit, Green Stout, Moonshine).
- [x] Energy drinks (Can of Goose Juice, Damp Valley, Crocozade, Munster, Santa Shooters, Red Cow, Rockstar Rudolph, Taurine Elite, X-MASS).
- [x] Drugs (Xanax, Ecstasy, Speed, LSD, Cannabis, Vicodin, Opium, PCP, Ketamine, Shrooms).
- [x] Weapons (43 Primarias, 39 Secundarias, 69 Melee).
- [x] Temporary weapons (14 Arrojadizas, 7 Debuffs, 4 Inyecciones/Needles).
- [x] Miscellaneous (Donator Pack, Lottery Ticket, Six-Pack Supply Packs).

---

### Fase 3.2 — Inventario
- [x] Añadir item.
- [x] Quitar item.
- [x] Stack.
- [x] Cantidad.
- [x] Peso/capacidad si aplica.
- [x] Uso.
- [x] Equipamiento.
- [x] Venta.

---

### Fase 3.3 — Dinero
- [x] Wallet.
- [x] Cash.
- [x] Transferencias.
- [x] Depósitos.
- [x] Retiros.
- [x] Historial.
Toda modificación monetaria debe generar:
```text
Transaction
```
con:
```text
player_id
amount
balance_before
balance_after
type
source
timestamp
metadata
```

---

### Fase 3.4 — Tiendas
- [x] Catálogo.
- [x] Precio.
- [x] Stock.
- [x] Compra.
- [x] Venta.
- [x] Límites.
- [x] Reabastecimiento.
- [x] Logs.

---


## 7. FASE 4 — GIMNASIO

#### Objetivo
Crear la primera progresión activa.

---

### Fase 4.1 — Battle Stats
- [x] Strength.
- [x] Defense.
- [x] Speed.
- [x] Dexterity.

---

### Fase 4.2 — Gym
- [x] Lista de gimnasios.
- [x] Desbloqueos.
- [x] Coste de Energy.
- [x] Gain formula.
- [x] Happy reduction.
- [x] Bonuses.
- [x] Cooldowns si aplica.

---

### Fase 4.3 — Optimización
- [x] Happy modifiers.
- [x] Education modifiers.
- [x] Faction modifiers.
- [x] Item modifiers.
- [x] Company modifiers.

---


## 8. FASE 5 — COMBATE PvP

#### Objetivo
Construir el principal sistema de interacción.

---

### Fase 5.1 — Equipamiento
- Slots:
```text
Primary
Secondary
Melee
Temporary
```
- [x] Equipar.
- [x] Desequipar.
- [x] Cambiar.
- [x] Validar restricciones.

---

### Fase 5.2 — Sistema de combate
- Implementar:
- [x] Selección de objetivo.
- [x] Coste de Energy.
- [x] Ataques.
- [x] Hit/miss.
- [x] Damage.
- [x] Defensa.
- [x] Críticos.
- [x] Turnos.
- [x] Rendición.
- [x] Victoria.
- [x] Derrota.

---

### Fase 5.3 — Resultado
#### Acciones posteriores
- [x] Leave.
- [x] Mug.
- [x] Hospitalize.

---

### Fase 5.4 — Protección
- [x] Anti-self attack.
- [x] Cooldown.
- [x] Level restrictions.
- [x] Newbie protection.
- [x] Anti-abuse.
- [x] Logging.

---


## 9. FASE 6 — CRÍMENES

#### Objetivo
Crear una segunda forma de generar dinero y progresión.

---

### Fase 6.1 — Crime Engine
Crear sistema genérico:
```text
Crime
 ├── cost
 ├── cooldown
 ├── success_rate
 ├── reward
 ├── failure
 ├── requirements
 └── consequences
```

---

### Fase 6.2 — Crímenes iniciales
Implementar primero una cantidad pequeña:
- [x] Search for Cash.
- [x] Shoplifting.
- [x] Otros 3–5 crímenes básicos.

---

### Fase 6.3 — Crime Skill
- [x] XP.
- [x] Skill.
- [x] Desbloqueos.
- [x] Modificadores.
- [x] Failure scaling.

---

### Fase 6.4 — Jail
- [x] Jail state.
- [x] Jail timer.
- [x] Bust.
- [x] Bail.
- [x] Self bust.
- [x] Restricciones mientras está preso.

---


## 10. FASE 7 — BOUNTIES Y MISIONES BÁSICAS

#### Objetivo
Crear contenido PvP dirigido.

---

### Fase 7.1 — Bounties
- [x] Crear bounty.
- [x] Coste.
- [x] Comisión.
- [x] Objetivo.
- [x] Recompensa.
- [x] Expiración.
- [x] Reclamar.
- [x] Historial.

---

### Fase 7.2 — Missions
Sistema:
```text
Mission
 ├── objective
 ├── requirements
 ├── progress
 ├── reward
 └── expiration
```
- Tipos iniciales:
- [x] Ataques.
- [x] Crímenes.
- [x] Uso de items.
- [x] Entrenamiento.

---


## 11. FASE 8 — NIVEL MÍNIMAMENTE LISTO

#### Objetivo
Aquí se realiza el primer lanzamiento jugable.
Debe estar terminado
- [x] Registro.
- [x] Perfil.
- [x] Estadísticas.
- [x] Money.
- [x] Energy.
- [x] Nerve.
- [x] Life.
- [x] Happy.
- [x] Inventory.
- [x] Shops.
- [x] Weapons.
- [x] Gym.
- [x] PvP.
- [x] Mug.
- [x] Hospital.
- [x] Crimes.
- [x] Jail.
- [x] Bust.
- [x] Bounties.
- [x] Persistencia.
- [x] Logs.
- [x] Administración.
- [x] Backups.

---

### Fase 8.1 — Testing
#### Unit tests
- [x] Economía.
- [x] Combate.
- [x] Gym.
- [x] Crimes.
- [x] Cooldowns.
- [x] Inventory.
#### Integration tests
- [x] Registro.
- [x] Compra.
- [x] Combate.
- [x] Crime.
- [x] Jail.
- [x] Bounty.
#### Exploit tests
- [x] Duplicación de items.
- [x] Duplicación de dinero.
- [x] Double spending.
- [x] Race conditions.
- [x] Reintentos.
- [x] Manipulación de IDs.
- [x] Cooldown bypass.

---

### Fase 8.2 — Beta cerrada
- [x] Crear servidor beta.
- [x] Invitar testers.
- [x] Registrar errores.
- [x] Medir economía.
- [x] Medir progresión.
- [x] Ajustar recompensas.
- [x] Ajustar costes.
- [x] Ajustar combate.

---


## 12. FASE 9 — JOBS Y EDUCACIÓN

#### Objetivo
Crear progresión no relacionada directamente con combate.

---

### Fase 9.1 — Jobs
- [x] Lista de trabajos.
- [x] Aplicar.
- [x] Working Stats.
- [x] Daily pay.
- [x] Job Points.
- [x] Rangos.
- [x] Promociones.
- [x] Habilidades de trabajo.

---

### Fase 9.2 — Education
- [x] Cursos.
- [x] Duración.
- [x] Coste.
- [x] Requisitos.
- [x] Árbol.
- [x] Bonuses.
- [x] Cursos activos.
- [x] Finalización automática.

---


## 13. FASE 10 — FACTIONS

#### Objetivo
Introducir juego grupal.

---

### Fase 10.1 — Faction
- [x] Crear.
- [x] Nombre.
- [x] Descripción.
- [x] Líder.
- [x] Miembros.
- [x] Roles.
- [x] Treasury.
- [x] Respect.

---

### Fase 10.2 — Gestión
- [x] Invitar.
- [x] Expulsar.
- [x] Promover.
- [x] Degradar.
- [x] Transferir liderazgo.
- [x] Faction permissions.

---

### Fase 10.3 — Armory
- [x] Depositar items.
- [x] Retirar items.
- [x] Permisos.
- [x] Logs.

---

### Fase 10.4 — Organized Crimes
- [x] Crear OC.
- [x] Slots.
- [x] Roles.
- [x] Requisitos.
- [x] Resultado.
- [x] Recompensas.

---


## 14. FASE 11 — GUERRAS Y CONFLICTOS

#### Objetivo
Crear contenido PvP colectivo.

---

### Fase 11.1 — Warfare
- [x] Declarar guerra.
- [x] Aceptar.
- [x] Preparación.
- [x] Duración.
- [x] Objetivo.
- [x] Score.
- [x] Respect ganado/perdido.
- [x] Recompensas.

---

### Fase 11.2 — Faction Events
- [x] Guerra.
- [x] Competencias.
- [x] Rankings.
- [x] Eventos especiales.

---


## 15. FASE 12 — PROPIEDADES

#### Objetivo
Crear un sistema de inversión y Happy.

---

### Fase 12.1 — Properties
- [x] Comprar.
- [x] Rentar.
- [x] Precio.
- [x] Capacidad.
- [x] Happy.
- [x] Upgrades.

---

### Fase 12.2 — Staff
- [x] Maid.
- [x] Butler.
- [x] Guard.
- [x] Doctor.
- [x] Pilot.

---

### Fase 12.3 — Upgrades
Crear sistema genérico:
```text
PropertyUpgrade
 ├── cost
 ├── requirements
 ├── bonus
 └── maintenance
```

---


## 16. FASE 13 — VIAJES

#### Objetivo
Añadir economía internacional y contenido.

---

### Fase 13.1 — Travel Engine
- [x] Países.
- [x] Costes.
- [x] Duraciones.
- [x] Restricciones.
- [x] Estado traveling.
- [x] Llegada.

---

### Fase 13.2 — Mercados internacionales
- [x] Items exclusivos.
- [x] Precios.
- [x] Stock.
- [x] Compras.
- [x] Venta.

---


## 17. FASE 14 — MERCADO Y TRADING

#### Objetivo
Crear una economía entre jugadores.

---

### Fase 14.1 — Player Market
- [x] Publicar.
- [x] Comprar.
- [x] Cancelar.
- [x] Expirar.
- [x] Fees.

---

### Fase 14.2 — Trading directo
- [x] Crear trade.
- [x] Añadir dinero.
- [x] Añadir items.
- [x] Confirmación doble.
- [x] Bloqueo al confirmar.
- [x] Ejecución atómica.

---


## 18. FASE 15 — BANCO E INVERSIONES

#### Objetivo
Crear mecanismos para almacenar/invertir dinero.

---

### Fase 15.1 — Bank
- [x] Depositar.
- [x] Retirar.
- [x] Duración.
- [x] Interés.
- [x] Finalización.
- [x] Penalizaciones.

---

### Fase 15.2 — Stocks
- [x] Empresas cotizadas.
- [x] Precio.
- [x] Compra.
- [x] Venta.
- [x] Variación.
- [x] Beneficios.
- [x] Dividendos si aplica.

---


## 19. FASE 16 — EMPRESAS

#### Objetivo
Crear economía empresarial.

---

### Fase 16.1 — Company
- [x] Comprar empresa.
- [x] Tipo.
- [x] Nivel.
- [x] Popularity.
- [x] Efficiency.
- [x] Environment.
- [x] Cash.
- [x] Revenue.
- [x] Expenses.

---

### Fase 16.2 — Empleados
- [x] Contratar.
- [x] Despedir.
- [x] Salario.
- [x] Posiciones.
- [x] Promoción.
- [x] Productividad.

---

### Fase 16.3 — Gestión
- [x] Inventario.
- [x] Stock.
- [x] Marketing.
- [x] Training.
- [x] Upgrades.
- [x] Reportes diarios.

---


## 20. FASE 17 — RACING

#### Objetivo
Crear un sistema deportivo persistente.

---

### Fase 17.1 — Cars
- [x] Comprar.
- [x] Vender.
- [x] Colección.
- [x] Stats.
- [x] Equipamiento.

---

### Fase 17.2 — Racing
- [x] Racing Skill.
- [x] Clases.
- [x] Pistas.
- [x] Carreras.
- [x] Ranking.
- [x] Racing Points.

---

### Fase 17.3 — Parts
- [x] Motor.
- [x] Neumáticos.
- [x] Suspensión.
- [x] Frenos.
- [x] Otros upgrades.

---


## 21. FASE 18 — CASINO

#### Objetivo
Añadir entretenimiento y sink económico.

---

### Fase 18.1 — Juegos
- [x] Blackjack.
- [x] Poker.
- [x] Roulette.
- [x] Slots.
- [x] Lottery.
- [x] Bookie.
- [x] Otros juegos.

---

### Fase 18.2 — Seguridad
El casino debe tener:
- [x] Límites de apuesta.
- [x] Registro de resultados.
- [x] RNG seguro.
- [x] Protección contra doble ejecución.
- [x] Auditoría.
- [x] Límites anti-abuso.

---


## 22. FASE 19 — ITEMS AVANZADOS

#### Objetivo
Ampliar el ecosistema de objetos.

---

#### Categorías
- [x] Medical.
- [x] Drugs.
- [x] Boosters.
- [x] Candy.
- [x] Alcohol.
- [x] Weapons.
- [x] Temporary.
- [x] Armor.
- [x] Attachments.
- [x] Racing parts.
- [x] Collectibles.
- [x] Mission items.
- [x] Crime items.
- [x] Faction items.

---


## 23. FASE 20 — PROGRESIÓN AVANZADA

#### Objetivo
Dar objetivos de largo plazo.

---

### Fase 20.1 — Achievements
- [x] Logros.
- [x] Categorías.
- [x] Recompensas.
- [x] Estadísticas.

---

### Fase 20.2 — Rankings
- [x] Level.
- [x] Battle Stats.
- [x] Wealth.
- [x] Crimes.
- [x] Factions.
- [x] Companies.
- [x] Racing.
- [x] Casino.
- [x] PvP.

---

### Fase 20.3 — Perks
- [x] Merits.
- [x] Skills.
- [x] Passive bonuses.
- [x] Unlocks.

---


## 24. FASE 21 — ADMINISTRACIÓN

#### Objetivo
Controlar el juego y resolver problemas.

---

#### Herramientas
- [ ] Buscar jugador.
- [ ] Ver historial.
- [ ] Modificar dinero.
- [ ] Modificar items.
- [ ] Modificar stats.
- [ ] Jail.
- [ ] Hospital.
- [ ] Ban.
- [ ] Mute.
- [ ] Reset.
- [ ] Crear items.
- [ ] Crear eventos.
- [ ] Modificar precios.
- [ ] Modificar economía.

---

#### Auditoría
Toda acción administrativa debe registrar:
```text
admin
target
action
before
after
reason
timestamp
```

---


## 25. FASE 22 — ANTI-EXPLOIT

#### Objetivo
Evitar que la economía sea destruida.

---

#### Controles
- [ ] Rate limits.
- [ ] Cooldown server-side.
- [ ] Atomic transactions.
- [ ] Idempotency.
- [ ] Anti-duplication.
- [ ] Anti-double-spend.
- [ ] Suspicious transaction detection.
- [ ] Multi-account detection.
- [ ] Bot detection.
- [ ] Economy anomaly detection.

---


## 26. FASE 23 — BALANCE

#### Objetivo
Evitar que una estrategia sea claramente superior.

---

#### Métricas
- Medir:
- [ ] Dinero generado por hora.
- [ ] Dinero gastado por hora.
- [ ] Energy utilizada.
- [ ] Nerve utilizada.
- [ ] Battle Stats promedio.
- [ ] Tasa de victorias.
- [ ] Tasa de éxito de crímenes.
- [ ] Inflación.
- [ ] Distribución de riqueza.
- [ ] Valor promedio de inventario.
- [ ] Participación en factions.
- [ ] Retención diaria.
- [ ] Retención semanal.

---


## 27. FASE 24 — UX DE DISCORD

#### Objetivo
Que el juego sea cómodo de utilizar.

---

#### Comandos
Todos los comandos deberán seguir una estructura consistente.
Ejemplo:
```text
/game profile
/game stats
/game gym
/game attack
/game crimes
/game inventory
/game shop
/game faction
/game company
```
O, si se prefiere, comandos directos:
```text
/profile
/stats
/gym
/attack
/crimes
```
La decisión se toma en preproducción.

---

#### Componentes visuales
- [ ] Embeds.
- [ ] Buttons.
- [ ] Select menus.
- [ ] Modals.
- [ ] Progress bars.
- [ ] Paginación.
- [ ] Confirmaciones.
- [ ] Mensajes efímeros.
- [ ] Estados persistentes.

---


## 28. FASE 25 — EVENTOS Y CONTENIDO DINÁMICO

#### Objetivo
Evitar que el juego se vuelva repetitivo.

---

#### Eventos
- [ ] Eventos diarios.
- [ ] Eventos semanales.
- [ ] Eventos mensuales.
- [ ] Eventos aleatorios.
- [ ] Eventos de faction.
- [ ] Eventos PvP.
- [ ] Eventos económicos.
- [ ] Eventos especiales.

---


## 29. FASE 26 — ANALYTICS

#### Objetivo
Saber qué está ocurriendo realmente dentro del juego.

---

#### Métricas técnicas
- [ ] Usuarios activos.
- [ ] Comandos por minuto.
- [ ] Errores.
- [ ] Latencia.
- [ ] Queries.
- [ ] Jobs fallidos.
- [ ] Uso de CPU/RAM.

---

#### Métricas de juego
- [ ] Nuevos jugadores.
- [ ] Retención.
- [ ] Economía.
- [ ] PvP.
- [ ] Crimes.
- [ ] Factions.
- [ ] Companies.
- [ ] Casino.
- [ ] Racing.

---


## 30. FASE 27 — TESTING FINAL

#### Testing funcional
- [ ] Todos los comandos.
- [ ] Todos los botones.
- [ ] Todos los flujos.
- [ ] Todos los estados.
#### Testing económico
- [ ] Crear dinero.
- [ ] Destruir dinero.
- [ ] Transferir.
- [ ] Trading.
- [ ] Stocks.
- [ ] Bank.
- [ ] Casino.
#### Testing de concurrencia
Probar:
```text
Jugador A compra
Jugador B compra
Jugador A vende
Jugador B vende
```
simultáneamente.

---


## 31. FASE 28 — BETA ABIERTA

#### Objetivo
Abrir el juego a una cantidad mayor de jugadores.
#### Tareas
- [ ] Preparar servidor.
- [ ] Preparar documentación.
- [ ] Preparar reglas.
- [ ] Preparar soporte.
- [ ] Preparar reportes.
- [ ] Monitorizar economía.
- [ ] Corregir exploits.
- [ ] Ajustar balance.

---


## 32. FASE 29 — LANZAMIENTO

#### Pre-launch
- [ ] Backup.
- [ ] Migraciones.
- [ ] Seed.
- [ ] Configuración de producción.
- [ ] Monitorización.
- [ ] Logs.
- [ ] Alertas.
- [ ] Plan de rollback.
#### Launch
- [ ] Abrir registro.
- [ ] Activar sistemas.
- [ ] Monitorizar primeras horas.
- [ ] Revisar economía.
- [ ] Revisar errores.
- [ ] Revisar exploits.
#### Post-launch
- [ ] Hotfix.
- [ ] Balance.
- [ ] Feedback.
- [ ] Roadmap.

---


## 33. FASE 30 — POST-LANZAMIENTO

El juego no termina en el lanzamiento.
Se debe trabajar mediante ciclos:
```text
Analizar
   ↓
Detectar problema
   ↓
Diseñar solución
   ↓
Implementar
   ↓
Testear
   ↓
Deploy
   ↓
Medir
   ↓
Repetir
```

---


## 34. ESTRUCTURA PROPUESTA DEL PROYECTO

```text
game/
├── core/
│   ├── player/
│   ├── stats/
│   ├── wallet/
│   ├── cooldowns/
│   └── progression/
│
├── combat/
│   ├── weapons/
│   ├── battle/
│   └── hospital/
│
├── crimes/
│   ├── crimes/
│   ├── skills/
│   ├── jail/
│   └── organized/
│
├── economy/
│   ├── shops/
│   ├── market/
│   ├── bank/
│   └── stocks/
│
├── factions/
│   ├── members/
│   ├── armory/
│   ├── warfare/
│   └── organized_crimes/
│
├── companies/
│   ├── employees/
│   ├── management/
│   └── production/
│
├── properties/
│   ├── houses/
│   ├── upgrades/
│   └── staff/
│
├── travel/
│
├── missions/
│
├── racing/
│   ├── cars/
│   ├── parts/
│   └── races/
│
├── casino/
│
├── education/
│
├── items/
│
├── achievements/
│
├── events/
│
├── admin/
│
└── analytics/
```

---


## 35. ORDEN REAL DE IMPLEMENTACIÓN

No debemos implementar todo en el orden de las pantallas de Torn.
El orden recomendado es:
```text
1. Arquitectura
       ↓
2. Base de datos
       ↓
3. Player
       ↓
4. Stats
       ↓
5. Wallet
       ↓
6. Cooldowns
       ↓
7. Inventory
       ↓
8. Items
       ↓
9. Shops
       ↓
10. Gym
       ↓
11. Weapons
       ↓
12. Combat
       ↓
13. Crimes
       ↓
14. Jail
       ↓
15. Bounties
       ↓
16. Missions
       ↓
17. BETA MVP
       ↓
18. Jobs
       ↓
19. Education
       ↓
20. Factions
       ↓
21. Warfare
       ↓
22. Properties
       ↓
23. Travel
       ↓
24. Market
       ↓
25. Bank
       ↓
26. Companies
       ↓
27. Stocks
       ↓
28. Racing
       ↓
29. Casino
       ↓
30. Advanced progression
       ↓
31. Events
       ↓
32. Analytics
       ↓
33. Launch
```

---


## 36. DEFINICIÓN DE "DONE"

Una fase NO se considera terminada simplemente porque el código funciona.
- Debe cumplir:
#### Código
- [ ] Implementado.
- [ ] Revisado.
- [ ] Sin errores conocidos críticos.
#### Base de datos
- [ ] Migración.
- [ ] Índices.
- [ ] Constraints.
- [ ] Integridad.
#### Gameplay
- [ ] Costes.
- [ ] Recompensas.
- [ ] Cooldowns.
- [ ] Requisitos.
- [ ] Estados.
#### Seguridad
- [ ] Validaciones.
- [ ] Rate limits.
- [ ] Anti-exploit.
#### UX
- [ ] Comandos.
- [ ] Mensajes.
- [ ] Errores.
- [ ] Confirmaciones.
#### Testing
- [ ] Unit.
- [ ] Integration.
- [ ] Edge cases.
#### Documentación
- [ ] Reglas.
- [ ] Comandos.
- [ ] Datos.
- [ ] Decisiones.

---


## 37. CHECKPOINTS DEL PROYECTO

### 🟢 CHECKPOINT A — PROTOTIPO
Debe poder:
```text
Registrar
 ↓
Ver perfil
 ↓
Entrenar
 ↓
Comprar
 ↓
Equipar
 ↓
Atacar
 ↓
Cometer crimen
```

---

### 🟡 CHECKPOINT B — MVP
Debe poder:
```text
Progresar
 ↓
Generar dinero
 ↓
Gastar dinero
 ↓
Combatir
 ↓
Criminalidad
 ↓
Bounties
 ↓
Misiones
```

---

### 🟠 CHECKPOINT C — JUEGO COMPLETO BASE
Debe poder:
```text
Combatiente
Criminal
Trabajador
Faction member
Empresario
Inversionista
```

---

### 🔴 CHECKPOINT D — RELEASE
- Debe tener:
```text
Todos los sistemas principales
+
Balance
+
Seguridad
+
Analytics
+
Administración
+
Eventos
+
Documentación
```

---


## 38. BACKLOG FUTURO

Estas funcionalidades se dejan deliberadamente para después:
- [ ] Sistema de mascotas.
- [ ] Sistema de colecciones.
- [ ] Eventos de temporada.
- [ ] NPCs avanzados.
- [ ] Mercado negro.
- [ ] Contratos dinámicos.
- [ ] Sistema de reputación.
- [ ] Sistema político.
- [ ] Territorios.
- [ ] Nuevas ciudades.
- [ ] Nuevos países.
- [ ] Clanes especiales.
- [ ] Endgame.
- [ ] Prestige.
- [ ] Temporadas.

---


## 39. ESTADO ACTUAL DEL PROYECTO

| Fase | Estado |
| :--- | :--- |
| 0 — Preproducción | ✅ Completado |
| 1 — Fundaciones | ✅ Completado |
| 2 — Jugador | ✅ Completado |
| 3 — Economía básica | ✅ Completado |
| 4 — Gym | ✅ Completado |
| 5 — Combate | ✅ Completado |
| 6 — Crimes | ✅ Completado |
| 7 — Bounties/Missions | ✅ Completado |
| 8 — MVP | ✅ Completado |
| 9 — Jobs/Education | ✅ Completado |
| 10 — Factions | ✅ Completado |
| 11 — Warfare | ✅ Completado |
| 12 — Properties | ✅ Completado |
| 13 — Travel | ✅ Completado |
| 14 — Market | ✅ Completado |
| 15 — Bank/Stocks | ✅ Completado |
| 16 — Companies | ✅ Completado |
| 17 — Racing | ✅ Completado |
| 18 — Casino | ✅ Completado |
| 19 — Items avanzados | ✅ Completado |
| 20 — Progresión avanzada | ✅ Completado |
| 21 — Administración | ⬜ Pendiente |
| 22 — Anti-exploit | ⬜ Pendiente |
| 23 — Balance | ⬜ Pendiente |
| 24 — UX | ⬜ Pendiente |
| 25 — Eventos | ⬜ Pendiente |
| 26 — Analytics | ⬜ Pendiente |
| 27 — Testing final | ⬜ Pendiente |
| 28 — Beta | ⬜ Pendiente |
| 29 — Lanzamiento | ⬜ Pendiente |
| 30 — Post-lanzamiento | ⬜ Pendiente |   

### 📜 Log de Registro de Avances

- **2026-08-10 — Fases 17 a 20 (Racing, Casino, Ítems Avanzados y Progresión Avanzada):**
  - ✅ **Carreras de Autos (Fase 17):** Pistas de carreras (`Anillo Industrial`, `Autopista Central`, `Autódromo`), cálculo de tiempos de vuelta según velocidad del jugador y cuotas de inscripción.
  - ✅ **Casino y Azar (Fase 18):** Máquina de tragamonedas (Slots) con multipliers y Jackpot (💎💎💎), Blackjack (21) auditados en `Transaction` (`CASINO_WIN` / `CASINO_LOSS`).
  - ✅ **Drogas y Boosters (Fase 19):** Consumo de drogas (`Xanax` +250⚡, `Éxtasis` 2x Happy, `Cannabis` +3🧠) con 2% de riesgo de sobredosis e internación en hospital, y boosters de energía y felicidad.
  - ✅ **Logros y Clasificaciones (Fase 20):** Sistema de logros (`FIRST_STEPS`, `MILLIONAIRE`, `CRIME_BOSS`, `PVP_CHAMPION`) con recompensas en efectivo y tablas de clasificaciones globales de nivel, riqueza y stats.

- **2026-08-10 — Fases 12 a 16 (Propiedades, Viajes, Mercado/Trading, Banco/Bolsa y Empresas):**
  - ✅ **Propiedades (Fase 12):** Catálogo inmobiliario (`Shack`, `Apartment`, `Penthouse`, `Private Island`), contratación de Staff (`Maid`, `Butler`, `Doctor`, `Pilot`) e incrementos automáticos a `maxHappy`.
  - ✅ **Motor de Viajes (Fase 13):** Destinos internacionales (`México`, `Reino Unido`, `Japón`, `Suiza`) con billetes aéreos, temporizadores de vuelo y catálogo de mercado exclusivo.
  - ✅ **Mercado y Trading (Fase 14):** Publicación de objetos en el mercado entre jugadores (`MarketItem`) y sistema de comercio directo (`Trade`) con confirmación doble atómica.
  - ✅ **Banco e Inversiones (Fase 15):** Depósitos bancarios a plazo fijo (1 a 4 semanas) con tasa de interés hasta del 30% y Bolsa de Valores (`Stock`) con acciones (`TNC`, `SYS`, `MED`, `OIL`).
  - ✅ **Empresas y Gestión (Fase 16):** Fundación de empresas (`Sweet Shop`, `Gun Shop`, `Logistics Firm`), contratación de empleados y recaudación de ganancias acumuladas.

- **2026-08-10 — Fase 11 (Guerras entre Facciones y Rankings):**
  - ✅ **Faction Warfare (Fase 11.1):** Declaración de guerra entre facciones enemigas (`targetScore` de 100 puntos, 24 horas de duración). Cada duelo PvP ganado por un miembro suma +10 pts de guerra y +15 Puntos de Respeto.
  - ✅ **Recompensas y Rankings (Fase 11.2):** La facción vencedora obtiene +500 Puntos de Respeto extra y +$100,000 en la tesorería. Tabla de ranking de facciones por respeto en tiempo real.

- **2026-08-10 — Fase 9 (Jobs y Educación) & Fase 10 (Facciones, Armería y Crímenes Organizados):**
  - ✅ **Empleos & Working Stats (Fase 9.1):** Mapeo de empleos iniciales (`Grocer`, `Casino`, `Medical`), verificación de requisitos de Working Stats (`manualLabor`, `intelligence`, `endurance`), salarios diarios auditados en `Transaction` (`JOB_SALARY`) y acumulación de Job Points.
  - ✅ **Universidad y Cursos (Fase 9.2):** Catálogo educativo (`BIO101`, `LAW101`, `BUS101`, `COMBAT101`) con matrículas en efectivo, temporizadores en tiempo real y бонуses pasivos permanentes.
  - ✅ **Facciones & Juego Grupal (Fase 10.1 - 10.4):** Fundación de facciones ($50,000 de costo), gestión de miembros y roles (`LEADER`, `CO_LEADER`, `MEMBER`), Tesorería de facción (`treasury`), Puntos de Respeto (`respect`) y ejecución de Crímenes Organizados (`OrganizedCrime`).

- **2026-08-10 — Fase 7 (Bounties y Misiones) & Fase 8 (Nivel Mínimamente Listo / MVP):**
  - ✅ **Bounties PvP (Fase 7.1):** Sistema de colocación de recompensas con 10% de comisión, auditoría monetaria `Transaction`, cobro automático al vencer al objetivo en duelo PvP y expiración en 7 días.
  - ✅ **Misiones Diarias (Fase 7.2):** Seguimiento atómico de objetivos de juego (`CRIMES`, `ATTACKS`, `TRAINING`, `ITEMS`) con recompensas de dinero y experiencia.
  - ✅ **MVP Totalmente Jugable (Fase 8):** Verificación completa de todos los módulos del MVP (Registro `/empezar`, Perfil con 6 partes corporales, Cartera con auditoría estricta, Catálogo de 178 Ítems, Gimnasio con fórmula de Torn Wiki, Combate PvP con post-acciones, Crímenes, Prisión/Rescates/Fianzas, Bounties, Misiones, Persistencia en PostgreSQL y Suite de Administración `/admin`).

- **2026-08-10 — Fase 6 (Crímenes, Crime Skill y Prisión / Jail):**
  - ✅ **Crime Engine (Fase 6.1 & 6.2):** Motor genérico con 5 crímenes iniciales (`Search for Cash`, `Shoplifting`, `Pickpocketing`, `Larceny`, `Armed Robbery`) con costo de Nerve (2🧠 a 10🧠), tasas de éxito, botines monetarios auditados en `Transaction` (`CRIME_REWARD`) e incrementos de Crime XP.
  - ✅ **Crime Skill & Progresión (Fase 6.3):** Incorporación de `crimeSkill` y `crimeExp` en el modelo `Stats`. A mayor Crime Skill, mayor probabilidad de éxito en todos los crímenes.
  - ✅ **Sistema de Prisión / Jail (Fase 6.4):** Encarcelamiento por fallar crímenes o fugas. Restricciones de acciones en prisión. Cálculo oficial de Fianza (`Bail = $100 * minutos * nivel`), Rescate de compañeros (`Bust` por 5🧠) y Fuga Propia (`Self Bust` por 50% de Nerve total).

- **2026-08-10 — Fase 5 (Combate PvP y Protecciones):**
  - ✅ **Comando `/atacar` (Fase 5.2):** Sistema de duelo PvP atómico (consume 25⚡) con desglose por turnos en Embeds de Discord.
  - ✅ **Motor de Daño Corporal (Fase 5.2):** Cálculo de impacto (`Fuerza vs Defensa`, `Velocidad vs Destreza`), probabilidad de fallar/acertar y golpes críticos (15% probabilidad) direccionados a 6 zonas del cuerpo (`Cabeza`, `Torso`, `Brazos`, `Piernas`).
  - ✅ **Acciones Post-Combate (Fase 5.3):** Botones interactivos tras ganar un duelo: `🚪 Leave` (+100 XP, 15m hosp), `💸 Mug` (Robo de 5-15% del efectivo de la víctima con auditoría monetaria `Transaction`), `🚑 Hospitalize` (Hospitalización severa de 60m).
  - ✅ **Protecciones Anti-Abuso (Fase 5.4):** Anti-Self Attack (no puedes atacarte a ti mismo), Protección de Novatos (jugadores Nivel < 2), Verificación de Hospital y Cárcel.

- **2026-08-10 — Fase 4 (Gimnasio y Progresión Activa de Battle Stats):**
  - ✅ **Fórmula Oficial de Torn Wiki (Fase 4.1 & 4.2):** Implementación de la ecuación real de ganancias `Gains = Modifiers * GymDots * (Energy/5) * [(a*ln(Stat)+b)*(1+c*Happy) + d*Happy + e]` para entrenamiento de **Fuerza (Strength)**, **Defensa (Defense)**, **Velocidad (Speed)** y **Destreza (Dexterity)**.
  - ✅ **Tiers de Gimnasio (Fase 4.2):** 7 niveles de gimnasios mapeados (`Premier Fitness`, `Average Joe's`, `Woody's Workout`, `Global Gym`, `Gold's Gym`, `Anarchy Fitness`, `The Asylum Heavy Weight`) con costos de membresía, multiplicadores de ganancia y consumo de energía.
  - ✅ **Consumo de Happy & Experiencia (Fase 4.2 & 4.3):** Entrenar consume `~50%` de la energía gastada como Felicidad (😊) e incrementa la experiencia acumulada del gimnasio (`gymExp`) para desbloquear el siguiente nivel.

- **2026-08-10 — Fase 3 (Inventario, Economía Básica, Transacciones Auditables y Tiendas):**
  - ✅ **Inventario (Fase 3.2):** Apilamiento de cantidad (Stacking), equipamiento de armas por ranura (`PRIMARY`, `SECONDARY`, `MELEE`, `TEMPORARY`) y consumo de ítems de Torn Wiki (Medical, Drugs, Energy Drinks, Alcohol, Candy) integrados en el Hub interactivo sin flood.
  - ✅ **Dinero y Auditoría (Fase 3.3):** Sistema de Cartera (Efectivo/Banco), Depósitos, Retiros y Transferencias entre jugadores. **Toda modificación monetaria genera un registro atómico estricto en `Transaction`** con `playerId`, `amount`, `balanceBefore`, `balanceAfter`, `type`, `source`, `timestamp` y `metadata`.
  - ✅ **Tiendas (Fase 3.4):** Armería y Mercado de Suministros con catálogo de 178 ítems, compra/venta en tiempo real, deducción/acreditación de efectivo y Menú de Selección interactivo (`StringSelectMenu`).

- **2026-08-10 — Fase 3.1 (Ítems Oficiales de Torn Wiki):**
  - ✅ Catálogo de datos extraído y autenticado desde **Torn Wiki** (`wiki.torn.com`):
    - 💊 **Medical:** Morphine (-70m hosp, +15% HP), First Aid Kit, Small First Aid Kit, Blood Bag, Empty Blood Bag.
    - 🧪 **Drugs:** Xanax (+250⚡), Ecstasy (x2 Happy), Speed (+20% Fuerza), LSD (+50⚡,+20🧠,+50😊), Cannabis (+3🧠, +150😊), Vicodin (+25% Stats), Opium (+50% HP), PCP (+500😊), Ketamine, Shrooms.
    - ⚡ **Energy Drinks:** Can of Goose Juice (+5⚡), Damp Valley (+10⚡), Crocozade (+15⚡), Munster (+20⚡), Santa Shooters (+20⚡), Red Cow (+25⚡), Rockstar Rudolph (+25⚡), Taurine Elite (+30⚡), X-MASS (+30⚡).
    - 🍺 **Alcohol:** Bottle of Beer (+1🧠), Champagne, Saké, Tequila, Kandy Kane (+2🧠), Pumpkin Brew (+2🧠), Christmas Cocktail (+3🧠), Minty Mayhem (+3🧠), Wicked Witch (+3🧠), Mistletoe Madness (+4🧠), Stinky Swamp Punch (+4🧠), Christmas Spirit (+5🧠), Green Stout (+5🧠), Moonshine (+5🧠).
    - 🍬 **Candy:** Lollipop (+25😊), Box of Sweet Hearts (+50😊), Bag of Candy Kisses (+75😊), Bag of Reindeer Droppings (+100😊), Bag of Tootsie Rolls (+125😊), Bag of Bloody Eyeballs (+150😊).
    - 📦 **Misc & Supply Packs:** Donator Pack (31d), Lottery Ticket, Six-Pack Supply Packs.

- **2026-08-10 — Fase 2 (Jugador y Progresión Básica):**
  - ✅ Implementación del comando Slash único de registro e inicio `/empezar` vinculado al ID de cuenta de Discord.
  - ✅ Arquitectura de navegación sin flood de chat: Todo interactúa dentro de un único mensaje (Hub central) usando `interaction.update` para refrescar vistas en el mismo lugar.
  - ✅ Vistas interactivas de Hub implementadas: `Perfil`, `Estadísticas (Battle Stats + Working Stats)`, `Inventario` y `Equipamiento` con botón `🔙 Volver al Hub`.
  - ✅ Incorporación de Working Stats (`manualLabor`, `intelligence`, `endurance`) al modelo de base de datos `Stats`.

- **2026-08-10 — Fase 0 (Preproducción) & Fase 1 (Fundaciones Técnicas):**
  - ✅ Arquitectura base inicializada con **Node.js + TypeScript (v5.6)** y **`discord.js` v14**.
  - ✅ Configuración de motor de base de datos **PostgreSQL** (`provider = "postgresql"`) con **Prisma ORM** e identificadores atómicos de `Player`, `Wallet`, `Stats`, `BodyParts`, `Cooldown`, `InventoryItem`, `Item`, `Transaction` y `AuditLog`, listo para conectarse a VM externa.
  - ✅ Sembrado de catálogo completo de **178 armas y consumibles de Torn** (`prisma/seed.ts`) clasificadas en Armas Primarias, Secundarias, Melee, Temporales, Debuffs y Buffs.
  - ✅ Scheduler en segundo plano con `node-cron` para la regeneración de Energía ⚡ y Nerve 🧠 cada 5 minutos.
  - ✅ Pruebas unitarias de registro atómico e idempotencia aprobadas (`tests/playerService.test.ts`).

---


---


# ANEXO A — DECISIONES DE DISEÑO: VISIÓN, PROGRESIÓN Y PRIMERA EXPERIENCIA

> Este anexo recoge las decisiones tomadas durante la lluvia de ideas y pasa a formar parte de la especificación de diseño.

## A.1 Visión actual

El juego será un RPG persistente de crimen, combate, economía y conflicto social para Discord.
La experiencia tendrá cuatro grandes caminos, que no serán excluyentes:
⚔️ Peleador: entrenamiento, armas, combate PvP, bounties y guerras.
🕵️ Criminal: crímenes, contrabando, mercado negro y actividades ilegales.
- 💼 Empresario: trabajos, negocios, empresas, empleados e inversiones.
- 🏴 Social/Faction: alianzas, facciones, guerras y control de territorios.
El jugador podrá combinar estos caminos. La especialización será una consecuencia de cómo juega, no una clase elegida obligatoriamente al crear el personaje.

---


## A.2 Mundo

#### Escala inicial
El juego utilizará una ciudad única.
La ciudad estará dividida en zonas que se irán descubriendo progresivamente.
El objetivo no es crear cientos de ubicaciones, sino una cantidad suficiente de zonas con funciones claras para que el mundo se sienta grande sin generar bloat en Discord.
#### Zonas conceptuales iniciales
Estas zonas son propuestas de diseño y todavía pueden cambiar:
| Zona | Función principal |
| :--- | :--- |
| 🏙️ Centro | Servicios, economía y actividades legales |
| 🏚️ Barrio Bajo | Crimen, pandillas y mercado negro |
| 🏭 Distrito Industrial | Trabajo, empresas, fábricas y comercio |
| ⚓ Puerto | Viajes, contrabando e importación/exportación |
| 🏥 Distrito Médico/Seguridad | Hospital, policía, cárcel y servicios de emergencia |
| 🏠 Zona Residencial | Propiedades, casas y vida personal |
| 🏎️ Periferia | Vehículos, talleres, carreras y piezas |
| 🎰 Distrito de Ocio | Casino, clubes, apuestas y entretenimiento |
#### Regla de diseño de zonas
Cada zona debe responder a:
> **¿Por qué un jugador tendría que venir aquí?**
No se añadirá una zona solamente porque exista en otro juego.
Los lugares individuales podrán agruparse dentro de una misma zona para evitar fragmentación.
Ejemplo:
```text
🏥 Distrito Médico/Seguridad

Hospital
Policía
Cárcel
Farmacia
Juzgado
```
No serán cinco zonas diferentes.

---


## A.3 Hub de ciudad

El jugador interactuará principalmente con un Hub.
El Hub será el punto de entrada a las actividades disponibles.
Ejemplo:
```text
🏙️ LA CIUDAD

⚔️ Actividades
🛒 Tiendas
🏋️ Gimnasio
🏥 Hospital
👤 Personaje

🔒
🔒
🔒
🔒
```
A medida que el jugador progresa:
```text
🏙️ LA CIUDAD

🏙️ Centro
🏚️ Barrio Bajo
🔒
🔒
🔒
```
#### Regla de interfaz
El contenido bloqueado no debe revelar su nombre ni sus requisitos.
El jugador verá:
> 🔒
y nada más.
Esto aplica a:
Zonas.
Negocios.
Sistemas.
Actividades.
Opciones avanzadas.
Equipamiento.
Contenido especial.
La intención es crear descubrimiento, no entregar una lista completa de contenido futuro.

---


## A.4 Filosofía de interfaz

#### Regla principal
> **Profundidad por debajo, simplicidad por encima.**
El backend puede contener muchos sistemas, pero el jugador debe ver solamente las opciones relevantes para su estado actual.
No se deben crear decenas de comandos separados cuando un Hub puede agruparlos.
Ejemplo conceptual:
```text
/ciudad
```
abre:
```text
🏙️ CIUDAD

⚔️ Actividades
🛒 Tiendas
🏦 Finanzas
🏠 Propiedades
🚓 Servicios
✈️ Viajar
🎰 Entretenimiento
```
Los submenús aparecen solamente cuando son relevantes/desbloqueados.
#### Principio de crecimiento
> **La interfaz crece con el jugador.**
Un jugador nuevo debe tener pocas opciones.
Un jugador veterano puede tener muchas más.
El sistema no debe obligar al jugador nuevo a comprender todo el juego desde el primer día.

---


## A.5 Progresión y desbloqueos

- La progresión utilizará una combinación de:
- XP.
- Nivel.
- Requisitos/hitos.
- Descubrimiento.
#### Regla
> **La experiencia determina cuándo el jugador está preparado para intentar subir de nivel; los requisitos determinan si realmente puede hacerlo.**
Ejemplo:
```text
Nivel actual: 4

XP:
████████████░░░░░░
12,450 / 15,000
```
Al alcanzar el XP requerido:
```text
🎉 EXPERIENCIA SUFICIENTE

Requisitos para Nivel 5:

❌ Gana 2 combates
❌ Completa 1 crimen
✅ Compra un arma
✅ Entrena en el gimnasio
```
Cuando todos los requisitos estén cumplidos:
```text
🎉 NIVEL 5 DESBLOQUEADO
```
#### Requisitos persistentes
Los requisitos deben contar aunque hayan sido realizados antes de alcanzar el XP necesario.
Ejemplo:
```text
Gana 5 combates
8/5
```
Si el jugador ya hizo los 8 combates antes de llegar al nivel requerido, el requisito está cumplido.
No se debe obligar al jugador a repetir contenido únicamente para desbloquear un nivel.
#### Tipos de requisitos
##### Actividad
- Ganar combates.
- Completar crímenes.
- Entrenar.
- Comprar/utilizar objetos.
- Completar determinadas actividades.
##### Economía
- Tener determinada cantidad de dinero.
- Gastar determinada cantidad.
- Realizar una primera compra.
##### Progresión
- Completar misiones.
- Conseguir logros.
- Completar educación.
- Descubrir contenido.
##### Social
- Unirse a una faction.
- Participar en actividades grupales.
- Participar en una guerra.
##### Descubrimiento
- Encontrar una zona.
- Completar una cadena de descubrimiento.
- Conocer un contacto.
- Los requisitos pueden combinarse.
- Ejemplo:
```text
Puerto

Nivel 12
+
$50,000
+
Completar "Conoce al contrabandista"
```

---


## A.6 Descubrimiento

El jugador no debe conocer necesariamente todo el contenido disponible.
El descubrimiento será una mecánica.
Ejemplo:
```text
🔒
```
Después de cumplir una condición:
```text
🚨 NUEVO LUGAR DESCUBIERTO

🕳️ El Callejón del Sapo

No sabes qué es esto.

Probablemente no deberías entrar.
```
- Esto permitirá añadir:
- Easter eggs.
- Lugares secretos.
- Contactos.
- Actividades ocultas.
- Eventos.
- Contenido especial.
- El tono humorístico y caótico debe estar presente también en estos descubrimientos.

---


## A.7 Primeros 30 minutos

El jugador nuevo tendrá una experiencia deliberadamente limitada.
El objetivo no será enseñarle todos los sistemas, sino que descubra los conceptos fundamentales jugando.
#### Estado inicial
```text
Dinero: $100
Equipamiento: Ninguno
Stats: 1
Vida corporal: 100 en cada parte
Energía: 100
Nerve: 100
Happiness: 100
Casa: Ninguna
Trabajo: Ninguno
Inventario: 0/100
```
#### El jugador empieza completamente desnudo
- No tiene:
- Arma.
- Armadura.
- Casa.
- Trabajo.
- Equipamiento.
- Inventario inicial con objetos.
- Tiene únicamente los recursos iniciales definidos.
#### Opciones iniciales
El jugador comienza con pocas actividades:
⚔️ Combate básico contra NPCs.
🛒 Tienda de armas básica.
🛒 Tienda de conveniencia.
🏋️ Gimnasio de mala muerte.
- 🏥 Hospital.
👤 Perfil/personaje.
- No tendrá acceso inicial a:
- Factions.
- Empresas.
- Bolsa.
- Casino.
- Viajes.
- Mercado avanzado.
- Propiedades.
- Sistemas complejos.
- Estos se desbloquearán progresivamente.

---


## A.8 Primer combate

El primer combate deberá enseñar el sistema sin necesidad de un tutorial textual extenso.
El jugador podrá enfrentarse a NPCs de nivel bajo.
- El combate deberá enseñar:
- Vida.
- Partes del cuerpo.
- Energy.
- Armas.
- Ataque.
- Defensa.
- Daño.
- Victoria.
- Derrota.
- Recompensas.
- El primer NPC puede ser un personaje con personalidad humorística.
- Ejemplo:
> **Jimmy el Contador**
- >
> "Me dijeron que eres nuevo. Si quieres sobrevivir aquí, aprende a pegar."
- La personalidad es funcional al tutorial: el NPC enseña una mecánica mediante diálogo breve y acciones.

---


## A.9 NPCs con personalidad

Los NPCs serán una herramienta de gameplay y ambientación.
No es necesario que exista inicialmente una campaña narrativa compleja.
- Un NPC puede tener:
- Nombre.
- Rol.
- Personalidad.
- Forma de hablar.
- Frases.
- Reacciones.
- Contexto.
- Relación con una actividad.
- Ejemplos:
- 🔪 Jimmy — vendedor de armas
> "No pregunto para qué quieres la pistola. Tú tampoco preguntes por qué tengo 37."
- 🏋️ Tony — dueño del gimnasio
> "El dolor es temporal. La deuda del gimnasio también, si pagas."
- 🏥 Dr. Martínez — médico
> "Buenas noticias: vas a vivir. Malas noticias: la factura también."
- 🕵️ El Flaco — contacto criminal
> "Yo no vendo cosas ilegales. Yo vendo cosas que casualmente son ilegales cuando las compras."
- Estos personajes no requieren una historia compleja para tener valor.
- Su función puede ser:
- Presentar sistemas.
- Dar misiones.
- Vender objetos.
- Desbloquear contenido.
- Dar contexto.
- Crear humor.
- Servir como contactos.
- Actuar como proveedores.
- Reaccionar a las acciones del jugador.
- Más adelante podrán evolucionar a personajes narrativos con relaciones y cadenas de misiones si el proyecto lo necesita.

---


## A.10 Tienda inicial de armas

La primera tienda tendrá una selección deliberadamente pequeña.
Ejemplo:
```text
🔪 ARMORY DEL BARRIO

🔪 Navaja          $500
🔨 Bate            $1,200
🔫 Pistola vieja   $2,500
```
No se mostrarán cientos de armas desde el inicio.
- La tienda debe enseñar:
- Comprar.
- Dinero.
- Inventario.
- Equipamiento.
- Categorías de armas.
- La variedad se ampliará mediante desbloqueos.

---


## A.11 Tienda de conveniencia

Será el primer contacto con objetos consumibles.
Ejemplo:
```text
🛒 MINI MARKET

🥤 Energy Drink     $300
🍫 Chocolate        $150
🩹 Vendaje          $250
🍺 Cerveza         $200
```
- El jugador aprenderá:
- Comprar.
- Guardar.
- Consumir.
- Cantidades.
- Efectos.
- Inventario.

---


## A.12 Gimnasio inicial

El primer gimnasio será deliberadamente malo.
Nombre conceptual:
> 🏋️ Gimnasio "El Infierno"
El humor puede aparecer en sus descripciones.
El gimnasio permitirá entrenamiento básico y ganancias pequeñas.
Estadísticas de combate iniciales:
```text
Fuerza       1
Defensa      1
Velocidad    1
Destreza     1
```
Las estadísticas podrán crecer mediante entrenamiento.
El límite máximo de estadísticas todavía está pendiente de diseño.

---


## A.13 Recursos base

El núcleo inicial tendrá solamente seis recursos.
| Recurso | Función |
| :--- | :--- |
| ❤️ Vida | Supervivencia y estado corporal |
| ⚡ Energía | Acciones físicas, combate y entrenamiento |
| 🧠 Nerve | Crímenes y actividades ilegales |
| 😊 Happiness | Modificador de determinadas actividades |
| 💰 Dinero | Economía principal |
| ⭐ XP | Progresión y niveles |
#### Recursos deliberadamente aplazados
Los siguientes sistemas no forman parte del núcleo inicial:
- 🔥 Reputación.
- 🏴 Respect.
- 🧪 Adicción.
- 🚨 Heat / búsqueda policial.
Podrán añadirse cuando exista una mecánica que realmente necesite cada uno.

---


## A.14 Sistema de vida corporal

La vida no será una única barra.
El jugador tendrá seis partes corporales:
```text
                 🧠 CABEZA
                    100
                     │
        ┌────────────┴────────────┐
        │                         │
   💪 BRAZO IZQ              💪 BRAZO DER
       100                        100
        │                         │
        └──────────┬──────────────┘
                   │
                🫀 TORSO
                  100
                   │
        ┌──────────┴──────────┐
        │                     │
   🦵 PIERNA IZQ          🦵 PIERNA DER
        100                   100
```
#### Partes
- 🧠 Cabeza.
- 🫀 Torso.
- 💪 Brazo izquierdo.
- 💪 Brazo derecho.
- 🦵 Pierna izquierda.
- 🦵 Pierna derecha.
Cada parte tendrá inicialmente:
```text
current_hp
max_hp
damage_state
temporary_effects
permanent_injuries
```

---


## A.15 Estados corporales

El daño se interpretará por porcentaje.
Propuesta inicial:
| HP | Estado |
| :--- | :--- |
| 76–100% | Normal |
| 51–75% | Levemente herido |
| 26–50% | Herido |
| 1–25% | Gravemente herido |
| 0% | Inutilizado / condición crítica |
Los porcentajes son valores iniciales de diseño y podrán modificarse durante el balance.

---


## A.16 Efectos de las extremidades

Las partes corporales deben afectar las acciones relacionadas con ellas.
#### Brazo derecho
- Puede afectar:
- Armas utilizadas con la mano derecha.
- Precisión.
- Daño.
- Velocidad de ataque.
- Acciones que requieren el brazo.
- Ejemplo:
```text
💪 Brazo derecho
███████░░░ 73%

⚠️ Brazo lesionado

Precisión: -10%
Velocidad de ataque: -5%
```
A menor HP, mayor penalización.
Si llega a 0:
> El brazo queda inutilizado.
El jugador no muere automáticamente.
Dependiendo del arma, puede:
No poder utilizarla.
Utilizarla con una penalización severa.
Cambiarla a la otra mano si el arma lo permite.
#### Brazo izquierdo
Misma lógica, pero aplicada a:
Armas de la mano izquierda.
Defensa.
Uso de determinados objetos.
Acciones que requieran esa mano.

---


## A.17 Efectos de las piernas

- Las piernas pueden afectar:
- Movilidad.
- Evasión.
- Carreras.
- Viajes.
- Huir de combate.
- Actividades físicas.
- Si una pierna está gravemente herida, el jugador tendrá penalizaciones.
- Si ambas están muy dañadas:
> **Movilidad severamente reducida.**
- Una persona con ambas piernas inutilizadas no debería poder realizar determinadas actividades normalmente.

---


## A.18 Torso

El torso representa una zona crítica.
- Puede afectar:
- Resistencia.
- Capacidad de combate.
- Recuperación.
- Capacidad física.
- Posiblemente Energy.
- El daño crítico del torso tendrá una probabilidad y/o consecuencia de muerte significativamente superior a las extremidades.
- Debe evitarse que el PvP termine constantemente en muertes instantáneas.

---


## A.19 Cabeza

La cabeza será una zona crítica.
- Puede afectar:
- Precisión.
- Percepción.
- Determinadas acciones.
- Capacidad de combate.
- Probabilidad de incapacitación.
- El daño crítico de cabeza puede provocar muerte.
- Al igual que con el torso, debe existir balance para evitar muertes excesivamente frecuentes.

---


## A.20 Extremidades a 0 HP

Llegar a 0 HP en:
Brazo izquierdo.
Brazo derecho.
Pierna izquierda.
Pierna derecha.
- NO provoca muerte automática.
- Provoca:
- Estado de lesión grave.
- Penalizaciones temporales.
- Posibles lesiones permanentes.
- Restricciones de uso.
- Necesidad de tratamiento médico.
- Las lesiones pueden clasificarse como:
#### Temporales
- Se eliminan con:
- Tiempo.
- Hospital.
- Tratamiento.
#### Persistentes/permanentes
No desaparecen simplemente esperando.
- Requieren:
> 🏥 Tratamiento médico.
- Ejemplo:
```text
💪 Brazo derecho

Lesión:
Fractura

Efecto temporal:
-25% uso del brazo

Efecto persistente:
-5% eficacia hasta recibir tratamiento
```
Los valores concretos se definirán durante el diseño del sistema médico.

---


## A.21 Torso/cabeza a 0 HP

Si:
- 🫀 Torso llega a 0.
- 🧠 Cabeza llega a 0.
se considera una situación mortal.
El jugador puede:
Morir.
Recibir una consecuencia de muerte.
Recibir penalizaciones posteriores.
Ejemplo conceptual:
```text
☠️ HAS MUERTO

Causa:
Traumatismo craneal

Consecuencia:
Trauma severo

Durante X minutos:
-20% regeneración de Energy
-15% efectividad en combate
-10% entrenamiento
```
La implementación exacta de muerte, recuperación y penalizaciones queda pendiente.

---


## A.22 Estado corporal vs. estado vital

No existirá necesariamente una séptima barra de "vida general".
El juego mantendrá el estado de las seis partes:
```text
Head
Torso
Left Arm
Right Arm
Left Leg
Right Leg
```
Y el motor determinará internamente:
```text
Vivo
Herido
Incapacitado
Muerto
```
según las condiciones corporales.
Esto evita tener:
```text
❤️ Vida general
+
🧠 Cabeza
+
🫀 Torso
+
4 extremidades
```
y mantiene el número de recursos visuales bajo control.

---


## A.23 Hospital

El hospital estará disponible desde el principio.
No será una actividad principal durante el tutorial.
Su propósito inicial será:
Recuperar partes corporales.
Tratar lesiones.
Gestionar estados críticos.
Recuperar al jugador después de situaciones graves.
Ejemplo:
```text
🏥 HOSPITAL

Estado corporal:

🧠 Cabeza       82%
🫀 Torso        91%
💪 Brazo izq.   42% ⚠️
💪 Brazo der.   13% 🔴
🦵 Pierna izq.  76%
🦵 Pierna der.  100%

Tratamientos:

🩹 Curar heridas
🦴 Tratar fractura
🧠 Tratar traumatismo
💉 Recuperación completa
```
Más adelante pueden existir:
Hospital público.
Hospital privado.
Clínica ilegal.
Médico de faction.
Tratamientos especiales.

---


## A.24 Inventario inicial

El jugador tendrá:
```text
🎒 Inventario

0 / 100
```
Dispondrá de 100 espacios libres desde el comienzo.
No tendrá objetos iniciales.
La capacidad puede ampliarse posteriormente mediante:
Mochilas.
Contenedores.
Propiedades.
Almacenes.
Sistemas de faction.
Otros upgrades.

---


## A.25 Estadísticas iniciales

El modelo inicial utilizará una filosofía similar a RuneScape:
```text
Fuerza       1
Defensa      1
Velocidad    1
Destreza     1
```
El jugador comienza con estadísticas mínimas.
Los límites máximos todavía no están definidos.
Se diseñará posteriormente una fórmula de crecimiento y límites que evite que el sistema se vuelva infinito o imposible de balancear.

---


## A.26 NPCs y narrativa

Inicialmente no se requiere una campaña narrativa completa.
Los NPCs existirán principalmente para:
Dar personalidad.
Introducir mecánicas.
Vender objetos.
Ofrecer servicios.
Entregar misiones.
Desbloquear sistemas.
Ser enemigos.
Servir como contactos.
Crear humor.
Reaccionar a determinadas acciones.
La narrativa puede crecer posteriormente.
La ciudad debe poder sentirse viva sin exigir una historia lineal.

---


## A.27 Filosofía del tutorial

No se utilizará un tutorial largo tradicional.
La filosofía será:
> **El mundo enseña jugando.**
- Ejemplos:
| Sistema | Cómo se aprende |
| :--- | :--- |
| Combate | Peleando contra un NPC |
| Economía | Comprando el primer objeto |
| Inventario | Guardando el primer objeto |
| Equipamiento | Equipando el primer arma |
| Consumibles | Usando el primer objeto |
| Energy | Entrenando |
| Nerve | Cometiendo el primer crimen |
| Hospital | Recibiendo daño |
| Misiones | Completando el primer objetivo |
| Factions | Interactuando con otros jugadores |
El juego debe explicar solamente lo necesario en el momento adecuado.

---


## A.28 Primer objetivo

El primer objetivo exacto todavía está pendiente.
Debe cumplir tres características:
Ser sencillo.
Enseñar una mecánica importante.
Dar una recompensa visible.
#### Candidatos
Ganar el primer combate.
Comprar el primer arma.
Entrenar por primera vez.
Completar el primer crimen.
Completar una combinación corta de acciones.

---


## A.29 Nivel 2

Los requisitos exactos del nivel 2 todavía están pendientes.
Deberán probar que el jugador entendió las bases.
Posible estructura:
```text
⭐ XP suficiente

Requisitos:

☐ Ganar X combate(s)
☐ Entrenar X veces
☐ Comprar X objeto(s)
☐ Completar X crimen(es)
```
Los valores exactos se decidirán después de diseñar el primer ciclo de gameplay.

---


## A.30 Principios de diseño consolidados

- Estas reglas deben considerarse parte del núcleo del proyecto:
- Profundidad por debajo, simplicidad por encima.
- La interfaz crece con el jugador.
- El contenido bloqueado se representa únicamente con 🔒.
- No revelar contenido futuro innecesariamente.
- XP + requisitos/hitos para subir de nivel.
- Los requisitos cumplidos previamente cuentan.
- El jugador aprende mediante acciones, no mediante tutoriales extensos.
- Los NPCs deben tener personalidad aunque no exista una campaña narrativa.
- Cada zona debe tener una razón clara para existir.
- El backend puede ser complejo; la experiencia del jugador no debe serlo.
- Los recursos iniciales deben mantenerse limitados.
- La complejidad se desbloquea progresivamente.
- Las lesiones deben tener consecuencias reales.
- El hospital debe ser un sistema funcional, no solamente una pantalla de recuperación.
- El humor y el caos forman parte de la identidad del mundo.

## 40. PRÓXIMO PASO

No empezar todavía a programar.
- El siguiente trabajo recomendado es completar FASE 0 — PREPRODUCCIÓN, concretamente:
- Definir la visión exacta del juego.
- Definir qué mecánicas de Torn queremos conservar.
- Definir qué mecánicas vamos a modificar.
- Definir qué sistemas serán completamente originales.
- Definir las estadísticas base.
- Definir la economía inicial.
- Definir las fórmulas principales.
- Definir la arquitectura técnica.
- Definir el esquema inicial de base de datos.
- Convertir este documento en un backlog de tareas programables.
- Una vez terminada Fase 0, podremos comenzar Fase 1 con una especificación mucho más precisa y evitar rehacer sistemas posteriormente.

---

## 📖 Anexo B — Guía Completa de Funcionamiento del Sistema (Fases 0 a 16)

> Esta sección documenta detalladamente la arquitectura técnica, las mecánicas de juego y el funcionamiento interno de todos los módulos implementados en el proyecto desde la Fase 0 hasta la Fase 16.

---

### 🛡️ B.1 Arquitectura y Aislamiento por Servidor (Guild ID Isolation)
- **Persistencia Aislada por Servidor (`guildId`)**: Cada jugador posee un perfil de datos completamente aislado en cada servidor de Discord donde utilice el bot. El modelo de base de datos impone una clave única compuesta `@@unique([guildId, discordId])`. Esto impide que los usuarios puedan farmear recursos en servidores privados para transferirlos a servidores competitivos.
- **Sincronización Automática de Comandos (`Global & Instant Guild Sync`)**:
  - Al iniciar el proceso del bot en `src/index.ts`, se conecta a la REST API v10 de Discord y registra los comandos Slash (`/empezar`, `/game`, `/atacar`, `/admin`).
  - Aplica tanto registro **Global** (`Routes.applicationCommands`) como **Sincronización Instantánea por Servidor** (`Routes.applicationGuildCommands`), garantizando disponibilidad inmediata en 1 segundo sin demoras de caché.

---

### 👤 B.2 Jugador, Progresión y Salud Corporal (Fase 2)
- **Comando `/empezar`**: Registra al jugador de forma atómica en el servidor actual asignándole:
  - **Recursos Iniciales:** $100 en efectivo, 100/100⚡ de Energía, 10/10🧠 de Nerve y 100/100😊 de Happy.
  - **Battle Stats Iniciales:** Fuerza (`1.0`), Defensa (`1.0`), Velocidad (`1.0`) y Destreza (`1.0`).
  - **Working Stats Iniciales:** Fuerza Manual (`1.0`), Inteligencia (`1.0`) y Resistencia (`1.0`).
- **Salud Corporal en 6 Partes (6 Body Parts):**
  - Cabeza (`100 HP`), Torso (`100 HP`), Brazo Izquierdo (`100 HP`), Brazo Derecho (`100 HP`), Pierna Izquierda (`100 HP`) y Pierna Derecha (`100 HP`).
  - Durante los combates PvP, las extremidades sufren desgaste y daño localizado con barra de vida independiente.

---

### 💰 B.3 Economía, Inventario y Transacciones (Fases 3, 14 y 15)
- **Cartera Estricta (`Wallet`)**: Gestiona montos en efectivo (`cash`) y saldo bancario (`bank`) mediante enteros de 64 bits (`BigInt`) para prevenir desbordamientos o imprecisiones de punto flotante.
- **Registro de Auditoría Monetaria (`Transaction`)**: Cada ingreso, egreso, depósito, fianza o transferencia registra de forma atómica: `balanceBefore`, `balanceAfter`, tipo de transacción y metadatos JSON explicativos.
- **Catálogo de Ítems (178 Objetos de Torn Wiki)**: Incluye armas primarias, secundarias, cuerpo a cuerpo, temporales, botiquines, drogas y consumibles.
- **Inventario y Equipamiento (`InventoryItem`)**: Apilamiento de unidades por objeto, equipamiento en ranuras exclusivas (`PRIMARY`, `SECONDARY`, `MELEE`, `TEMPORARY`) y uso de consumibles con refresco dinámico de interfaz.

---

### 🏋️ B.4 Gimnasio y Fórmula Logarítmica de Torn (Fase 4)
- **Membresías por Tiers (7 Gimnasios)**: Progresión desde el gimnasio callejero inicial hasta el club de entrenamiento VIP.
- **Fórmula Oficial de Ganancia (Torn Wiki Log Formula)**:
  $$\text{StatGain} = \text{GymMultiplier} \times \left(1 + \frac{\text{Happy}}{250}\right) \times \log_{10}(\text{CurrentStat} + 10)$$
  - Cada sesión consume **5⚡ de Energía** y reduce de forma proporcional la Felicidad (`Happy`).

---

### ⚔️ B.5 Combate PvP y Post-Acciones (Fase 5)
- **Comando `/atacar @objetivo`**: Inicia un duelo PvP atómico con un consumo de **25⚡ de Energía**.
- **Cálculo de Duelo por Turnos**:
  - Evaluación de acierto/fallo calculada mediante la razón de **Velocidad vs Destreza**.
  - Cálculo de daño basado en la razón de **Fuerza vs Defensa** y la potencia de las armas equipadas.
  - **15% de Probabilidad de Impacto Crítico** dirigido a una de las 6 zonas corporales.
- **Acciones Posteriores a la Victoria**:
  - **Dejar Tirado (`Leave`):** Otorga el máximo de Experiencia (+100 XP).
  - **Asaltar (`Mug`):** Roba un porcentaje del efectivo en mano que portaba la víctima (+40 XP).
  - **Hospitalizar (`Hospitalize`):** Envía a la víctima al hospital de la ciudad durante 60 minutos (+20 XP).

---

### 🕵️ B.6 Crímenes, Crime Skill y Prisión / Jail (Fase 6)
- **Motor de Crímenes (`CrimeEngine`)**:
  - Actividades ilícitas (búsqueda de dinero, robos en tiendas, carterismo, asalto armado).
  - Consumen entre **2🧠 y 10🧠 de Nerve**.
  - Incrementan el **Crime Skill** y la **Crime XP**, aumentando progresivamente la tasa de éxito en delitos de mayor rango.
- **Prisión de la Ciudad (`City Jail`)**:
  - Los fracasos en delitos o fugas encarcelan al jugador bloqueando sus acciones.
  - **Fianza (`Bail`):** Pago de liberación calculado mediante `Bail = $100 * minutos * nivel`.
  - **Fuga Propia (`Self Bust`):** Intento de escape que consume el 50% del Nerve máximo disponible.

---

### 🎯 B.7 Bounties PvP y Misiones Diarias (Fase 7)
- **Bounties (Recompensas PvP)**:
  - Los jugadores colocan dinero sobre la cabeza de un jugador objetivo (10% de comisión).
  - Al ganar un duelo `/atacar` contra el objetivo, la recompensa se acredita **automáticamente** en la cartera del cazador.
- **Misiones Diarias (`Daily Missions`)**:
  - Objetivos de juego dinámicos (`CRIMES`, `ATTACKS`, `TRAINING`, `ITEMS`) que premian al jugador con dinero y experiencia al completarse.

---

### 💼 B.8 Trabajos y Educación (Fase 9)
- **Empleos de la Ciudad (`Jobs`)**:
  - Empleos en `Grocer` (Abarrotes), `Casino` y `Medical` (Hospital).
  - Requisitos de **Working Stats** (`manualLabor`, `intelligence`, `endurance`).
  - Pago diario de salario en efectivo, aumento de Working Stats y acumulación de **Job Points**.
- **Universidad y Cursos (`Education`)**:
  - Cursos de Biología (`BIO101`), Derecho (`LAW101`), Negocios (`BUS101`) y Combate (`COMBAT101`).
  - Temporizadores de estudio en tiempo real que conceden bonificaciones pasivas permanentes (descuentos en fianza, +10% salario, +5% daño).

---

### 🏴 B.9 Facciones, Tesorería y Crímenes Organizados (Fase 10)
- **Facciones (`Faction`)**:
  - Fundación de facciones ($50,000 en efectivo) con roles de `LEADER`, `CO_LEADER` y `MEMBER`.
  - **Tesorería Comunitaria (`treasury`):** Bóveda colectiva de la facción.
  - **Puntos de Respeto (`respect`):** Reputación de la facción.
- **Crímenes Organizados (`Organized Crimes`)**:
  - Golpes en equipo (`Asalto al Banco Central`) ejecutados por los líderes que generan **+$50,000** a la tesorería y **+150 Puntos de Respeto**.

---

### ⚔️ B.10 Guerras entre Facciones y Rankings (Fase 11)
- **Guerras de Facción (`FactionWar`)**:
  - Declaración de guerra entre facciones rivales con un objetivo de **100 Puntos de Guerra** y 24h de duración.
  - Cada combate PvP ganado por un miembro suma **+10 pts de guerra** y **+15 Puntos de Respeto**.
  - **Premio de Victoria:** +$100,000 en la tesorería y +500 Puntos de Respeto para la facción vencedora.
- **Ranking Server-Wide:** Tabla de clasificación de facciones ordenadas por Respeto.

---

### 🏡 B.11 Propiedades y Personal (Fase 12)
- **Propiedades Inmobiliarias (`PlayerProperty`)**:
  - Adquisición de `Shack` (Gratis), `Apartment` ($25k), `Penthouse` ($250k) e `Isla Privada` ($2.5M).
- **Personal Contratable (`Staff`)**:
  - Contratación de `Maid`, `Butler`, `Guard`, `Doctor` y `Pilot`.
  - Incrementa automáticamente el tope de Felicidad del jugador (`maxHappy`) hasta 5,000 puntos.

---

### ✈️ B.12 Viajes Internacionales (Fase 13)
- **Destinos Internacionales (`TravelState`)**:
  - Vuelos a `México 🇲🇽`, `Reino Unido 🇬🇧`, `Japón 🇯🇵` y `Suiza 🇨🇭`.
- **Mecánica de Vuelo**: Billetes de avión, tiempos de vuelo (15m a 120m) y acceso a mercados internacionales.

---

### 🏪 B.13 Mercado Abierto y Trading Directo (Fase 14)
- **Mercado entre Jugadores (`MarketItem`)**: Publicación de ítems del inventario a precios personalizados y compras con transferencia de efectivo entre carteras.
- **Comercio Directo (`Trade`)**: Intercambio atómico directo entre 2 jugadores con verificación de confirmación doble.

---

### 🏦 B.14 Inversiones Bancarias y Bolsa de Valores (Fase 15)
- **Depósitos Bancarios a Plazo Fijo (`BankInvestment`)**: Inversiones a 7 días (5%), 14 días (12%) o 28 días (30% de interés).
- **Bolsa de Valores (`Stock Market`)**: Compra y venta de acciones en empresas cotizadas (`TNC`, `SYS`, `MED`, `OIL`).

---

### 🏢 B.15 Empresas y Empleados (Fase 16)
- **Fundación de Empresas (`Company`)**: Adquisición de `Sweet Shop` ($100k), `Gun Shop` ($500k) y `Logistics Firm` ($1M).
- **Gestión Empresarial**: Contratación de empleados con salarios personalizados y recaudación de ganancias diarias.

---

### 🛠️ B.16 Suite de Administración (`/admin`)
- Comando con permisos restringidos a administradores para:
  - Otorgar/quitar efectivo o saldo bancario.
  - Modificar energía, nerve, happy o estadísticas de cualquier jugador.
  - Otorgar objetos al inventario de los usuarios.
  - Todos los comandos de admin quedan registrados en la tabla `AuditLog`.

---

### 🏎️ B.17 Carreras de Autos (Fase 17)
- **Circuidos de Velocidad (`RacingService`)**:
  - Competición en 3 autódromos (`Anillo Industrial`, `Autopista Central`, `Autódromo de Sinford`).
  - Simulación de tiempos de vuelta basados en la estadística de Velocidad del jugador, cuotas de entrada y registro histórico de resultados (`RaceResult`).

---

### 🎰 B.18 Casino y Juegos de Azar (Fase 18)
- **Juegos de Apuestas (`CasinoService`)**:
  - **Máquina Tragamonedas (Slots):** 3 carretes interactivos (🍒, 🔔, 7️⃣, 💎). Multiplicadores por par (2x), trío (10x) y Jackpot diamantes (50x).
  - **Blackjack (21):** Duelo directo contra la banca con auditoría monetaria estricta en `Transaction`.

---

### 💊 B.19 Ítems Avanzados, Drogas y Boosters (Fase 19)
- **Consumo de Drogas (`DrugAndBoosterService`)**:
  - `Xanax`: Otorga **+250⚡ de Energía** extra sobre el límite estándar.
  - `Éxtasis`: Duplica la Felicidad actual del jugador.
  - `Cannabis`: Aumenta el Nerve en +3.
  - **Mecánica de Sobredosis (2% OD Risk):** Envía al jugador de urgencia al hospital por 60 minutos y vacía la energía y felicidad a 0.
- **Boosters:** Bebidas energéticas (+100⚡) y cajas de chocolates (+150 Happy).

---

### 🏆 B.20 Progresión Avanzada, Logros y Rankings (Fase 20)
- **Sistema de Logros (`AchievementService`)**:
  - Desbloqueo atómico de logros (`FIRST_STEPS`, `MILLIONAIRE`, `CRIME_BOSS`, `PVP_CHAMPION`) con recompensas en dinero en efectivo.
- **Clasificaciones Server-Wide (`Leaderboards`)**: Rankings globales ordenados por Nivel, Riqueza, Battle Stats y Crímenes.
