import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

type Props = {
  id: string;
  points: number;
};

export function PointsFly({ id, points }: Props) {
  const dismissFlight = useStore((s) => s.dismissFlight);

  useEffect(() => {
    const timer = window.setTimeout(() => dismissFlight(id), 700);
    return () => window.clearTimeout(timer);
  }, [id, dismissFlight]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.85 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="pointer-events-none absolute right-0 top-0 z-10 whitespace-nowrap text-lg font-bold text-gold"
    >
      +{points} ★
    </motion.div>
  );
}
