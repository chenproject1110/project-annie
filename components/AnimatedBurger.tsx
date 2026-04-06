'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedBurgerProps {
  isOpen: boolean;
}

const SPRING = { type: 'spring', stiffness: 350, damping: 25 } as const;
const REDUCED = { duration: 0.15 } as const;

export function AnimatedBurger({ isOpen }: AnimatedBurgerProps) {
  const reduceMotion = useReducedMotion();
  const t = reduceMotion ? REDUCED : SPRING;

  return (
    <div className="relative h-5 w-6" aria-hidden="true">
      {/* Top line → slides to centre & rotates into / */}
      <motion.span
        className="absolute left-0 block h-[2px] w-6 rounded-full bg-current origin-center"
        initial={false}
        animate={
          isOpen
            ? { top: 9, rotate: 45, transition: t }
            : { top: 2, rotate: 0, transition: t }
        }
      />

      {/* Middle line → scales to 0 width as a pivot */}
      <motion.span
        className="absolute left-0 block h-[2px] w-6 rounded-full bg-current origin-center"
        initial={false}
        animate={
          isOpen
            ? { top: 9, scaleX: 0, opacity: 0, transition: t }
            : { top: 9, scaleX: 1, opacity: 1, transition: t }
        }
      />

      {/* Bottom line → slides to centre & rotates into \ */}
      <motion.span
        className="absolute left-0 block h-[2px] w-6 rounded-full bg-current origin-center"
        initial={false}
        animate={
          isOpen
            ? { top: 9, rotate: -45, transition: t }
            : { top: 16, rotate: 0, transition: t }
        }
      />
    </div>
  );
}
