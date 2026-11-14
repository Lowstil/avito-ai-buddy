import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Ban, Calendar as CalendarIcon } from 'lucide-react';
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
    <div
      data-testid="glassy-calendar"
      className={`glass-card glass-specular specular-inset rounded-2xl border border-white/15 relative overflow-hidden w-full max-w-full ${
        size === 'sm' ? 'p-3 text-xs' : 'p-3.5 sm:p-4 text-xs'
      }`}
    >
      {/* Top edge specular laser reflection */}
      <div className="laser-line-green absolute top-0 inset-x-0 opacity-60 pointer-events-none" />

      {/* Calendar Header with Month & Controls */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
        <span className="font-extrabold text-glass-pure text-xs sm:text-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#04E061] glow-green animate-pulse shrink-0"></span>
          <CalendarIcon size={14} className="text-[#04E061] hidden sm:inline shrink-0" />
          <span>{MONTHS_RU[currentMonth]} {currentYear}</span>
        </span>

        {interactive && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Предыдущий месяц"
              title="Предыдущий месяц"
              className="min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] p-1.5 rounded-xl glass-pill text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Следующий месяц"
              title="Следующий месяц"
              className="min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] p-1.5 rounded-xl glass-pill text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider mb-1.5">
        {WEEKDAYS_RU.map((w, idx) => (
          <div
            key={idx}
            className={idx >= 5 ? 'text-[#ff6b6b] font-black' : 'text-glass-secondary'}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
        {/* Leading empty spaces */}
        {Array.from({ length: startingOffset }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-9 sm:h-8" />
        ))}

        {/* Days of month */}
        {days.map(({ day, dateStr, isWeekend }) => {
          const isSelected = dateStr === activeDateToHighlight;

          // Check if this date has an existing absence in list
          const existing = existingAbsences.find(a => a.start_date === dateStr);

          let cellStyle =
            'bg-white/[0.03] hover:bg-white/[0.12] border border-white/[0.07] hover:border-white/25 text-glass-primary specular-inset';
          if (isWeekend) {
            cellStyle =
              'bg-white/[0.015] hover:bg-white/[0.08] border border-white/[0.04] text-glass-muted';
          }

          if (isSelected) {
            if (highlightDate) {
              // Highlighted for review (Mentor/Lead or Card)
              if (highlightStatus === 'approved') {
                cellStyle =
                  'bg-[#04E061] text-slate-950 font-black glow-green-lg border border-emerald-200 ring-2 ring-[#04E061]/60 scale-[1.03] z-10';
              } else if (highlightStatus === 'rejected') {
                cellStyle =
                  'bg-[#FF5252] text-white font-black glow-coral-lg border border-rose-200 ring-2 ring-[#FF5252]/60 scale-[1.03] z-10';
              } else {
                // Pending approval
                cellStyle =
                  'bg-amber-400 text-slate-950 font-black shadow-[0_0_18px_rgba(245,158,11,0.55)] border border-amber-200 ring-2 ring-amber-300/70 animate-pulse scale-[1.03] z-10';
              }
            } else {
              // Selected by Intern
              cellStyle =
                'bg-[#04E061] text-slate-950 font-black glow-green-lg border border-emerald-200 ring-2 ring-[#04E061]/60 scale-[1.03] z-10';
            }
          } else if (existing) {
            if (existing.status === 'approved') {
              cellStyle =
                'bg-emerald-950/70 text-[#04E061] border-neon-green font-extrabold';
            } else if (existing.status === 'rejected') {
              cellStyle =
                'bg-rose-950/70 text-[#ff6b6b] border-neon-coral font-extrabold';
            } else {
              cellStyle =
                'bg-amber-950/70 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-extrabold';
            }
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onSelectDate && onSelectDate(dateStr)}
              aria-label={`Выбрать дату ${dateStr}`}
              className={`calendar-day-btn h-9 sm:h-8 rounded-xl flex flex-col items-center justify-center transition-all relative select-none ${
                interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'
              } ${cellStyle}`}
            >
              <span className="text-xs leading-none">{day}</span>

              {/* Status indicators */}
              {existing && !isSelected && (
                <span
                  className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                    existing.status === 'approved'
                      ? 'bg-[#04E061] shadow-[0_0_6px_#04E061]'
                      : existing.status === 'rejected'
                      ? 'bg-[#FF5252] shadow-[0_0_6px_#FF5252]'
                      : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Legend / Status Helper */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px]">
        {highlightDate ? (
          <>
            <span className="text-glass-muted font-medium">Статус даты:</span>
            {highlightStatus === 'approved' && (
              <span className="text-[#04E061] font-bold flex items-center gap-1">
                <CheckCircle2 size={12} className="text-[#04E061]" /> Одобренный день
              </span>
            )}
            {highlightStatus === 'pending_approval' && (
              <span className="text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                <Clock size={12} className="text-amber-400" /> На согласовании
              </span>
            )}
            {highlightStatus === 'rejected' && (
              <span className="text-[#ff6b6b] font-bold flex items-center gap-1">
                <Ban size={12} className="text-[#FF5252]" /> Отклонённый день
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#04E061] shadow-[0_0_6px_#04E061]"></span>
              <span className="text-glass-secondary font-semibold">Выбрано / Одобрено</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"></span>
              <span className="text-glass-secondary font-semibold">Ожидает</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF5252] shadow-[0_0_6px_#FF5252]"></span>
              <span className="text-glass-secondary font-semibold">Отклонено</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
