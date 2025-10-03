
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10
  },
  in: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: -10
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedTransition;
