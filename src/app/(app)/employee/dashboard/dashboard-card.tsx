'use client';

import { motion } from 'framer-motion';

type DashboardCardProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

export function DashboardCard({ children, delay = 0, className }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
