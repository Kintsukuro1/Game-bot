# 🎮 01_GAME_DESIGN.md — Documento de Diseño del Juego (Definitivo)

## 1. Visión General
* **Nombre del Proyecto:** Sinford Underworld (*Torn-inspired Discord RPG*)
* **Plataforma Principal:** Discord Bot (`discord.js` v14) con componentes visuales enriquecidos (Embeds HSL, Botones interactivos, Menús desplegables y Modales).
* **Temática:** RPG urbano persistente de crimen, combate visceral por partes del cuerpo, economía abierta de mercado y geopolítica de facciones.
* **Filosofía Fundamental:** *Profundidad por debajo, simplicidad por encima.*

---

## 2. Experiencia de Usuario y UX en Discord

### 2.1 Navegación Exclusiva por Hub Visual de Botones
Toda la interacción del juego se canaliza a través de la interfaz central (`/ciudad` o `/game`).
* Se eliminan los comandos slash individuales secundarios para mantener el canal limpio.
* Los jugadores navegan entre distritos, gimnasio, crímenes, inventario, tiendas y facciones mediante **filas de botones dinámicos y menús desplegables**.

### 2.2 Notificaciones Públicas e Interacción Social
* **Menciones Públicas en Canal:** Cuando un jugador es asaltado (Mug), hospitalizado o colocado en una lista de recompensas (Bounty), el bot envía una mención explícita (`@usuario`) en el canal público de la ciudad.
* Esto fomenta la rivalidad, el drama social y la interacción comunitaria dentro del servidor de Discord.

---

## 3. Onboarding y Core Loop (Minutos 0 a 30)

### 3.1 Filosofía Sandbox
El jugador comienza en **Sandbox Total desde el Minuto 0**. Al ejecutar `/empezar`:
* Recibe **\$500 en efectivo iniciales**, 100⚡ de Energía, 100🧠 de Nerve y 100😊 de Happiness.
* Todos los hubs principales del menú `/game` o `/ciudad` están accesibles con navegación libre por botones.

### 3.2 Loop de Juego Progresivo

```text
  [ Registro / $500 ]
         │
         ▼
 ┌───────────────┐        ┌──────────────────┐        ┌─────────────────────┐
 │  CRÍMENES &   │ ─────► │ ENTRENAMIENTO &  │ ─────► │   EQUIPAMIENTO &    │
 │   TRABAJO     │        │    GIMNASIO      │        │    MERCADO NEGRO    │
 └───────────────┘        └──────────────────┘        └─────────────────────┘
         │                         │                             │
         ▼                         ▼                             ▼
 ┌───────────────┐        ┌──────────────────┐        ┌─────────────────────┐
 │ PvP & BOUNTIES│ ◄───── │   CÁRCEL / MUG   │ ◄───── │  GUERRAS & RAIDS    │
 └───────────────┘        └──────────────────┘        └─────────────────────┘
```

---

## 4. Identidad del Jugador: Builds y Perks de Maestría Orgánica

La especialización se adquiere **orgánicamente por uso**:
* ⚔️ **Combate (Fighter):** Entrenar y pelear sube Combate (daño crítico e inmunidad al cansancio).
* 🕵️ **Criminal (Hitman / Criminal):** Crímenes y atracos sube Criminal (éxito en crímenes y descuentos).
* 💼 **Negocios (Businessman / Investor):** Salarios, empresas y stocks sube Negocios (dividendos extra).
* 🏴 **Facción (Leader / Strategist):** Crímenes Organizados y Guerras sube Facción (perks comunitarios).

---

## 5. Subsistemas Económicos Específicos

### 5.1 Empresas Privadas & Perks de Empleados
* **Sweet Shop:** Dulces de Energía (+20⚡).
* **Gun Shop:** Munición de Alto Calibre (+10% daño).
* **Logistics:** Reducción de Tiempos de Viaje (-25%).
* **Medical Firm:** Botiquines Médicos Profesionales.

### 5.2 Drogas, Adicción y Rehabilitación en Suiza
* Consumir drogas otorga impulsos masivos pero acumula **Adicción** (degrada Happy y gimnasio).
* 5% de probabilidad de sobredosis (Hospital 60 min, Happy 0).
* Desintoxicación disponible mediante viajes a **Suiza**.

### 5.3 Bolsa de Valores (Dividend Blocks)
Bloques de 10,000 acciones otorgan dividendos pasivos semanales (Cajas médicas, Latas +50⚡, Vuelos gratis o Efectivo).

---

## 6. Endgame Híbrido & Persistencia

### 6.1 Los 4 Distritos Urbanos (Disputa Semanal)
1. 🚢 **Docks / Zona Portuaria:** -15% en vuelos internacionales.
2. 🏦 **Centro Financiero:** 3% de impuesto sobre depósitos bancarios de la ciudad.
3. 🏭 **Distrito Industrial:** +10% de daño en guerras y descuento en armas pesadas.
4. 🍷 **Barrio Rojo / Mercado Negro:** 5% de comisión sobre ventas del Mercado Negro.

### 6.2 Raids Mundiales de Fin de Semana
Mega-Boss IA (50,000+ HP) los fines de semana con reparto de botín transparente según Leaderboard público de daño.

### 6.3 Persistencia Sin Wipes & Rankings Mensuales
* El progreso de los personajes es **100% permanente (sin reinicios/wipes)**.
* Competencia mensual en tablas de clasificación (Top PvP, Top Crímenes, Top Respeto de Facción) con entrega de medallas y títulos de estatus exclusivos.

---

## 7. Reglas Anti-Exploit y Anti-Farm

1. **Límite de Mug:** Máximo 2 asaltos exitosos (Mug) a la misma víctima por 24 horas.
2. **PvP Repetido:** Atacar al mismo objetivo en menos de 1 hora otorga **0 XP**.
3. **Transferencias Monetarias:** Requieren Nivel 5+ y aplican una comisión bancaria del 10%.
