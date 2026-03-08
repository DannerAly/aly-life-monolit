export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sin caducidad';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  const due = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const due = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return 'Sin caducidad';
  const days = daysUntil(dateString);
  if (days === null) return 'Sin caducidad';
  if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days <= 7) return `Vence en ${days} días`;
  return formatDate(dateString);
}
