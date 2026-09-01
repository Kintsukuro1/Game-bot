import { useState, useEffect } from 'react';

export interface EnergyRegenInfo {
  nextTickFormatted: string;
  fullRegenFormatted: string;
  secondsUntilNextTick: number;
  totalSecondsToFull: number;
  isFull: boolean;
  tickProgressPercent: number;
}

export function useEnergyRegen(currentEnergy: number = 100, maxEnergy: number = 100): EnergyRegenInfo {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMin = now.getMinutes();
  const currentSec = now.getSeconds();

  const minMod5 = currentMin % 5;
  const secondsUntilNextTick = (4 - minMod5) * 60 + (60 - currentSec);

  // Tick progress (0 to 100%) within current 5-min (300s) window
  const secondsPassedInTick = 300 - secondsUntilNextTick;
  const tickProgressPercent = Math.min(100, Math.max(0, (secondsPassedInTick / 300) * 100));

  // Format MM:SS for next tick
  const mins = Math.floor(secondsUntilNextTick / 60);
  const secs = secondsUntilNextTick % 60;
  const nextTickFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isFull = currentEnergy >= maxEnergy;
  const missingEnergy = Math.max(0, maxEnergy - currentEnergy);
  const ticksNeeded = Math.ceil(missingEnergy / 5);

  let totalSecondsToFull = 0;
  if (!isFull && missingEnergy > 0) {
    totalSecondsToFull = secondsUntilNextTick + (ticksNeeded - 1) * 300;
  }

  const formatFullRegen = (totalSecs: number) => {
    if (isFull || totalSecs <= 0) return 'Batería Completa (100%)';
    const hours = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (hours > 0) {
      return `${hours}h ${m}m`;
    }
    return `${m}m ${s}s`;
  };

  return {
    nextTickFormatted,
    fullRegenFormatted: formatFullRegen(totalSecondsToFull),
    secondsUntilNextTick,
    totalSecondsToFull,
    isFull,
    tickProgressPercent,
  };
}
