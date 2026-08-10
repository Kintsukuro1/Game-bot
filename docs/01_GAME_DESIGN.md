# 🎮 01_GAME_DESIGN.md — Documento de Diseño del Juego

## 1. Visión General
* **Nombre provisional:** *Sinford Underworld* / *TornCord*
* **Plataforma Principal:** Discord Bot (`discord.js` v14) con componentes visuales (Embeds, Botones, Select Menus, Modals).
* **Temática:** RPG urbano persistente de crimen, combate, economía y facciones inspirado en Torn.
* **Tono:** Humor caótico y satírico con mecánicas de juego profundas y realistas.

## 2. Los 4 Caminos del Jugador
El juego no impone una clase fija. La especialización surge del estilo de juego:
1. **⚔️ Peleador:** Enfocado en entrenar estadísticas de combate en el gimnasio, comprar armas avanzadas, realizar Bounties y participar en guerras de facciones.
2. **🕵️ Criminal:** Especializado en crímenes, mercado negro, contrabando y habilidades de infiltración.
3. **💼 Empresario:** Enfocado en empleos, desarrollo de stats laborales, administración de empresas, contratación de otros jugadores e inversiones.
4. **🏴 Social / Faction:** Enfocado en liderar alianzas, coordinar Crímenes Organizados y controlar territorios.

## 3. Filosofía de Interfaz (UX Discord)
> **Profundidad por debajo, simplicidad por encima.**
- **El Hub Central (`/game` o `/ciudad`):** Punto de entrada dinámico con interfaz visual de botones.
- **Descubrimiento Gradual:** El contenido bloqueado solo muestra `🔒` sin revelar detalles para generar curiosidad.
- **La interfaz crece con el jugador:** Un nuevo jugador comienza con 3 opciones básicas (Pelear NPC, Comprar navaja, Gimnasio básico).
