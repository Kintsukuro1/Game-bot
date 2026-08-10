# 🏗️ 04_ARCHITECTURE.md — Arquitectura Técnica

## 1. Stack Tecnológico
- **Lenguaje:** TypeScript (v5.x)
- **Runtime:** Node.js (v20+ LTS / v24)
- **Discord Library:** `discord.js` v14
- **ORM / Base de Datos:** Prisma ORM con SQLite para desarrollo local y PostgreSQL para producción.
- **Configuración:** `dotenv` para variables de entorno estrictas.
- **Scheduler:** Tareas de cron internas para regeneración periódica.

## 2. Estructura de Módulos del Proyecto
```text
src/
├── commands/           # Handler y comandos slash (/register, /profile, /gym, /crime, etc.)
│   ├── general/        # Comandos generales (/profile, /help)
│   ├── economy/        # Comandos monetarios e inventario (/inventory, /shop)
│   ├── combat/         # Comandos de gimnasio y combate (/gym, /attack)
│   └── crime/          # Comandos de crímenes (/crime)
├── events/             # Handlers de eventos de discord.js (interactionCreate, ready)
├── db/                 # Cliente de Prisma y servicios de base de datos
│   ├── prisma.ts       # Singleton client
│   └── services/       # Lógica de negocio encapsulada (PlayerService, EconomyService)
├── services/           # Servidores auxiliares (Scheduler, AuditLogger)
├── ui/                 # Generadores de Embeds, Botones y Menús estándar
├── types/              # Definiciones de TypeScript e Interfaces
├── config/             # Constantes del juego (Fórmulas, Cooldowns, Lista de Ítems)
└── index.ts            # Punto de entrada de la aplicación
```

## 3. Seguridad Económica y Anti-Exploit
1. **Transacciones Atómicas:** Toda operación que altere la cartera (`Wallet`) o el `Inventory` debe ejecutarse dentro de un `$transaction` de Prisma.
2. **Rate Limit Servidor:** Control estricto de cooldowns antes de procesar interacciones para evitar duplicación por spam de botones.
3. **Auditoría Estricta:** Todo cambio de saldo monetario o traspaso de ítem registra una entrada inmutable en la tabla `AuditLog`.
