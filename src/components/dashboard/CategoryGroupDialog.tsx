import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';

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

export default function CategoryGroupDialog({
  open, onOpenChange, categoriaNome, categoriaCor, lancamentos, totalBruto, totalLiquido,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: categoriaCor }} />
            {categoriaNome}
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {lancamentos.length} lançamento{lancamentos.length > 1 ? 's' : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between text-sm font-semibold px-1 pb-1 border-b">
          <span>Bruto: {formatCurrency(totalBruto)}</span>
          <span className="text-muted-foreground">Líq: {formatCurrency(totalLiquido)}</span>
        </div>

        <div className="space-y-2">
          {lancamentos.map(l => (
            <div
              key={l.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div>
                <p className="text-sm font-medium">{l.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {l.data_prevista ? new Date(l.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                  {' · '}
                  <span className={l.status === 'recebido' ? 'text-emerald-600' : 'text-amber-600'}>
                    {l.status === 'recebido' ? 'Recebido' : 'Pendente'}
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(Number(l.valor_bruto))}</p>
                <p className="text-xs text-muted-foreground">Líq: {formatCurrency(Number(l.valor_liquido))}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
