// Pure helpers behind the admin "Xmas 2026" register: flattening bookings into
// one row per child, ordering by age, and building the CSV / printable copy.
export interface RegisterBooking {
  id: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  children?: Array<{ name: string; age: number | null; gender: string; arrived?: boolean }>;
}

export interface RegisterRow {
  bookingId: string;
  index: number;
  name: string;
  age: number | null;
  gender: string;
  arrived: boolean;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  ref: string;
}

/** One row per child, youngest first (unknown ages last), then by name. */
export function buildRegisterRows(bookings: RegisterBooking[]): RegisterRow[] {
  const rows: RegisterRow[] = bookings.flatMap((b) =>
    (b.children ?? []).map((c, index) => ({
      bookingId: b.id,
      index,
      name: c.name,
      age: c.age ?? null,
      gender: c.gender || '',
      arrived: !!c.arrived,
      parentName: b.parentName ?? '',
      parentPhone: b.parentPhone ?? '',
      parentEmail: b.parentEmail ?? '',
      ref: b.id.slice(-8).toUpperCase(),
    })),
  );
  return rows.sort(
    (a, b) =>
      (a.age ?? 999) - (b.age ?? 999) || a.name.localeCompare(b.name, 'en-GB', { sensitivity: 'base' }),
  );
}

const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  // Stop spreadsheet formula injection from a name like "=HYPERLINK(...)".
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const REGISTER_HEADERS = ['Age', 'Child name', 'Gender', 'Parent / guardian', 'Phone', 'Email', 'Booking ref', 'Arrived'];

export function registerToCsv(rows: RegisterRow[]): string {
  const lines = [REGISTER_HEADERS, ...rows.map((r) => [
    r.age ?? '', r.name, r.gender, r.parentName, r.parentPhone, r.parentEmail, r.ref, r.arrived ? 'Yes' : '',
  ])];
  // BOM so Excel opens it as UTF-8.
  return '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n');
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Self-contained HTML for printing a paper register with a sign-in tick box. */
export function registerToPrintHtml(rows: RegisterRow[], title: string): string {
  const body = rows.map((r) => `<tr><td>${esc(r.age ?? '')}</td><td>${esc(r.name)}</td><td>${esc(r.gender)}</td><td>${esc(r.parentName)}</td><td>${esc(r.parentPhone)}</td><td>${esc(r.ref)}</td><td class="box"></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 14px;color:#555;font-size:12px}
table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}th{background:#eee}
td.box{width:60px}tr{page-break-inside:avoid}</style></head><body>
<h1>${esc(title)}</h1><p>${rows.length} children, youngest first</p>
<table><thead><tr><th>Age</th><th>Child</th><th>Gender</th><th>Parent / guardian</th><th>Phone</th><th>Ref</th><th>Arrived</th></tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
}
