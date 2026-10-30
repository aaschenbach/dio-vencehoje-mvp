import { Repeat } from "lucide-react";
import type { Entry, Category } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { KindBadge, StatusBadge } from "@/components/common";

export function EntryList({ entries, categories = [], onOpen }: { entries: Entry[]; categories?: Category[]; onOpen: (id: string) => void }) {
  const cat = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoria</th><th className="px-4 py-3 text-right">Valor</th><th className="px-4 py-3 text-right">Saldo</th><th className="px-4 py-3">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map((e) => (
              <tr key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpen(e.id)}>
                <td className="px-4 py-3 tabular">{formatDate(e.due_date)}</td>
                <td className="px-4 py-3 font-semibold">
                  <button className="flex items-center gap-1 text-left hover:underline" onClick={(ev) => { ev.stopPropagation(); onOpen(e.id); }}>
                    {e.description}{e.rule_id && <Repeat className="h-3.5 w-3.5 text-muted-foreground" aria-label="Recorrente" />}
                  </button>
                </td>
                <td className="px-4 py-3"><KindBadge kind={e.kind} /></td>
                <td className="px-4 py-3 text-muted-foreground">{cat(e.category_id)}</td>
                <td className="px-4 py-3 text-right tabular">{formatBRL(e.amount)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular">{formatBRL(e.remaining)}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 md:hidden">
        {entries.map((e) => (
          <li key={e.id}>
            <button onClick={() => onOpen(e.id)} className="w-full rounded-2xl border bg-card p-4 text-left shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{e.description}</p>
                <p className="font-bold tabular">{formatBRL(e.remaining)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular">{formatDate(e.due_date)}</span><KindBadge kind={e.kind} /><StatusBadge status={e.status} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
