import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { History, Loader2, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { getMyWorkspaceId, useCategories, useContacts, useEntry, type Settlement } from "@/lib/data";
import { formatDate, todaySP } from "@/lib/dates";
import { centsToDecimal, formatBRL, parseBRLInput, toCents } from "@/lib/money";
import { FREQUENCY_LABEL, type Frequency } from "@/lib/recurrence";
import { ConfirmDialog, ErrorState, KindBadge, Loading, StatusBadge, errorMessage } from "@/components/common";
import { EntryFormDialog } from "@/components/EntryFormDialog";

export function EntryDetailSheet({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useEntry(entryId);
  const { data: categories = [] } = useCategories();
  const { data: contacts = [] } = useContacts();
  const [editOpen, setEditOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState<{ s?: Settlement } | null>(null);
  const [delSettlement, setDelSettlement] = useState<Settlement | null>(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delScope, setDelScope] = useState<"one" | "future">("one");
  const [busy, setBusy] = useState(false);

  const entry = data?.entry;

  async function removeSettlement() {
    if (!delSettlement) return;
    setBusy(true);
    const { error } = await supabase.from("settlements").delete().eq("id", delSettlement.id);
    setBusy(false);
    if (error) return void toast.error(errorMessage(error));
    toast.success("Baixa excluída. O registro fica no histórico de alterações.");
    setDelSettlement(null);
    qc.invalidateQueries();
  }

  async function removeEntry() {
    if (!entry) return;
    setBusy(true);
    try {
      if (entry.rule_id && delScope === "future") {
        const { data: preserved, error } = await supabase.rpc("delete_series_from", { _entry_id: entry.id });
        if (error) throw error;
        toast.success(
          preserved ? `Série encerrada. ${preserved} ocorrência(s) com baixas ou editadas foram mantidas.` : "Esta e as próximas ocorrências foram excluídas.",
        );
      } else {
        const { error } = await supabase.rpc("delete_occurrence", { _entry_id: entry.id });
        if (error) throw error;
        toast.success("Lançamento excluído.");
      }
      setDelOpen(false);
      onClose();
      qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open={!!entryId} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {isLoading && <Loading />}
          {error && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !error && !entry && <p className="py-12 text-center text-sm text-muted-foreground">Lançamento não encontrado.</p>}
          {entry && (
            <>
              <SheetHeader>
                <div className="flex flex-wrap gap-2"><KindBadge kind={entry.kind} /><StatusBadge status={entry.status} /></div>
                <SheetTitle className="text-xl">{entry.description}</SheetTitle>
                <SheetDescription>Vencimento {formatDate(entry.due_date)}</SheetDescription>
              </SheetHeader>

              <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-muted p-4 text-center">
                <div><dt className="text-xs text-muted-foreground">Valor</dt><dd className="font-bold tabular">{formatBRL(entry.amount)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">{entry.kind === "pagar" ? "Pago" : "Recebido"}</dt><dd className="font-bold tabular">{formatBRL(entry.paid_total)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Saldo</dt><dd className="font-bold tabular">{formatBRL(entry.remaining)}</dd></div>
              </dl>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Categoria</dt><dd>{categories.find((c) => c.id === entry.category_id)?.name ?? "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Contato</dt><dd>{contacts.find((c) => c.id === entry.contact_id)?.name ?? "—"}</dd></div>
                {data?.rule && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Repetição</dt>
                    <dd className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5" />{FREQUENCY_LABEL[data.rule.frequency as Frequency]}{entry.detached && " · editada individualmente"}</dd>
                  </div>
                )}
                {entry.notes && <div><dt className="text-muted-foreground">Observações</dt><dd className="mt-1 whitespace-pre-wrap">{entry.notes}</dd></div>}
                <div className="flex justify-between text-xs text-muted-foreground"><dt>Criado / atualizado</dt><dd>{formatDate(entry.created_at)} · {formatDate(entry.updated_at)}</dd></div>
                <div className="flex justify-between text-xs text-muted-foreground"><dt>ID</dt><dd className="font-mono">{entry.id.slice(0, 8)}</dd></div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2">
                {entry.remaining > 0 && (
                  <Button onClick={() => setSettleOpen({})}><Plus className="mr-1 h-4 w-4" />Registrar {entry.kind === "pagar" ? "pagamento" : "recebimento"}</Button>
                )}
                <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 h-4 w-4" />Editar</Button>
                <Button variant="outline" className="text-danger" onClick={() => { setDelScope("one"); setDelOpen(true); }}><Trash2 className="mr-1 h-4 w-4" />Excluir</Button>
              </div>

              <section className="mt-8">
                <h3 className="text-sm font-bold">Histórico de baixas</h3>
                {data!.settlements.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhuma baixa registrada.</p>
                ) : (
                  <ul className="mt-2 divide-y rounded-xl border">
                    {data!.settlements.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                        <div>
                          <p className="font-semibold tabular">{formatBRL(s.amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(s.paid_on)}{s.notes ? ` · ${s.notes}` : ""}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" aria-label="Corrigir baixa" onClick={() => setSettleOpen({ s })}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Excluir baixa" onClick={() => setDelSettlement(s)}><Trash2 className="h-4 w-4 text-danger" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {data!.audit.length > 0 && (
                  <details className="mt-3 text-xs text-muted-foreground">
                    <summary className="flex cursor-pointer items-center gap-1"><History className="h-3.5 w-3.5" />Alterações em baixas ({data!.audit.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {data!.audit.map((a) => (
                        <li key={a.id}>
                          {formatDate(a.created_at)}: {a.action === "delete" ? "excluída" : "corrigida"} baixa de {formatBRL(a.old_amount)} ({formatDate(a.old_paid_on)})
                          {a.action === "update" && ` → ${formatBRL(a.new_amount)} (${formatDate(a.new_paid_on)})`}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            </>
          )}
        </SheetContent>
      </Sheet>

      {entry && (
        <>
          <EntryFormDialog open={editOpen} onOpenChange={setEditOpen} entry={entry} />
          <SettlementDialog
            open={!!settleOpen}
            onOpenChange={(o) => !o && setSettleOpen(null)}
            entryId={entry.id}
            maxCents={toCents(entry.remaining) + (settleOpen?.s ? toCents(settleOpen.s.amount) : 0)}
            settlement={settleOpen?.s}
            kind={entry.kind}
          />
        </>
      )}

      <ConfirmDialog
        open={!!delSettlement}
        onOpenChange={(o) => !o && setDelSettlement(null)}
        title="Excluir baixa?"
        description={`A baixa de ${formatBRL(delSettlement?.amount)} será removida e o saldo voltará a ficar pendente. A exclusão fica registrada no histórico.`}
        confirmLabel="Excluir baixa"
        destructive
        busy={busy}
        onConfirm={removeSettlement}
      />

      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento?</DialogTitle>
            <DialogDescription>
              {entry?.has_settlements
                ? "Este lançamento possui baixas. Exclua as baixas antes para não perder o histórico sem perceber."
                : "Esta ação não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          {entry?.rule_id && (
            <RadioGroup value={delScope} onValueChange={(v) => setDelScope(v as "one" | "future")} className="space-y-1">
              <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="one" />Somente esta ocorrência</Label>
              <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="future" />Esta e as próximas (mantém as que têm baixas)</Label>
            </RadioGroup>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)} disabled={busy}>Cancelar</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy || (!!entry?.has_settlements && delScope === "one")}
              onClick={removeEntry}
            >
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SettlementDialog({
  open, onOpenChange, entryId, maxCents, settlement, kind,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; entryId: string; maxCents: number; settlement?: Settlement | undefined; kind: "pagar" | "receber";
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todaySP());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setAmount(settlement ? String(settlement.amount).replace(".", ",") : centsToDecimal(maxCents).replace(".", ","));
      setDate(settlement?.paid_on ?? todaySP());
      setNotes(settlement?.notes ?? "");
      setError(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const v = parseBRLInput(amount);
    if (!v || toCents(v) <= 0) return setError("Informe um valor maior que zero.");
    if (toCents(v) > maxCents) return setError(`O valor máximo é ${formatBRL(centsToDecimal(maxCents))}.`);
    if (!date) return setError("Informe a data.");
    setBusy(true);
    try {
      const payload = { amount: Number(v), paid_on: date, notes: notes.trim() || null };
      if (settlement) {
        const { error } = await supabase.from("settlements").update(payload).eq("id", settlement.id);
        if (error) throw error;
      } else {
        const workspaceId = await getMyWorkspaceId();
        const { error } = await supabase.from("settlements").insert({
          ...payload, entry_id: entryId, workspace_id: workspaceId,
        });
        if (error) throw error;
      }
      toast.success(settlement ? "Baixa corrigida." : "Baixa registrada.");
      await qc.invalidateQueries();
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{settlement ? "Corrigir baixa" : kind === "pagar" ? "Registrar pagamento" : "Registrar recebimento"}</DialogTitle>
          <DialogDescription>Saldo disponível para esta baixa: {formatBRL(centsToDecimal(maxCents))}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-amt">Valor (R$)</Label>
            <Input id="s-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-date">Data efetiva</Label>
            <Input id="s-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-notes">Observações (opcional)</Label>
            <Textarea id="s-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
