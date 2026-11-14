import React from 'react';
import {
  MessageSquare,
  CheckSquare,
  Code2,
  Trophy,
  Calendar,
  Shield,
} from 'lucide-react';

export interface MobileNavBarProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
}

interface MobileTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  aliases: string[];
}

const TABS: MobileTabItem[] = [
  { id: 'chat', label: 'Общение', icon: MessageSquare, aliases: ['chat'] },
  { id: 'checklist', label: 'Задачи', icon: CheckSquare, aliases: ['checklist', 'tasks'] },
  { id: 'code-review', label: 'Код-ревью', icon: Code2, aliases: ['code-review', 'reviews'] },
  { id: 'achievements', label: 'Достижения', icon: Trophy, aliases: ['achievements'] },
  { id: 'absences', label: 'Отгулы', icon: Calendar, aliases: ['absences', 'leaves'] },
  { id: 'access', label: 'Доступы', icon: Shield, aliases: ['access'] },
];

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  onTabChange,
  setActiveTab,
}) => {
  const handleSelect = (tabId: string) => {
    const handler = onTabChange || setActiveTab;
    if (handler) {
      handler(tabId);
    }
  };

  const isTabActive = (tab: MobileTabItem): boolean => {
    if (activeTab === tab.id) return true;
    return tab.aliases.includes(activeTab);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 h-16 glass-dock xl:hidden flex items-center justify-around px-1.5 border-t border-white/15 backdrop-blur-2xl bg-[#080C16]/90 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
      role="navigation"
      aria-label="Мобильная навигация"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isTabActive(tab);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            onClick={() => handleSelect(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center min-w-[44px] min-h-[44px] h-full py-1 px-1 rounded-xl relative transition-all duration-200 cursor-pointer ${
              active
                ? 'text-[#04E061] font-bold bg-white/[0.08] shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            {/* Active Indicator Bar on Top */}
            {active && (
              <span className="absolute top-1 w-6 h-0.5 rounded-full bg-[#04E061] shadow-[0_0_8px_#04E061]" />
            )}

            <Icon
              size={19}
              className={`transition-transform duration-200 ${
                active ? 'text-[#04E061] scale-110 drop-shadow-[0_0_6px_rgba(4,224,97,0.5)]' : 'text-slate-400'
              }`}
            />

            <span className="text-[10px] mt-0.5 leading-tight truncate max-w-full">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavBar;
