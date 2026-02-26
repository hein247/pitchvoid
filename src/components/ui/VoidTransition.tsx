import { motion, AnimatePresence } from 'framer-motion';

interface VoidTransitionProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function VoidTransition({ isActive, onComplete }: VoidTransitionProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {/* Radial pull overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(var(--background)) 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 8, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Dark core that expands */}
          <motion.div
            className="absolute inset-0 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onAnimationComplete={onComplete}
          />

          {/* Vortex ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 4,
              height: 4,
              boxShadow: '0 0 80px 40px hsl(var(--primary) / 0.6), 0 0 160px 80px hsl(var(--primary) / 0.2)',
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 30, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
