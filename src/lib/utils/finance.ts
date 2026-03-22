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

// ── Unified period functions ──

export function currentPeriodStr(view: PeriodView): string {
  if (view === 'week') return currentWeekStr();
  if (view === 'year') return currentYearStr();
  return currentMonthStr();
}

export function getPeriodRange(period: string, view: PeriodView): { firstDay: string; lastDay: string } {
  if (view === 'week') return getWeekRange(period);
  if (view === 'year') return getYearRange(period);
  return getMonthRange(period);
}

export function getPeriodLabel(period: string, view: PeriodView): string {
  if (view === 'week') return getWeekLabel(period);
  if (view === 'year') return period;
  return getMonthName(period);
}

export function prevPeriod(period: string, view: PeriodView): string {
  if (view === 'week') return prevWeek(period);
  if (view === 'year') return prevYear(period);
  return prevMonth(period);
}

export function nextPeriod(period: string, view: PeriodView): string {
  if (view === 'week') return nextWeek(period);
  if (view === 'year') return nextYear(period);
  return nextMonth(period);
}

export function getPeriodSummaryLabel(view: PeriodView): string {
  if (view === 'week') return 'de la semana';
  if (view === 'year') return 'del año';
  return 'del mes';
}
