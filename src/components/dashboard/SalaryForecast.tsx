import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

interface Props {
  previsao: number;
  recebido: number;
}

export default function SalaryForecast({ previsao, recebido }: Props) {
  const percent = previsao > 0 ? Math.min((recebido / previsao) * 100, 100) : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Previsão Salarial do Mês</span>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(recebido)}
          </span>
          <span className="text-sm text-muted-foreground">
            de {formatCurrency(previsao)}
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
