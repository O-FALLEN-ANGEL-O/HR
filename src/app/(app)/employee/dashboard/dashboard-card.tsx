'use client';

import { motion } from 'framer-motion';

type DashboardCardProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  fullWidthOnMobile?: boolean;
};

export function DashboardCard({ children, delay = 0, className, fullWidthOnMobile = false }: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        className,
        fullWidthOnMobile ? "col-span-full" : ""
      )}
    >
      {children}
    </motion.div>
  );
}
