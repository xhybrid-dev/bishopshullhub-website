import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// UK date display (DD-MM-YYYY). Accepts a YYYY-MM-DD string, a full ISO string, or a Date.
export function formatUKDate(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const d = typeof input === 'string' ? parseISO(input) : input;
    if (isNaN(d.getTime())) return typeof input === 'string' ? input : '';
    return format(d, 'dd-MM-yyyy');
  } catch {
    return typeof input === 'string' ? input : '';
  }
}

// UK date+time display (DD-MM-YYYY HH:mm). Expects a full ISO timestamp.
export function formatUKDateTime(input: string | Date | null | undefined): string {
  if (!input) return '';
  try {
    const d = typeof input === 'string' ? parseISO(input) : input;
    if (isNaN(d.getTime())) return typeof input === 'string' ? input : '';
    return format(d, 'dd-MM-yyyy HH:mm');
  } catch {
    return typeof input === 'string' ? input : '';
  }
}
