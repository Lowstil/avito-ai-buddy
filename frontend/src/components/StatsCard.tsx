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
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.2 }}
      className={`glass-card glass-card-interactive glass-specular specular-inset px-4 py-3 rounded-2xl relative overflow-hidden bg-gradient-to-br ${gradient} border border-white/10 hover:border-white/25 transition-all group`}
    >
      {/* Top-edge specular reflection */}
      <div
        className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.28), ${accentColor}66, transparent)`
        }}
      />

      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-300 truncate">
              {title}
            </p>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-xl sm:text-[22px] leading-tight font-black text-white tracking-tight truncate">
              {value}
            </h2>
            {change !== undefined && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0"
                style={{
                  backgroundColor: `${accentColor}1f`,
                  borderColor: `${accentColor}4d`,
                  color: accentColor
                }}
              >
                <ArrowUpRight size={11} className="inline shrink-0" />
                <span>{change}%</span>
              </span>
            )}
          </div>

          {change !== undefined && (
            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5 leading-snug">
              {changeLabel}
            </p>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/15 shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{
            backgroundColor: `${accentColor}1c`,
            color: accentColor,
            boxShadow: `0 0 18px ${accentColor}26, inset 0 1px 0 rgba(255,255,255,0.22)`
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Bottom neon laser accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-85"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent 85%)` }}
      />
    </motion.div>
  );
};
