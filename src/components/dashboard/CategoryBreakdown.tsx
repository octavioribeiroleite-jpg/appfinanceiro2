import { useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Lancamento {
  tipo_lancamento: string;
  categoria_id: string;
  valor_bruto: number;
  valor_liquido: number;
  categorias: { nome: string; cor: string | null } | null;
}

interface Props {
  lancamentos: Lancamento[];
}

export default function CategoryBreakdown({ lancamentos }: Props) {
  const breakdown = useMemo(() => {
    const cats: Record<string, { nome: string; bruto: number; liquido: number; qtd: number; cor: string }> = {};
    lancamentos
      .filter(l => l.tipo_lancamento === 'receita')
      .forEach(l => {
        const cat = l.categorias;
        if (!cat) return;
        if (!cats[l.categoria_id]) {
          cats[l.categoria_id] = { nome: cat.nome, bruto: 0, liquido: 0, qtd: 0, cor: cat.cor || '#8884d8' };
        }
        cats[l.categoria_id].bruto += Number(l.valor_bruto);
        cats[l.categoria_id].liquido += Number(l.valor_liquido);
        cats[l.categoria_id].qtd += 1;
      });
    return Object.values(cats).sort((a, b) => b.bruto - a.bruto);
  }, [lancamentos]);

  if (breakdown.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ganhos por Fonte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.map(cat => (
          <div
            key={cat.nome}
            className="flex items-center gap-3 p-2.5 rounded-lg border"
          >
            <div
              className="h-8 w-8 rounded-md shrink-0"
              style={{ backgroundColor: cat.cor }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{cat.nome}</p>
              <p className="text-xs text-muted-foreground">{cat.qtd} lançamento{cat.qtd > 1 ? 's' : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{formatCurrency(cat.bruto)}</p>
              <p className="text-xs text-muted-foreground">Líq: {formatCurrency(cat.liquido)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
