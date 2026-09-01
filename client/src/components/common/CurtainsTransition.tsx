import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './Icon';

interface CurtainsTransitionProps {
  tabKey: string;
  tabTitle?: string;
  tabIcon?: string;
  children: React.ReactNode;
}

export const CurtainsTransition: React.FC<CurtainsTransitionProps> = ({
  tabKey,
  tabTitle = 'Accediendo a Sector',
  tabIcon = 'apartment',
  children,
}) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>(children);
  const [targetTitle, setTargetTitle] = useState<string>(tabTitle);
  const [targetIcon, setTargetIcon] = useState<string>(tabIcon);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    // When tabKey changes, set the destination module name immediately!
    setTargetTitle(tabTitle);
    setTargetIcon(tabIcon);
    setIsTransitioning(true);

    // Swap the inner content after curtains close (at midpoint 350ms)
    const timer1 = setTimeout(() => {
      setDisplayedContent(children);
    }, 350);

    // Finish transition after curtains open (at 750ms total)
    const timer2 = setTimeout(() => {
      setIsTransitioning(false);
    }, 750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [tabKey]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Curtains Loading Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <>
            {/* Top Curtain Panel (Closes down from top) */}
            <motion.div
              key="curtain-top-panel"
              className="fixed inset-0 z-[100] bg-[#090a0f] pointer-events-none flex flex-col justify-end border-b border-cyan-500/60 shadow-[0_10px_30px_rgba(6,182,212,0.5)]"
              initial={{ scaleY: 0, originY: 0 }}
              animate={{
                scaleY: [0, 1, 1, 0],
                originY: [0, 0, 0, 0],
              }}
              transition={{
                duration: 0.75,
                times: [0, 0.45, 0.55, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4]"></div>
            </motion.div>

            {/* Bottom Curtain Panel (Closes up from bottom) */}
            <motion.div
              key="curtain-bottom-panel"
              className="fixed inset-0 z-[100] bg-[#0c1324] pointer-events-none flex flex-col justify-start border-t border-amber-500/60 shadow-[0_-10px_30px_rgba(245,158,11,0.5)]"
              initial={{ scaleY: 0, originY: 1 }}
              animate={{
                scaleY: [0, 1, 1, 0],
                originY: [1, 1, 1, 1],
              }}
              transition={{
                duration: 0.75,
                times: [0, 0.45, 0.55, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b]"></div>
            </motion.div>

            {/* Destination Module Name Overlay */}
            <motion.div
              key="curtain-destination-text"
              className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.9, 1, 1, 1.05],
              }}
              transition={{
                duration: 0.75,
                times: [0, 0.25, 0.65, 1],
                ease: 'easeInOut',
              }}
            >
              <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <div className="flex items-center gap-3">
                  <Icon name={targetIcon} size={28} className="text-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.25em] font-bold">
                    DESTINO // SINFORD OS
                  </span>
                </div>

                <h2 className="font-headline-lg text-xl sm:text-3xl font-extrabold text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.7)] text-center">
                  {targetTitle}
                </h2>

                <div className="w-56 h-1 bg-slate-900 rounded-full overflow-hidden relative border border-white/10 mt-1">
                  <div className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Module Content */}
      <div className="w-full h-full">{displayedContent}</div>
    </div>
  );
};
