import React from 'react';
import { ExternalLink, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative mt-auto border-t border-white/10 glass-panel backdrop-blur-2xl z-10 overflow-hidden">
      {/* Subtle top specular border highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#04E061]/40 to-transparent pointer-events-none" />

      {/* Compact Status Container (40-60px height) */}
      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 py-2 sm:py-2.5 min-h-[44px] sm:h-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        
        {/* Left: System Status with Green Pulse Dot */}
        <div className="flex items-center gap-2 text-slate-300 shrink-0">
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#04E061] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#04E061] shadow-[0_0_8px_#04E061]"></span>
          </span>
          <span className="font-semibold text-white text-[11px] sm:text-xs">Все системы в норме</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-mono text-[10px] sm:text-[11px]">200 ms</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[10px] sm:text-[11px]">Avito AI-Buddy</span>
        </div>

        {/* Center: Copyright & Legal */}
        <div className="text-slate-400 text-[10px] sm:text-[11px] text-center">
          <span>© 2026 Avito AI-Buddy • Hack&Change 2026. Команда Lowstil</span>
        </div>

        {/* Right: Repository Link with Strict Security Attributes */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://github.com/Lowstil/avito-ai-buddy"
            target="_blank"
            rel="noreferrer"
            className="glass-pill px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 hover:border-white/20"
          >
            <Code2 size={13} className="text-[#04E061]" />
            <span>GitHub Repository</span>
            <ExternalLink size={11} className="text-slate-400" />
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
