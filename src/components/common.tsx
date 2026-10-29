import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock, CircleDot, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { EntryStatus } from "@/lib/money";

const STATUS: Record<EntryStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  pendente: { label: "Pendente", cls: "bg-info-soft text-primary", Icon: Clock },
  parcial: { label: "Parcial", cls: "bg-warning-soft text-warning-foreground", Icon: CircleDot },
  quitado: { label: "Quitado", cls: "bg-success-soft text-accent-foreground", Icon: CheckCircle2 },
  atrasado: { label: "Atrasado", cls: "bg-danger-soft text-danger", Icon: AlertCircle },
};

export function StatusBadge({ status }: { status: EntryStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls)}>
      <s.Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function KindBadge({ kind }: { kind: "pagar" | "receber" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        kind === "pagar" ? "bg-danger-soft text-danger" : "bg-success-soft text-accent-foreground",
      )}
    >
      {kind === "pagar" ? "A pagar" : "A receber"}
    </span>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-6 text-center text-sm text-danger">
      {message ?? "Não foi possível carregar os dados. Verifique sua conexão."}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-semibold underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  destructive,
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    const m = String((e as { message: string }).message);
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Verifique sua internet e tente novamente.";
    if (/violates foreign key/i.test(m)) return "Este registro está em uso e não pode ser removido.";
    if (/duplicate key/i.test(m)) return "Já existe um registro com esses dados.";
    return m;
  }
  return "Algo deu errado. Tente novamente.";
}
