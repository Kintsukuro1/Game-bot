# ⚡ 02_CORE_RULES.md — Reglas Fundamentales del Juego

## 1. Recursos Base y Regeneración

| Recurso | Icono | Máximo Inicial | Regeneración Base | Propósito Principal |
| :--- | :---: | :---: | :--- | :--- |
| **Energía** | ⚡ | 100 | +5 cada 5 min | Combate PvP/NPC, entrenamiento en Gimnasio |
| **Nerve** | 🧠 | 100 | +1 cada 5 min | Ejecución de crímenes e ilegalidades |
| **Happiness** | 😊 | 100 | Vía propiedades y consumibles | Multiplicador de efectividad en entrenamiento |
| **Dinero (Cash)** | 💰 | \$500 | Vía crímenes, trabajo, empresas | Transacciones en mano y comercio |
| **Dinero (Bank)** | 🏦 | \$0 | Interés compuesto | Almacenamiento seguro contra robos PvP |

---

## 2. Sistema de Combate Corporal (6 Partes)

El combate calcula el daño de forma localizada sobre 6 partes corporales independientes (100 HP cada una):

```text
               [ 🧠 Cabeza (100 HP) ]
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
[ 💪 Brazo Izq ]   [ 🫀 Torso (100 HP) ]   [ 💪 Brazo Der ]
  (100 HP)               │                     (100 HP)
             ┌───────────┴───────────┐
             │                       │
     [ 🦵 Pierna Izq ]       [ 🦵 Pierna Der ]
         (100 HP)                (100 HP)
```

* **🧠 Cabeza (1.5x Multiplicador de Daño):** Golpe crítico en cabeza provoca incapacitación inmediata y mayor tiempo de hospitalización.
* **🫀 Torso (1.0x Multiplicador):** Centro vital. Si el HP del torso o la suma total del cuerpo cae a 0, el defensor queda fuera de combate.
* **💪 Brazos (0.8x Multiplicador):** Sufrir daño reduce la precisión y el daño causado con armas equipadas.
* **🦵 Piernas (0.8x Multiplicador):** Sufrir daño drásticamente reduce la probabilidad de evasión (*Dexterity*).

---

## 3. Fórmulas de Combate PvP (Estilo Torn)

### 3.1 Probabilidad de Acierto (Hit Rate)
$$\text{HitChance} = \text{clamp}\left(0.5 \times \frac{\text{AttackerSpeed}}{\max(\text{DefenderDexterity}, 0.1)} \times \frac{\text{WeaponAccuracy}}{50}, 0.1, 0.95\right)$$

### 3.2 Daño Final (Damage Formula)
$$\text{RawDamage} = \text{WeaponDamage} \times \sqrt{\frac{\text{AttackerStrength}}{\max(\text{DefenderDefense}, 0.1)}} \times \text{PartMultiplier} \times \text{CritMultiplier} \times \text{Random}(0.85, 1.15)$$

---

## 4. Opciones Post-Victoria y Hospitalización Rápida

Cuando un atacante vence en un combate PvP, consume **25⚡ de Energía** y debe elegir 1 de 3 decisiones post-combate:

| Opción | XP Ganada | Efectivo Robado (Mug) | Tiempo de Hospital de la Víctima |
| :--- | :---: | :---: | :---: |
| **🚪 LEAVE (Dejar)** | **+100 XP** (Máxima) | \$0 | 15 minutos |
| **💸 MUG (Asaltar)** | **+40 XP** | **5% a 15% del Cash en mano** | 20 minutos |
| **🚑 HOSPITALIZE (Hospitalizar)** | **+20 XP** | \$0 | **60 minutos** |

### Reglas de Hospitalización (Tipo Torn):
1. **Sin Perma-death:** El hospital es un estado temporal que bloquea al jugador de realizar crímenes, entrenar o iniciar ataques PvP.
2. **Alta Médica Inmediata:** La hospitalización se puede cancelar instantáneamente consumiendo ítems médicos (ej. *Botiquín Rápido*, *Morfina*).
3. **Protección de Novatos:** Jugadores de nivel menor a 2 no pueden ser atacados ni hospitalizados.
