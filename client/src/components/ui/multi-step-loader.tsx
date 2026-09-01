"use client";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "../common/Icon";

export interface LoadingState {
  text: string;
}

export interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  value?: number;
  loop?: boolean;
  onComplete?: () => void;
}

export const MultiStepLoaderCore = ({
  loadingStates,
  currentState = 0,
}: {
  loadingStates: LoadingState[];
  currentState?: number;
}) => {
  return (
    <div className="flex flex-col justify-start relative max-w-xl mx-auto font-sans w-full">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - currentState);
        const opacity = Math.max(1 - distance * 0.3, 0.25);

        return (
          <motion.div
            key={index}
            className="flex items-center gap-3 text-left py-2 transition-all duration-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: opacity, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-center w-6 h-6 shrink-0">
              {index < currentState ? (
                <Icon name="check" size={24} className="text-[#39C3EF] shrink-0 drop-shadow-[0_0_8px_rgba(57,195,239,0.8)]" />
              ) : index === currentState ? (
                <Icon name="loader" size={24} className="text-[#39C3EF] animate-spin shrink-0 drop-shadow-[0_0_10px_rgba(57,195,239,0.9)]" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-700/70 shrink-0" />
              )}
            </div>
            <span
              className={`text-sm sm:text-base font-medium tracking-wide transition-all duration-200 ${
                index === currentState
                  ? "text-white font-bold text-base sm:text-lg text-cyan-300 drop-shadow-[0_0_10px_rgba(57,195,239,0.7)]"
                  : index < currentState
                  ? "text-slate-300/80 font-medium line-through opacity-70"
                  : "text-slate-500 font-normal opacity-50"
              }`}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  value,
  loop = false,
  onComplete,
}: MultiStepLoaderProps) => {
  const [internalState, setInternalState] = useState(0);

  const currentState = value !== undefined ? value : internalState;

  useEffect(() => {
    if (!loading) {
      setInternalState(0);
      return;
    }

    if (value !== undefined) return;

    const interval = setInterval(() => {
      setInternalState((prevState) => {
        if (prevState < loadingStates.length - 1) {
          return prevState + 1;
        }
        if (loop) {
          return 0;
        }
        if (onComplete) {
          onComplete();
        }
        return prevState;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [loading, duration, loop, loadingStates.length, onComplete, value]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full fixed inset-0 z-[120] flex items-center justify-center bg-[#090a0f] backdrop-blur-2xl p-4"
        >
          <div className="relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-[#090a0f]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(57,195,239,0.2)] overflow-hidden max-w-md w-full min-h-[380px]">
            {/* Top scanning line glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#39C3EF] to-transparent animate-pulse" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#39C3EF] animate-ping" />
                <span className="font-mono text-xs text-[#39C3EF] uppercase tracking-[0.2em] font-bold">
                  SINFORD SYSTEM // LOADING
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
                {Math.round((Math.min(currentState + 1, loadingStates.length) / loadingStates.length) * 100)}%
              </span>
            </div>

            {/* Steps list */}
            <div className="flex-1 flex flex-col justify-center py-3 overflow-hidden">
              <MultiStepLoaderCore
                loadingStates={loadingStates}
                currentState={currentState}
              />
            </div>

            {/* Progress bar footer */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#39C3EF] via-cyan-400 to-emerald-400"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${(Math.min(currentState + 1, loadingStates.length) / loadingStates.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>Iniciando sesión...</span>
                <span className="text-slate-500">Paso {Math.min(currentState + 1, loadingStates.length)} de {loadingStates.length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
