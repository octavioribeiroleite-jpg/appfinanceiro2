import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
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
  categoriaId?: string;
  categoriaNome: string;
  categoriaCor: string;
  lancamentos: Lancamento[];
  totalBruto: number;
  totalLiquido: number;
}

function formatDateLong(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export default function CategoryGroupDialog({
  open, onOpenChange, categoriaId, categoriaNome, categoriaCor, lancamentos, totalBruto, totalLiquido,
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
      <DialogContent
        className="max-w-[358px] p-0 gap-0 overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-2xl shadow-blue-900/10 flex flex-col"
        style={{ maxHeight: 'min(85vh, 640px)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: categoriaCor,
                  boxShadow: `0 0 8px ${categoriaCor}80`,
                }}
              />
              <span className="truncate">{categoriaNome}</span>
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Bruto</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(totalBruto)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Líquido</p>
              <p className="text-lg font-bold text-blue-700 tabular-nums">{formatCurrency(totalLiquido)}</p>
            </div>
          </div>

          {/* Stats & Badges */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-slate-500 font-medium">
              {lancamentos.length} {lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
            </div>
            <div className="flex gap-2">
              {recebidos > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100">
                  {recebidos} RECEBIDO{recebidos > 1 ? 'S' : ''}
                </span>
              )}
              {pendentes > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold border border-amber-100">
                  {pendentes} PENDENTE{pendentes > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {grupos.map(([data, items]) => (
            <section key={data}>
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="whitespace-nowrap">
                  {data === 'sem-data' ? 'Sem data' : formatDateLong(data)}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </h3>

              <div className="space-y-4">
                {items.map(l => {
                  const recebido = l.status === 'recebido';
                  return (
                    <Link
                      key={l.id}
                      to={`/novo?edit=${l.id}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center justify-between gap-3 group -mx-2 px-2 py-1 rounded-lg active:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-800 truncate group-active:text-blue-600">
                          {l.descricao}
                        </span>
                        <span className={`text-[11px] font-medium ${recebido ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {recebido ? 'Recebido' : 'Pendente'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatCurrency(Number(l.valor_bruto))}
                        </p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          líq. {formatCurrency(Number(l.valor_liquido))}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom action */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <Link
            to={`/novo?tipo=receita${categoriaId ? `&categoria_id=${categoriaId}` : ''}`}
            onClick={() => onOpenChange(false)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Novo Lançamento
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
