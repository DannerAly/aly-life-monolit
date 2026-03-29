import type { PeriodView } from '@/lib/types/database';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MONTH_ABBR = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function formatCurrency(amount: number, currency = 'BOB'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function getMonthLabel(monthStr: string): string {
  const month = parseInt(monthStr.split('-')[1], 10);
  return MONTH_ABBR[month - 1];
}

export function getMonthRange(monthStr: string): { firstDay: string; lastDay: string } {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(year, month, 0);
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;
  return { firstDay, lastDay };
}

export function prevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

export function nextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Week utilities (ISO weeks) ──

function getISOWeek(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getISOWeekYear(d: Date): number {
  const date = new Date(d.getTime());
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  return date.getFullYear();
}

function weekToDate(weekStr: string): Date {
  // weekStr: "2026-W12"
  const [yearStr, wStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1, Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

export function currentWeekStr(): string {
  const now = new Date();
  return `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
}

export function getWeekRange(weekStr: string): { firstDay: string; lastDay: string } {
  const monday = weekToDate(weekStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { firstDay: fmt(monday), lastDay: fmt(sunday) };
}

export function getWeekLabel(weekStr: string): string {
  const [, wStr] = weekStr.split('-W');
  const monday = weekToDate(weekStr);
  const monthName = MONTH_NAMES[monday.getMonth()];
  return `Sem ${parseInt(wStr, 10)}, ${monthName} ${monday.getFullYear()}`;
}

export function getWeekShortLabel(weekStr: string): string {
  const [, wStr] = weekStr.split('-W');
  return `S${parseInt(wStr, 10)}`;
}

export function prevWeek(weekStr: string): string {
  const monday = weekToDate(weekStr);
  monday.setDate(monday.getDate() - 7);
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, '0')}`;
}

export function nextWeek(weekStr: string): string {
  const monday = weekToDate(weekStr);
  monday.setDate(monday.getDate() + 7);
  return `${getISOWeekYear(monday)}-W${String(getISOWeek(monday)).padStart(2, '0')}`;
}

// ── Year utilities ──

export function currentYearStr(): string {
  return `${new Date().getFullYear()}`;
}

export function getYearRange(yearStr: string): { firstDay: string; lastDay: string } {
  return { firstDay: `${yearStr}-01-01`, lastDay: `${yearStr}-12-31` };
}

export function prevYear(yearStr: string): string {
  return `${parseInt(yearStr, 10) - 1}`;
}

export function nextYear(yearStr: string): string {
  return `${parseInt(yearStr, 10) + 1}`;
}

// ── Cycle utilities ──

export function getCycleMonthRange(monthStr: string, cycleDay: number): { firstDay: string; lastDay: string } {
  if (cycleDay === 1) return getMonthRange(monthStr);

  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = `${year}-${String(month).padStart(2, '0')}-${String(cycleDay).padStart(2, '0')}`;

  // End day is cycleDay-1 of the next month
  let endYear = year;
  let endMonth = month + 1;
  if (endMonth > 12) { endMonth = 1; endYear++; }
  const lastDay = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(cycleDay - 1).padStart(2, '0')}`;

  return { firstDay, lastDay };
}

export function currentCycleMonthStr(cycleDay: number): string {
  if (cycleDay === 1) return currentMonthStr();

  const now = new Date();
  const day = now.getDate();
  // If today is before the cycle day, we're still in the previous cycle
  if (day < cycleDay) {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function dateToCyclePeriod(dateStr: string, cycleDay: number): string {
  if (cycleDay === 1) return dateStr.slice(0, 7);

  const [year, month, day] = dateStr.split('-').map(Number);
  if (day < cycleDay) {
    // Belongs to previous month's cycle
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ── Unified period functions ──

export function currentPeriodStr(view: PeriodView, cycleDay = 1): string {
  if (view === 'week') return currentWeekStr();
  if (view === 'year') return currentYearStr();
  return currentCycleMonthStr(cycleDay);
}

export function getPeriodRange(period: string, view: PeriodView, cycleDay = 1): { firstDay: string; lastDay: string } {
  if (view === 'week') return getWeekRange(period);
  if (view === 'year') return getYearRange(period);
  return getCycleMonthRange(period, cycleDay);
}

export function getPeriodLabel(period: string, view: PeriodView): string {
  if (view === 'week') return getWeekLabel(period);
  if (view === 'year') return period;
  if (view === 'custom') return 'Rango personalizado';
  return getMonthName(period);
}

export function prevPeriod(period: string, view: PeriodView): string {
  if (view === 'week') return prevWeek(period);
  if (view === 'year') return prevYear(period);
  if (view === 'custom') return period;
  return prevMonth(period);
}

export function nextPeriod(period: string, view: PeriodView): string {
  if (view === 'week') return nextWeek(period);
  if (view === 'year') return nextYear(period);
  if (view === 'custom') return period;
  return nextMonth(period);
}

export function getPeriodSummaryLabel(view: PeriodView): string {
  if (view === 'week') return 'de la semana';
  if (view === 'year') return 'del año';
  if (view === 'custom') return 'del rango';
  return 'del mes';
}

// ── Custom range utilities ──

export function formatCustomRangeLabel(from: string, to: string): string {
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return `${day} ${MONTH_ABBR[m - 1]} ${y}`;
  };
  return `${fmtDate(from)} — ${fmtDate(to)}`;
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
