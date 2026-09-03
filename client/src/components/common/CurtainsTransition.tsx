import React, { useEffect, useState, useRef } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [displayedChildren, setDisplayedChildren] = useState<React.ReactNode>(children);
  const [currentTitle, setCurrentTitle] = useState<string>(tabTitle);
  const [currentIcon, setCurrentIcon] = useState<string>(tabIcon);

  const prevTabKeyRef = useRef<string>(tabKey);
  const latestChildrenRef = useRef<React.ReactNode>(children);
  latestChildrenRef.current = children;

  useEffect(() => {
    // If tabKey is unchanged (same tab), update live children if not transitioning
    if (tabKey === prevTabKeyRef.current) {
      if (!isTransitioning) {
        setDisplayedChildren(children);
      }
      return;
    }

    // A NEW tab was clicked! Start curtain transition:
    setCurrentTitle(tabTitle);
    setCurrentIcon(tabIcon);
    setIsTransitioning(true);

    // Midpoint (350ms): Curtains fully cover screen. Swap content to new children now!
    const swapTimer = setTimeout(() => {
      setDisplayedChildren(latestChildrenRef.current);
      prevTabKeyRef.current = tabKey;
    }, 350);

    // End (700ms): Curtains open revealing new content.
    const finishTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, 700);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(finishTimer);
    };
  }, [tabKey, tabTitle, tabIcon]);

  // Handle live updates for same tab when children prop changes
  useEffect(() => {
    if (tabKey === prevTabKeyRef.current && !isTransitioning) {
      setDisplayedChildren(children);
    }
  }, [children, tabKey, isTransitioning]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Curtains Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <>
            {/* Top Curtain Panel */}
            <motion.div
              key={`curtain-top-${tabKey}`}
              className="fixed inset-0 z-[100] bg-[#090a0f] pointer-events-none flex flex-col justify-end border-b border-cyan-500/60 shadow-[0_10px_30px_rgba(6,182,212,0.5)]"
              initial={{ scaleY: 0, originY: 0 }}
              animate={{
                scaleY: [0, 1, 1, 0],
                originY: [0, 0, 0, 0],
              }}
              exit={{ scaleY: 0 }}
              transition={{
                duration: 0.7,
                times: [0, 0.45, 0.55, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4]"></div>
            </motion.div>

            {/* Bottom Curtain Panel */}
            <motion.div
              key={`curtain-bottom-${tabKey}`}
              className="fixed inset-0 z-[100] bg-[#0c1324] pointer-events-none flex flex-col justify-start border-t border-amber-500/60 shadow-[0_-10px_30px_rgba(245,158,11,0.5)]"
              initial={{ scaleY: 0, originY: 1 }}
              animate={{
                scaleY: [0, 1, 1, 0],
                originY: [1, 1, 1, 1],
              }}
              exit={{ scaleY: 0 }}
              transition={{
                duration: 0.7,
                times: [0, 0.45, 0.55, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b]"></div>
            </motion.div>

            {/* Destination Module Badge */}
            <motion.div
              key={`curtain-badge-${tabKey}`}
              className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.9, 1, 1, 1.05],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.7,
                times: [0, 0.25, 0.65, 1],
                ease: 'easeInOut',
              }}
            >
              <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <div className="flex items-center gap-3">
                  <Icon name={currentIcon} size={28} className="text-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.25em] font-bold">
                    DESTINO // SINFORD OS
                  </span>
                </div>

                <h2 className="font-headline-lg text-xl sm:text-3xl font-extrabold text-cyan-400 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.7)] text-center">
                  {currentTitle}
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
      <div className="w-full h-full">{displayedChildren}</div>
    </div>
  );
};
