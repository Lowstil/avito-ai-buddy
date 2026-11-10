import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeLabel?: string;
  icon: LucideIcon;
  gradient?: string;
  accentColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeLabel = "за неделю",
  icon: Icon,
  gradient = "from-emerald-500/20 to-teal-500/5",
  accentColor = "#04E061"
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`glass-card p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{title}</p>
          <h2 className="text-2xl font-black text-white tracking-tight">{value}</h2>
          {change !== undefined && (
            <p className="flex items-center gap-1 text-xs font-medium text-emerald-400 mt-2">
              <span className="flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                <ArrowUpRight size={13} className="inline" /> {change}%
              </span>
              <span className="text-slate-400 ml-1">{changeLabel}</span>
            </p>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <Icon size={24} />
        </div>
      </div>
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />
    </motion.div>
  );
};
