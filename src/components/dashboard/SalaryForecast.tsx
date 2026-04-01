import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface Props {
  previsao: number;
  recebidoRecorrente: number;
  avulsos: number;
}

export default function SalaryForecast({ previsao, recebidoRecorrente, avulsos }: Props) {
  const totalMes = previsao + avulsos;
  const totalRecebido = recebidoRecorrente + avulsos;
  const percent = totalMes > 0 ? Math.min((totalRecebido / totalMes) * 100, 100) : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Previsão Salarial do Mês</span>
        </div>

        <div className="space-y-1 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recorrente (previsão)</span>
            <span>{formatCurrency(previsao)}</span>
          </div>
          {avulsos > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Avulsos</span>
              <span className="text-green-600">+{formatCurrency(avulsos)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total do mês</span>
            <span className="text-primary">{formatCurrency(totalMes)}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(totalRecebido)}
          </span>
          <span className="text-xs text-muted-foreground">
            de {formatCurrency(totalMes)}
          </span>
        </div>
        <Progress value={percent} className="h-2.5" />
        <p className="text-xs text-muted-foreground mt-1.5">
          {percent.toFixed(0)}% recebido
        </p>
      </CardContent>
    </Card>
  );
}
