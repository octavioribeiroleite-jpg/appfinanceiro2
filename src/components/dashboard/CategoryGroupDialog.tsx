import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, Clock } from 'lucide-react';
import { useMemo } from 'react';

interface Lancamento {
  id: string;
  descricao: string;
  valor_bruto: number;
  valor_liquido: number;
  status: string;
  data_prevista: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaNome: string;
  categoriaCor: string;
  lancamentos: Lancamento[];
  totalBruto: number;
  totalLiquido: number;
}

function formatDateBR(d: string | null) {
  if (!d) return 'Sem data';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function CategoryGroupDialog({
  open, onOpenChange, categoriaNome, categoriaCor, lancamentos, totalBruto, totalLiquido,
}: Props) {
  const grupos = useMemo(() => {
    const map = new Map<string, Lancamento[]>();
    const sorted = [...lancamentos].sort((a, b) => (b.data_prevista || '').localeCompare(a.data_prevista || ''));
    for (const l of sorted) {
      const key = l.data_prevista || 'sem-data';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return Array.from(map.entries());
  }, [lancamentos]);

  const recebidos = lancamentos.filter(l => l.status === 'recebido').length;
  const pendentes = lancamentos.length - recebidos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b bg-card space-y-3">
          <DialogTitle className="text-base flex items-center gap-2 pr-6">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: categoriaCor }} />
            <span className="truncate">{categoriaNome}</span>
          </DialogTitle>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Bruto</p>
              <p className="text-base font-bold tabular-nums">{formatCurrency(totalBruto)}</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-primary/70 font-medium">Líquido</p>
              <p className="text-base font-bold text-primary tabular-nums">{formatCurrency(totalLiquido)}</p>
            </div>
          </div>

          {/* Counters */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {lancamentos.length} {lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
            {recebidos > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="h-3 w-3" /> {recebidos}
              </span>
            )}
            {pendentes > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" /> {pendentes}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Grouped list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-muted/20">
          {grupos.map(([data, items]) => {
            const subtotal = items.reduce((s, l) => s + Number(l.valor_bruto), 0);
            return (
              <div key={data} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {formatDateBR(data === 'sem-data' ? null : data)}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="rounded-xl border bg-card overflow-hidden divide-y">
                  {items.map(l => {
                    const recebido = l.status === 'recebido';
                    return (
                      <Link
                        key={l.id}
                        to={`/novo?edit=${l.id}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-2 px-3 py-2.5 active:bg-accent hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${recebido ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{l.descricao}</p>
                          <p className={`text-[11px] ${recebido ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {recebido ? 'Recebido' : 'Pendente'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(Number(l.valor_bruto))}</p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            Líq {formatCurrency(Number(l.valor_liquido))}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
