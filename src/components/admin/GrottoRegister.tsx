"use client";

import { useMemo, useState } from 'react';
import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { Download, Loader2, Printer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { GROTTO_CAPACITY } from '@/lib/santa-grotto';
import { buildRegisterRows, registerToCsv, registerToPrintHtml, type RegisterBooking } from '@/lib/grotto-register';

const TITLE = 'Santa Grotto 2026 – Saturday 12 December, Bishops Hull Hub';

export function GrottoRegister({ enabled }: { enabled: boolean }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [filter, setFilter] = useState('');

  const bookingsQuery = useMemoFirebase(() => {
    if (!enabled) return null;
    return query(collection(firestore, 'grotto_bookings'), orderBy('createdAt', 'desc'));
  }, [firestore, enabled]);
  const { data, isLoading, error } = useCollection<RegisterBooking>(bookingsQuery);

  const bookings = data ?? [];
  const rows = useMemo(() => buildRegisterRows(bookings), [bookings]);
  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter((r) => [r.name, r.parentName, r.parentEmail, r.parentPhone, r.ref].some((v) => v.toLowerCase().includes(f)));
  }, [rows, filter]);

  const arrived = rows.filter((r) => r.arrived).length;
  const remaining = Math.max(0, GROTTO_CAPACITY - rows.length);

  const toggleArrived = async (bookingId: string, index: number, value: boolean) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b?.children) return;
    const children = b.children.map((c, i) => (i === index ? { ...c, arrived: value } : c));
    try {
      await updateDoc(doc(firestore, 'grotto_bookings', bookingId), { children });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Could not update', description: e?.message });
    }
  };

  const exportCsv = () => {
    const blob = new Blob([registerToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'santa-grotto-2026-register.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printRegister = () => {
    const w = window.open('', '_blank');
    if (!w) { toast({ variant: 'destructive', title: 'Pop-up blocked', description: 'Allow pop-ups to print the register.' }); return; }
    w.document.write(registerToPrintHtml(rows, TITLE));
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-headline font-bold text-primary">Santa Grotto 2026</h2>
          <p className="text-sm text-muted-foreground">Saturday 12th December, 10am–12pm. Paid bookings appear here automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={printRegister} disabled={rows.length === 0}><Printer className="h-4 w-4" /> Print</Button>
          <Button className="gap-2" onClick={exportCsv} disabled={rows.length === 0}><Download className="h-4 w-4" /> Export register (CSV)</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Children booked', value: `${rows.length} / ${GROTTO_CAPACITY}` },
          { label: 'Places left', value: remaining },
          { label: 'Bookings', value: bookings.length },
          { label: 'Arrived', value: `${arrived} / ${rows.length}` },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-primary">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary"><Users className="h-4 w-4" /> Register</CardTitle>
            <CardDescription>Youngest first. Tick each child as they arrive.</CardDescription>
          </div>
          <Input placeholder="Search child, parent, phone…" value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:max-w-xs" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : error ? (
            <p className="text-sm text-destructive py-6">Couldn’t load the register: {error.message}</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">{rows.length === 0 ? 'No paid bookings yet.' : 'No matches.'}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                  <th className="py-2 pr-3">Arrived</th><th className="pr-3">Age</th><th className="pr-3">Child</th><th className="pr-3">Gender</th>
                  <th className="pr-3">Parent / guardian</th><th className="pr-3">Phone</th><th className="pr-3">Email</th><th>Ref</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={`${r.bookingId}-${r.index}`} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <Checkbox checked={r.arrived} onCheckedChange={(v) => toggleArrived(r.bookingId, r.index, v === true)} aria-label={`Mark ${r.name} arrived`} />
                    </td>
                    <td className="pr-3 font-semibold">{r.age ?? '–'}</td>
                    <td className="pr-3">{r.name}</td>
                    <td className="pr-3">{r.gender}</td>
                    <td className="pr-3">{r.parentName}</td>
                    <td className="pr-3 whitespace-nowrap">{r.parentPhone}</td>
                    <td className="pr-3">{r.parentEmail}</td>
                    <td><Badge variant="secondary" className="font-mono">{r.ref}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
