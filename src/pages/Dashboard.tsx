import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLancamentos, useLancamentosAno, useAtalhosRapidos, useModelosRecorrentes } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, MESES, calcularDescontos } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Church, Receipt, Fuel,
  Wallet, ArrowUpRight, Plus, Zap, Activity, Heart, Dumbbell, ShoppingBag, Briefcase,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import SalaryForecast from '@/components/dashboard/SalaryForecast';
import CategoryBreakdown from '@/components/dashboard/CategoryBreakdown';
import InvestmentCard from '@/components/dashboard/InvestmentCard';
import QuickValueDialog from '@/components/dashboard/QuickValueDialog';

const ICON_MAP: Record<string, React.ElementType> = {
  zap: Zap, activity: Activity, heart: Heart, dumbbell: Dumbbell,
  'shopping-bag': ShoppingBag, receipt: Receipt, fuel: Fuel, church: Church,
  briefcase: Briefcase,
};

const now = new Date();

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [dialogAtalho, setDialogAtalho] = useState<typeof atalhos[0] | null>(null);

  const { data: lancamentosMes = [] } = useLancamentos(mes, ano);
  const { data: lancamentosAno = [] } = useLancamentosAno(ano);
  const { data: atalhos = [] } = useAtalhosRapidos();
  const { data: modelos = [] } = useModelosRecorrentes();

  // Previsão salarial: soma dos modelos recorrentes ativos de receita
  const previsao = useMemo(() => {
    return modelos
      .filter(m => m.tipo_lancamento === 'receita' && m.ativo)
      .reduce((s, m) => s + Number(m.valor_padrao), 0);
  }, [modelos]);

  // Já recebido: receitas do mês com status recebido
  const recebido = useMemo(() => {
    return lancamentosMes
      .filter(l => l.tipo_lancamento === 'receita' && l.status === 'recebido')
      .reduce((s, l) => s + Number(l.valor_bruto), 0);
  }, [lancamentosMes]);

  const resumoMes = useMemo(() => {
    const receitas = lancamentosMes.filter(l => l.tipo_lancamento === 'receita');
    const despesas = lancamentosMes.filter(l => l.tipo_lancamento === 'despesa');
    const bruto = receitas.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const liquido = receitas.reduce((s, l) => s + Number(l.valor_liquido), 0);
    const dizimo = receitas.reduce((s, l) => s + Number(l.valor_dizimo), 0);
    const imposto = receitas.reduce((s, l) => s + Number(l.valor_imposto), 0);
    const gasolina = receitas.reduce((s, l) => s + Number(l.valor_gasolina), 0);
    const totalDespesas = despesas.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const saldo = liquido - totalDespesas;
    return { bruto, liquido, dizimo, imposto, gasolina, totalDespesas, saldo };
  }, [lancamentosMes]);

  const resumoAno = useMemo(() => {
    const receitas = lancamentosAno.filter(l => l.tipo_lancamento === 'receita');
    return {
      bruto: receitas.reduce((s, l) => s + Number(l.valor_bruto), 0),
      liquido: receitas.reduce((s, l) => s + Number(l.valor_liquido), 0),
      dizimo: receitas.reduce((s, l) => s + Number(l.valor_dizimo), 0),
      imposto: receitas.reduce((s, l) => s + Number(l.valor_imposto), 0),
      gasolina: receitas.reduce((s, l) => s + Number(l.valor_gasolina), 0),
    };
  }, [lancamentosAno]);

  const chartMensal = useMemo(() => {
    const mesesData: Record<number, { bruto: number; liquido: number }> = {};
    lancamentosAno.filter(l => l.tipo_lancamento === 'receita').forEach(l => {
      if (!mesesData[l.competencia_mes]) mesesData[l.competencia_mes] = { bruto: 0, liquido: 0 };
      mesesData[l.competencia_mes].bruto += Number(l.valor_bruto);
      mesesData[l.competencia_mes].liquido += Number(l.valor_liquido);
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mes: MESES[i].substring(0, 3),
      bruto: mesesData[i + 1]?.bruto || 0,
      liquido: mesesData[i + 1]?.liquido || 0,
    }));
  }, [lancamentosAno]);

  const chartCategoria = useMemo(() => {
    const cats: Record<string, { nome: string; valor: number; cor: string }> = {};
    lancamentosMes.filter(l => l.tipo_lancamento === 'receita').forEach(l => {
      const cat = l.categorias;
      if (!cat) return;
      if (!cats[l.categoria_id]) cats[l.categoria_id] = { nome: cat.nome, valor: 0, cor: cat.cor || '#8884d8' };
      cats[l.categoria_id].valor += Number(l.valor_bruto);
    });
    return Object.values(cats);
  }, [lancamentosMes]);

  const launchEntry = useCallback(async (atalho: typeof atalhos[0], valorOverride?: number) => {
    if (!user) return;
    const valor = valorOverride ?? Number(atalho.valor_padrao);

    let r: any = null;
    try {
      const { data: regra } = await supabase.rpc('obter_regra_categoria', {
        p_user_id: user.id,
        p_categoria_id: atalho.categoria_id,
        p_pessoa_id: atalho.pessoa_id || atalho.categoria_id,
      });
      r = regra?.[0];
    } catch {}

    const hoje = new Date();
    const { valorDizimo, valorImposto, valorGasolina, valorLiquido } = calcularDescontos(
      valor,
      r?.percentual_dizimo ?? 0,
      r?.percentual_imposto ?? 0,
      r?.percentual_gasolina ?? 0,
      r?.aplicar_dizimo ?? false,
      r?.aplicar_imposto ?? false,
      r?.aplicar_gasolina ?? false,
    );
    const payload = {
      user_id: user.id,
      pessoa_id: atalho.pessoa_id || atalho.categoria_id,
      categoria_id: atalho.categoria_id,
      descricao: atalho.nome,
      tipo_lancamento: 'receita' as const,
      valor_bruto: valor,
      valor_dizimo: valorDizimo,
      valor_imposto: valorImposto,
      valor_gasolina: valorGasolina,
      valor_liquido: valorLiquido,
      percentual_dizimo: r?.percentual_dizimo ?? 0,
      percentual_imposto: r?.percentual_imposto ?? 0,
      percentual_gasolina: r?.percentual_gasolina ?? 0,
      aplicar_dizimo: r?.aplicar_dizimo ?? false,
      aplicar_imposto: r?.aplicar_imposto ?? false,
      aplicar_gasolina: r?.aplicar_gasolina ?? false,
      data_prevista: hoje.toISOString().split('T')[0],
      competencia_mes: hoje.getMonth() + 1,
      competencia_ano: hoje.getFullYear(),
      status: 'recebido',
    };

    const { error } = await supabase.from('lancamentos').insert(payload);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-ano'] });
      toast({ title: `${atalho.nome} — ${formatCurrency(valor)} lançado!` });
    }
  }, [user, toast, queryClient]);

  const handleAtalho = useCallback((atalho: typeof atalhos[0]) => {
    if (!user) return;
    setDialogAtalho(atalho);
  }, [user]);

  const cards = [
    { title: 'Bruto', value: resumoMes.bruto, icon: TrendingUp, color: 'text-primary' },
    { title: 'Líquido', value: resumoMes.liquido, icon: Wallet, color: 'text-emerald-500' },
    { title: 'Dízimo', value: resumoMes.dizimo, icon: Church, color: 'text-red-500' },
    { title: 'Imposto', value: resumoMes.imposto, icon: Receipt, color: 'text-rose-600' },
    { title: 'Gasolina', value: resumoMes.gasolina, icon: Fuel, color: 'text-amber-500' },
    { title: 'Despesas', value: resumoMes.totalDespesas, icon: TrendingDown, color: 'text-destructive' },
    { title: 'Saldo', value: resumoMes.saldo, icon: ArrowUpRight, color: resumoMes.saldo >= 0 ? 'text-emerald-500' : 'text-destructive' },
  ];

  return (
    <div className="space-y-4">
      {/* Header + month/year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Previsão Salarial */}
      <SalaryForecast previsao={previsao} recebido={recebido} />

      {/* Atalhos rápidos agrupados por categoria */}
      {(() => {
        const grouped: Record<string, typeof atalhos> = {};
        atalhos.forEach(a => {
          const catNome = a.categorias?.nome || 'Geral';
          if (!grouped[catNome]) grouped[catNome] = [];
          grouped[catNome].push(a);
        });
        const entries = Object.entries(grouped);
        if (entries.length === 0) {
          return (
            <Link to="/configuracoes" className="block">
              <Button variant="outline" className="w-full h-14 gap-2 text-muted-foreground">
                <Plus className="h-4 w-4" /> Configurar atalhos rápidos
              </Button>
            </Link>
          );
        }
        return entries.map(([catNome, items]) => {
          const totalGrupo = items.reduce((s, a) => s + Number(a.valor_padrao), 0);
          return (
          <div key={catNome} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: items[0]?.categorias?.cor || '#888' }}
              />
              <h3 className="text-sm font-semibold">{catNome}</h3>
              <span className="text-xs text-muted-foreground">({items.length})</span>
              {totalGrupo > 0 && (
                <span className="text-xs font-semibold ml-auto">{formatCurrency(totalGrupo)}</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {items.map(atalho => {
                const Icon = ICON_MAP[atalho.icone || 'zap'] || Zap;
                  return (
                    <Button
                      key={atalho.id}
                      variant="outline"
                      className="w-full h-16 gap-2 text-xs font-medium justify-start px-2"
                      onClick={() => handleAtalho(atalho)}
                    >
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: atalho.cor || '#3B82F6' }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="truncate text-left">
                        <span className="block truncate">{atalho.nome}</span>
                        {Number(atalho.valor_padrao) > 0 && (
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            {formatCurrency(Number(atalho.valor_padrao))}
                          </span>
                        )}
                      </span>
                    </Button>
                  );
              })}
            </div>
          </div>
          );
        });
      })()}

      {/* Cards do mês + Investimento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <Card key={c.title} className={i === cards.length - 1 ? 'col-span-2 sm:col-span-1' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.title}</span>
              </div>
              <p className={`text-lg font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Investimento */}
      <InvestmentCard liquidoMes={resumoMes.liquido} />

      {/* Ganhos por Fonte */}
      <CategoryBreakdown lancamentos={lancamentosMes} />

      {/* Resumo anual */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo {ano}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            {[
              { label: 'Bruto', val: resumoAno.bruto },
              { label: 'Líquido', val: resumoAno.liquido },
              { label: 'Dízimo', val: resumoAno.dizimo },
              { label: 'Imposto', val: resumoAno.imposto },
              { label: 'Gasolina', val: resumoAno.gasolina },
            ].map(item => (
              <div key={item.label}>
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className="font-semibold">{formatCurrency(item.val)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartMensal}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="bruto" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="liquido" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Receitas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {chartCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {chartCategoria.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma receita neste mês</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick value dialog */}
      <QuickValueDialog
        open={!!dialogAtalho}
        onOpenChange={open => !open && setDialogAtalho(null)}
        nome={dialogAtalho?.nome || ''}
        valorPadrao={Number(dialogAtalho?.valor_padrao) || 0}
        categoriaNome={dialogAtalho?.categorias?.nome}
        categoriaCor={dialogAtalho?.categorias?.cor || dialogAtalho?.cor || undefined}
        onConfirm={valor => {
          if (dialogAtalho) launchEntry(dialogAtalho, valor);
        }}
        onEditRecorrencia={() => {
          navigate('/configuracoes');
        }}
      />

      {/* FAB */}
      <Link to="/novo" className="fixed bottom-20 right-4 md:bottom-6 z-50">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
