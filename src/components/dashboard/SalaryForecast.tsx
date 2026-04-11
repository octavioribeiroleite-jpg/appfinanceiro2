import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CalendarClock } from 'lucide-react';

interface Props {
  previsao: number;
  recebidoRecorrente: number;
  avulsos: number;
  mes?: number;
  ano?: number;
}

export default function SalaryForecast({ previsao, recebidoRecorrente, avulsos, mes, ano }: Props) {
  const totalMes = previsao + avulsos;
  const totalRecebido = recebidoRecorrente + avulsos;
  const restante = Math.max(totalMes - totalRecebido, 0);
  const percent = totalMes > 0 ? Math.min((totalRecebido / totalMes) * 100, 100) : 0;

  const now = new Date();
  const currentMonth = mes ?? (now.getMonth() + 1);
  const currentYear = ano ?? now.getFullYear();
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const today = (currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1)
    ? now.getDate()
    : (currentMonth < now.getMonth() + 1 || currentYear < now.getFullYear()) ? lastDay : 0;
  const diasRestantes = Math.max(lastDay - today, 0);

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

        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(totalRecebido)}
          </span>
          <span className="text-xs text-muted-foreground">
            de {formatCurrency(totalMes)}
          </span>
        </div>

        {restante > 0 && (
          <div className="flex items-center justify-between mb-2 px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Restante a receber</span>
            </div>
            <span className="text-sm font-bold text-amber-700">{formatCurrency(restante)}</span>
          </div>
        )}

        <Progress value={percent} className="h-2.5" />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-muted-foreground">
            {percent.toFixed(0)}% recebido
          </p>
          <p className="text-xs text-muted-foreground">
            {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Mês encerrado'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}