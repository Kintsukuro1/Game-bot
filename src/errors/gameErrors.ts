export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class InsufficientFundsError extends GameError {
  constructor(requiredAmount?: string | bigint | number, availableAmount?: string | bigint | number) {
    const details = requiredAmount && availableAmount ? ` (Requerido: $${requiredAmount.toLocaleString()} | Tienes: $${availableAmount.toLocaleString()})` : '';
    super(`❌ Fondo insuficiente para completar la transacción monetaria${details}.`);
    this.name = 'InsufficientFundsError';
  }
}

export class InvalidAmountError extends GameError {
  constructor(message: string = '❌ La cantidad introducida debe ser un número entero estrictamente mayor a 0.') {
    super(message);
    this.name = 'InvalidAmountError';
  }
}

export class CasinoBetLimitError extends GameError {
  constructor(maxBet: bigint) {
    super(`🎲 La apuesta excede el límite máximo permitido por la casa ($${maxBet.toLocaleString()}).`);
    this.name = 'CasinoBetLimitError';
  }
}

export class CooldownError extends GameError {
  constructor(actionName: string, remainingTimeStr: string) {
    super(`⏳ Debes esperar **${remainingTimeStr}** antes de volver a ejecutar **${actionName}**.`);
    this.name = 'CooldownError';
  }
}

export class LevelRequirementError extends GameError {
  constructor(requiredLevel: number, currentLevel: number) {
    super(`🔒 Requieres Nivel ${requiredLevel} para acceder a esta función (Tu Nivel: ${currentLevel}).`);
    this.name = 'LevelRequirementError';
  }
}
