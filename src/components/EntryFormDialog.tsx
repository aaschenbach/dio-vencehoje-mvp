import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getMyWorkspaceId, useCategories, useContacts, type Entry } from "@/lib/data";
import { todaySP } from "@/lib/dates";
import { parseBRLInput, formatBRL } from "@/lib/money";
import { FREQUENCY_LABEL } from "@/lib/recurrence";
import { errorMessage } from "@/components/common";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entry?: Entry | null;
  defaultKind?: "pagar" | "receber";
  defaultDate?: string;
};

const NONE = "__none__";

export function EntryFormDialog({ open, onOpenChange, entry, defaultKind = "pagar", defaultDate }: Props) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: contacts = [] } = useContacts();
  const editing = !!entry;
  const recurring = !!entry?.rule_id;

  const [kind, setKind] = useState<"pagar" | "receber">(defaultKind);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(todaySP());
  const [categoryId, setCategoryId] = useState("");
  const [contactId, setContactId] = useState(NONE);
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState<"nenhuma" | "semanal" | "mensal" | "anual">("nenhuma");
  const [endDate, setEndDate] = useState("");
  const [scope, setScope] = useState<"one" | "future">("one");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setScope("one");
    if (entry) {
      setKind(entry.kind);
      setDescription(entry.description);
      setAmount(String(entry.amount).replace(".", ","));
      setDue(entry.due_date);
      setCategoryId(entry.category_id);
      setContactId(entry.contact_id ?? NONE);
      setNotes(entry.notes ?? "");
      setFrequency("nenhuma");
    } else {
      setKind(defaultKind);
      setDescription("");
      setAmount("");
      setDue(defaultDate ?? todaySP());
      setCategoryId("");
      setContactId(NONE);
      setNotes("");
      setFrequency("nenhuma");
      setEndDate("");
    }
  }, [open, entry, defaultKind, defaultDate]);

  const kindCategories = categories.filter((c) => c.kind === kind && (c.active || c.id === categoryId));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    const amt = parseBRLInput(amount);
    if (!description.trim()) errs["description"] = "Informe uma descrição.";
    if (!amt || Number(amt) <= 0) errs["amount"] = "Informe um valor maior que zero, ex.: 150,00.";
    else if (entry && Number(amt) < entry.paid_total)
      errs["amount"] = `O valor não pode ser menor que o já baixado (${formatBRL(entry.paid_total)}).`;
    if (!due) errs["due"] = "Informe a data de vencimento.";
    if (!categoryId) errs["category"] = "Escolha uma categoria.";
    if (frequency !== "nenhuma" && endDate && endDate < due) errs["end"] = "A data final deve ser depois da inicial.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    const contact = contactId === NONE ? null : contactId;
    try {
      if (!editing) {
        if (frequency === "nenhuma") {
          const ws = await getMyWorkspaceId();
          const { error } = await supabase.from("financial_entries").insert({
            workspace_id: ws, kind, description: description.trim(), amount: Number(amt), due_date: due,
            category_id: categoryId, contact_id: contact, notes: notes.trim() || null,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc("create_recurring_entry", {
            _kind: kind, _description: description.trim(), _amount: Number(amt), _start: due, _frequency: frequency,
            _end: (endDate || null) as string, _category_id: categoryId, _contact_id: contact as string, _notes: (notes.trim() || null) as string,
          });
          if (error) throw error;
        }
        toast.success("Lançamento criado.");
      } else if (recurring && scope === "future") {
        const { error } = await supabase.rpc("update_series_from", {
          _entry_id: entry!.id, _description: description.trim(), _amount: Number(amt), _category_id: categoryId,
          _contact_id: contact as string, _notes: (notes.trim() || null) as string,
        });
        if (error) throw error;
        toast.success("Esta e as próximas ocorrências foram atualizadas. Ocorrências com baixas ou editadas individualmente foram preservadas.");
      } else {
        const { error } = await supabase
          .from("financial_entries")
          .update({
            description: description.trim(), amount: Number(amt), due_date: due, category_id: categoryId,
            contact_id: contact, notes: notes.trim() || null, ...(recurring ? { detached: true } : {}),
          })
          .eq("id", entry!.id);
        if (error) throw error;
        toast.success("Lançamento atualizado.");
      }
      await qc.invalidateQueries();
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>Campos com descrição, valor, vencimento e categoria são obrigatórios.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <RadioGroup
            value={kind}
            onValueChange={(v) => { setKind(v as "pagar" | "receber"); setCategoryId(""); }}
            className="grid grid-cols-2 gap-2"
            aria-label="Tipo"
            disabled={editing}
          >
            {(["pagar", "receber"] as const).map((k) => (
              <Label key={k} htmlFor={`k-${k}`} className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary">
                <RadioGroupItem value={k} id={`k-${k}`} /> {k === "pagar" ? "A pagar" : "A receber"}
              </Label>
            ))}
          </RadioGroup>

          {recurring && (
            <fieldset className="rounded-xl border bg-muted/50 p-3">
              <legend className="px-1 text-xs font-bold text-muted-foreground">Esta conta se repete. Aplicar alteração em:</legend>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as "one" | "future")} className="mt-1 space-y-1">
                <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="one" /> Somente esta ocorrência</Label>
                <Label className="flex items-center gap-2 font-normal"><RadioGroupItem value="future" /> Esta e as próximas</Label>
              </RadioGroup>
              {scope === "future" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  As datas da série são mantidas. Ocorrências já pagas, parciais ou editadas individualmente não serão alteradas.
                </p>
              )}
            </fieldset>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição</Label>
            <Input id="desc" maxLength={140} value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors["description"]} />
            {errors["description"] && <p className="text-xs text-danger">{errors["description"]}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amt">Valor (R$)</Label>
              <Input id="amt" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!errors["amount"]} />
              {errors["amount"] && <p className="text-xs text-danger">{errors["amount"]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">{frequency !== "nenhuma" ? "Primeiro vencimento" : "Vencimento"}</Label>
              <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={recurring && scope === "future"} aria-invalid={!!errors["due"]} />
              {errors["due"] && <p className="text-xs text-danger">{errors["due"]}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="cat" aria-invalid={!!errors["category"]}><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {kindCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors["category"] && <p className="text-xs text-danger">{errors["category"]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct">Pessoa ou empresa (opcional)</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger id="ct"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="freq">Repetir</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                  <SelectTrigger id="freq"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["nenhuma", "semanal", "mensal", "anual"] as const).map((f) => (
                      <SelectItem key={f} value={f}>{FREQUENCY_LABEL[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {frequency !== "nenhuma" && (
                <div className="space-y-1.5">
                  <Label htmlFor="end">Data final (opcional)</Label>
                  <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-invalid={!!errors["end"]} />
                  {errors["end"] && <p className="text-xs text-danger">{errors["end"]}</p>}
                </div>
              )}
            </div>
          )}
          {frequency === "mensal" && Number(due.slice(8, 10)) > 28 && (
            <p className="text-xs text-muted-foreground">Em meses mais curtos, o vencimento cai no último dia do mês.</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
