import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Ban } from 'lucide-react';
import type { AbsenceRequest } from '../types';

interface GlassyCalendarProps {
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
  interactive?: boolean;
  highlightDate?: string;
  highlightStatus?: 'pending_approval' | 'approved' | 'rejected';
  existingAbsences?: AbsenceRequest[];
  size?: 'sm' | 'md' | 'lg';
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const formatRussianDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const d = new Date(year, month, day);
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const monthGenitive = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  return `${day} ${monthGenitive[month]} ${year} г. (${daysOfWeek[d.getDay()]})`;
};

export const GlassyCalendar: React.FC<GlassyCalendarProps> = ({
  selectedDate = '2026-11-20',
  onSelectDate,
  interactive = true,
  highlightDate,
  highlightStatus = 'pending_approval',
  existingAbsences = [],
  size = 'md'
}) => {
  // Parse initial year and month from selected or highlight date
  const baseDate = highlightDate || selectedDate || '2026-11-20';
  const initialYear = parseInt(baseDate.split('-')[0], 10) || 2026;
  const initialMonth = (parseInt(baseDate.split('-')[1], 10) || 11) - 1;

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calculations for days grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Monday is 0, Sunday is 6
  const startingOffset = (firstDayOfWeek + 6) % 7;

  const days: { day: number; dateStr: string; isWeekend: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const padM = String(currentMonth + 1).padStart(2, '0');
    const padD = String(d).padStart(2, '0');
    const dateStr = `${currentYear}-${padM}-${padD}`;
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    days.push({ day: d, dateStr, isWeekend });
  }

  const activeDateToHighlight = highlightDate || selectedDate;

  return (
    <div className={`glass-card rounded-2xl border border-white/10 ${size === 'sm' ? 'p-3 text-xs' : 'p-4 text-xs'}`}>
      
      {/* Calendar Header with Month & Controls */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
        <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#04E061] animate-pulse"></span>
          {MONTHS_RU[currentMonth]} {currentYear}
        </span>

        {interactive && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Предыдущий месяц"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Следующий месяц"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 mb-1.5">
        {WEEKDAYS_RU.map((w, idx) => (
          <div key={idx} className={idx >= 5 ? 'text-rose-400/80' : 'text-slate-400'}>
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Leading empty spaces */}
        {Array.from({ length: startingOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-7 sm:h-8" />
        ))}

        {/* Days of month */}
        {days.map(({ day, dateStr, isWeekend }) => {
          const isSelected = dateStr === activeDateToHighlight;
          
          // Check if this date has an existing absence in list
          const existing = existingAbsences.find(a => a.start_date === dateStr);
          
          let cellStyle = 'hover:bg-white/10 text-slate-200';
          if (isWeekend) {
            cellStyle = 'text-slate-500';
          }

          if (isSelected) {
            if (highlightDate) {
              // Highlighted for review (Mentor/Lead or Card)
              if (highlightStatus === 'approved') {
                cellStyle = 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_12px_#04E061] ring-2 ring-emerald-300';
              } else if (highlightStatus === 'rejected') {
                cellStyle = 'bg-rose-500 text-white font-black shadow-[0_0_12px_#ef4444] ring-2 ring-rose-300';
              } else {
                // Pending approval
                cellStyle = 'bg-amber-400 text-slate-950 font-black shadow-[0_0_14px_#f59e0b] ring-2 ring-amber-300 animate-pulse';
              }
            } else {
              // Selected by Intern
              cellStyle = 'bg-[#04E061] text-slate-950 font-black shadow-[0_0_12px_#04E061] ring-2 ring-emerald-300';
            }
          } else if (existing) {
            if (existing.status === 'approved') {
              cellStyle = 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold';
            } else if (existing.status === 'rejected') {
              cellStyle = 'bg-rose-950/60 text-rose-300 border border-rose-500/40 font-bold';
            } else {
              cellStyle = 'bg-amber-950/60 text-amber-300 border border-amber-500/40 font-bold';
            }
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onSelectDate && onSelectDate(dateStr)}
              className={`h-7 sm:h-8 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                interactive ? 'cursor-pointer' : 'cursor-default'
              } ${cellStyle}`}
            >
              <span className="text-xs">{day}</span>
              
              {/* Status indicators */}
              {existing && !isSelected && (
                <span className={`w-1 h-1 rounded-full absolute bottom-1 ${
                  existing.status === 'approved' ? 'bg-[#04E061]' :
                  existing.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-400'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / Status Helper */}
      {highlightDate && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Статус даты:</span>
          {highlightStatus === 'approved' && (
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#04E061]" /> Одобренный день
            </span>
          )}
          {highlightStatus === 'pending_approval' && (
            <span className="text-amber-300 font-bold flex items-center gap-1 animate-pulse">
              <Clock size={12} className="text-amber-400" /> На согласовании
            </span>
          )}
          {highlightStatus === 'rejected' && (
            <span className="text-rose-300 font-bold flex items-center gap-1">
              <Ban size={12} className="text-rose-400" /> Отклонённый день
            </span>
          )}
        </div>
      )}

    </div>
  );
};
