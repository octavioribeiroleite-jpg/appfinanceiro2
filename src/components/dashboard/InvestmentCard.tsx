import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';

interface Props {
  liquidoMes: number;
  percentual?: number;
}

export default function InvestmentCard({ liquidoMes, percentual = 10 }: Props) {
  const investir = liquidoMes * (percentual / 100);

  return (
    <Card className="border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-semibold">Investir ({percentual}% do líquido)</span>
        </div>
        <p className="text-xl font-bold text-emerald-500">
          {formatCurrency(investir)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Líquido do mês: {formatCurrency(liquidoMes)}
        </p>
      </CardContent>
    </Card>
  );
}
