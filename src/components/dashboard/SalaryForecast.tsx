import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CalendarClock, User, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PessoaPrevisao {
  id: string;
  nome: string;
  previsao: number;
  recebido: number;
}

interface Props {
  previsao: number;
  recebidoRecorrente: number;
  avulsos: number;
  mes?: number;
  ano?: number;
  porPessoa?: PessoaPrevisao[];
}

export default function SalaryForecast({ previsao, recebidoRecorrente, avulsos, mes, ano, porPessoa = [] }: Props) {
  const navigate = useNavigate();
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

  const pessoasComPrevisao = porPessoa.filter(p => p.previsao > 0 || p.recebido > 0);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Previsão Salarial do Mês</span>
        </div>

        {/* Por pessoa */}
        {pessoasComPrevisao.length > 0 && (
          <div className="space-y-2">
            {pessoasComPrevisao.map(p => {
              const pct = p.previsao > 0 ? Math.min((p.recebido / p.previsao) * 100, 100) : (p.recebido > 0 ? 100 : 0);
              const completo = p.previsao > 0 && p.recebido >= p.previsao;
              const params = new URLSearchParams({ pessoa: p.id });
              if (mes) params.set('mes', String(mes));
              if (ano) params.set('ano', String(ano));
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/lancamentos?${params.toString()}`)}
                  className="w-full text-left rounded-lg bg-card border p-3 space-y-1.5 hover:bg-accent/50 active:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold truncate">{p.nome}</span>
                      {completo && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-base font-bold tabular-nums ${completo ? 'text-emerald-600' : 'text-primary'}`}>
                      {formatCurrency(p.recebido)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      de {formatCurrency(p.previsao)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Total */}
        <div className="space-y-2 pt-1 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Total do mês</span>
            <span className="text-base font-bold text-primary tabular-nums">{formatCurrency(totalMes)}</span>
          </div>
          {avulsos > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Inclui avulsos</span>
              <span className="text-emerald-600 tabular-nums">+{formatCurrency(avulsos)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Recebido</span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(totalRecebido)}
            </span>
          </div>
          <Progress value={percent} className="h-2" />
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">{percent.toFixed(0)}% recebido</p>
            <p className="text-xs text-muted-foreground">
              {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Mês encerrado'}
            </p>
          </div>
        </div>

        {restante > 0 && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Restante a receber</span>
            </div>
            <span className="text-sm font-bold text-amber-700 tabular-nums">{formatCurrency(restante)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
