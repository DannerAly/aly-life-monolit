import type { FinanceCategory, ClassificationRule, TransactionType } from '@/lib/types/database';

export interface ParsedRow {
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;      // positivo = ingreso, negativo = egreso
  rawLine: string;
}

// ── Detect separator ──
function detectSeparator(lines: string[]): string {
  const sample = lines.slice(0, 5).join('\n');
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  for (const ch of Object.keys(counts)) {
    counts[ch] = (sample.match(new RegExp(ch === '\t' ? '\\t' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }
  // Pick the one with highest count
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Parse date ──
const DATE_PATTERNS = [
  { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` }, // DD/MM/YYYY
  { regex: /^(\d{2})-(\d{2})-(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },  // DD-MM-YYYY
  { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },  // YYYY-MM-DD
  { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` }, // YYYY/MM/DD
  { regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, format: (m: RegExpMatchArray) => `20${m[3]}-${m[2]}-${m[1]}` }, // DD/MM/YY
];

function tryParseDate(value: string): string | null {
  const trimmed = value.trim();
  for (const p of DATE_PATTERNS) {
    const m = trimmed.match(p.regex);
    if (m) return p.format(m);
  }
  return null;
}

// ── Parse amount ──
function tryParseAmount(value: string): number | null {
  let cleaned = value.trim();
  // Remove currency symbols
  cleaned = cleaned.replace(/[Bb]s\.?|USD|\$|€|£/g, '').trim();
  if (!cleaned) return null;

  // Detect format: if last separator is comma and has 1-2 digits after → latam format (1.234,56)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot && cleaned.length - lastComma <= 3) {
    // Latam: 1.234,56 → remove dots, replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && cleaned.length - lastDot <= 3) {
    // US/UK: 1,234.56 → remove commas
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // No decimal separator or ambiguous → just clean
    cleaned = cleaned.replace(/,/g, '').replace(/\./g, '');
  }

  // Remove spaces and parens (some formats use () for negative)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  cleaned = cleaned.replace(/\s/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ── Detect columns ──
function isDateColumn(values: string[]): boolean {
  let dateCount = 0;
  for (const v of values.slice(0, 10)) {
    if (tryParseDate(v) !== null) dateCount++;
  }
  return dateCount >= values.length * 0.5;
}

function isAmountColumn(values: string[]): boolean {
  let numCount = 0;
  for (const v of values.slice(0, 10)) {
    if (tryParseAmount(v) !== null) numCount++;
  }
  return numCount >= values.length * 0.5;
}

// ── Main parser ──
export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = detectSeparator(lines);
  const rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));

  // Get column count from the most common row length
  const colCounts = new Map<number, number>();
  for (const r of rows) {
    colCounts.set(r.length, (colCounts.get(r.length) || 0) + 1);
  }
  const expectedCols = [...colCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const filteredRows = rows.filter(r => r.length === expectedCols);

  // Detect if first row is header
  const firstRow = filteredRows[0];
  const dataRows = filteredRows.slice(1);
  if (dataRows.length === 0) return [];

  // Analyze columns by index
  const colValues: string[][] = Array.from({ length: expectedCols }, (_, i) =>
    dataRows.map(r => r[i])
  );

  let dateCol = -1;
  let amountCols: number[] = [];
  const descCols: number[] = [];

  for (let i = 0; i < expectedCols; i++) {
    if (dateCol === -1 && isDateColumn(colValues[i])) {
      dateCol = i;
    } else if (isAmountColumn(colValues[i])) {
      amountCols.push(i);
    } else {
      descCols.push(i);
    }
  }

  if (dateCol === -1 || amountCols.length === 0) return [];

  // If header row had non-numeric values in amount columns, it's a header (skip it)
  const hasHeader = amountCols.some(i => tryParseAmount(firstRow[i]) === null);
  const actualDataRows = hasHeader ? dataRows : filteredRows;

  const results: ParsedRow[] = [];

  for (const row of actualDataRows) {
    const date = tryParseDate(row[dateCol]);
    if (!date) continue;

    // Build description from description columns
    const description = descCols.map(i => row[i]).filter(Boolean).join(' ').trim();

    // Determine amount: single column or debit/credit columns
    let amount = 0;
    if (amountCols.length === 1) {
      const parsed = tryParseAmount(row[amountCols[0]]);
      if (parsed === null) continue;
      amount = parsed;
    } else {
      // Multiple amount columns: usually debit + credit (one is 0 or empty)
      for (const col of amountCols) {
        const parsed = tryParseAmount(row[col]);
        if (parsed !== null && parsed !== 0) {
          // Check if this is a debit column (header contains cargo/débito/debit)
          if (hasHeader) {
            const header = firstRow[col].toLowerCase();
            if (header.includes('cargo') || header.includes('débit') || header.includes('debit') || header.includes('egreso') || header.includes('retiro')) {
              amount = -Math.abs(parsed);
            } else if (header.includes('abono') || header.includes('crédit') || header.includes('credit') || header.includes('ingreso') || header.includes('depósito')) {
              amount = Math.abs(parsed);
            } else {
              amount = parsed;
            }
          } else {
            amount = parsed;
          }
          if (amount !== 0) break;
        }
      }
    }

    if (amount === 0) continue;

    results.push({
      date,
      description: description || 'Sin descripción',
      amount,
      rawLine: row.join(sep),
    });
  }

  return results;
}

// ── Classification ──
export function classifyTransaction(
  description: string,
  amount: number,
  rules: ClassificationRule[],
  categories: FinanceCategory[],
): { category: FinanceCategory | null; rule: ClassificationRule | null } {
  const type: TransactionType = amount >= 0 ? 'income' : 'expense';
  const descLower = description.toLowerCase();

  const sorted = [...rules]
    .filter(r => r.transaction_type === type)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (descLower.includes(rule.keyword.toLowerCase())) {
      const category = categories.find(c => c.id === rule.category_id);
      if (category) return { category, rule };
    }
  }

  return { category: null, rule: null };
}
