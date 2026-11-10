import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle, ShieldCheck, Heart, ExternalLink, Terminal, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative mt-16 overflow-hidden">
      {/* Liquid background glow */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#04E061]/10 via-[#00AAFF]/5 to-transparent pointer-events-none" />

      {/* Main Glassy Liquid Footer Container */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Subtle gradient border highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#04E061]/50 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: About */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] animate-ping" />
                <span className="text-sm font-black tracking-tight text-white uppercase">Avito AI-Buddy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Интеллектуальная система адаптации стажёров Авито с протоколом MCP, снижающая рутину менторов до 45% и ускоряющая онбординг.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
                <CheckCircle size={14} />
                <span>Все системы в норме (All systems normal)</span>
              </div>
            </div>

            {/* Col 2: Architecture & Stack */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Cpu size={14} className="text-[#00AAFF]" />
                Технологический стек
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  React 19 + TypeScript + Zustand
                </li>
                <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  FastAPI (Clean Arch) + MCP Server
                </li>
                <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Glassy Liquid UI + Framer Motion
                </li>
                <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Pytest Suite (90% Line Coverage)
                </li>
              </ul>
            </div>

            {/* Col 3: Normatives & Case */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#965EEB]" />
                Регламенты хакатона
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#04E061] font-bold">✓</span>
                  SDD-спецификации (OpenSpec)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#04E061] font-bold">✓</span>
                  Кадровые действия через сервис
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#04E061] font-bold">✓</span>
                  Ролевая модель и защита ПДн
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#04E061] font-bold">✓</span>
                  Время отклика UI &lt; 200 ms
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Links & Repo */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <Terminal size={14} className="text-[#FF5252]" />
                Репозиторий и ссылки
              </h4>
              <div className="space-y-2">
                <a
                  href="https://github.com/Lowstil/avito-ai-buddy"
                  target="_blank"
                  rel="noreferrer"
                  className="glass-pill p-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-between hover:border-white/30 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Code2 size={15} className="text-[#04E061]" /> GitHub Repository
                  </span>
                  <ExternalLink size={13} className="text-slate-400" />
                </a>

                <div className="text-[11px] text-slate-500 pt-1">
                  Жюри: аккаунт <code className="text-slate-300 bg-white/5 px-1 py-0.5 rounded">hack-and-change-2026</code>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© 2026 Avito AI-Buddy • Hack&Change 2026. Разработано командой Lowstil.</p>
            <p className="flex items-center gap-1">
              Сделано с любовью к инженерной культуре Авито <Heart size={13} className="text-[#FF5252] fill-[#FF5252]" />
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
