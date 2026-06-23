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
  Wallet, ArrowUpRight, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import SalaryForecast from '@/components/dashboard/SalaryForecast';

import InvestmentCard from '@/components/dashboard/InvestmentCard';
import QuickValueDialog from '@/components/dashboard/QuickValueDialog';
import CategoryGroupDialog from '@/components/dashboard/CategoryGroupDialog';
import RecorrenciasPendentes from '@/components/dashboard/RecorrenciasPendentes';

const EMOJI_MAP: Record<string, string> = {
  zap: '⚡', activity: '❤️‍🩹', heart: '❤️', dumbbell: '🏋️',
  'shopping-bag': '🛍️', receipt: '🧾', fuel: '⛽', church: '⛪',
  briefcase: '💼',
};

const now = new Date();

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [dialogAtalho, setDialogAtalho] = useState<any>(null);
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);

  const { data: lancamentosMes = [] } = useLancamentos(mes, ano);
  const { data: lancamentosAno = [] } = useLancamentosAno(ano);
  const { data: atalhos = [] } = useAtalhosRapidos();
  const { data: modelos = [] } = useModelosRecorrentes();

  const previsao = useMemo(() => {
    return modelos
      .filter(m => m.tipo_lancamento === 'receita' && m.ativo)
      .reduce((s, m) => s + Number(m.valor_padrao), 0);
  }, [modelos]);

  const recebidoRecorrente = useMemo(() => {
    return lancamentosMes
      .filter(l => l.tipo_lancamento === 'receita' && l.status === 'recebido' && l.modelo_id)
      .reduce((s, l) => s + Number(l.valor_bruto), 0);
  }, [lancamentosMes]);

  const avulsos = useMemo(() => {
    return lancamentosMes
      .filter(l => l.tipo_lancamento === 'receita' && l.status === 'recebido' && !l.modelo_id)
      .reduce((s, l) => s + Number(l.valor_bruto), 0);
  }, [lancamentosMes]);

  const porPessoa = useMemo(() => {
    const map: Record<string, { id: string; nome: string; previsao: number; recebido: number }> = {};
    modelos.filter(m => m.tipo_lancamento === 'receita' && m.ativo).forEach(m => {
      const id = m.pessoa_id;
      const nome = (m as any).pessoas?.nome || 'Sem pessoa';
      if (!map[id]) map[id] = { id, nome, previsao: 0, recebido: 0 };
      map[id].previsao += Number(m.valor_padrao);
    });
    lancamentosMes
      .filter(l => l.tipo_lancamento === 'receita' && l.status === 'recebido')
      .forEach(l => {
        const id = l.pessoa_id;
        const nome = (l as any).pessoas?.nome || 'Sem pessoa';
        if (!map[id]) map[id] = { id, nome, previsao: 0, recebido: 0 };
        map[id].recebido += Number(l.valor_bruto);
      });
    return Object.values(map).sort((a, b) => b.previsao - a.previsao);
  }, [modelos, lancamentosMes]);

  const recebido = recebidoRecorrente + avulsos;

  // Agrupar lançamentos reais do mês por categoria
  const lancamentosAgrupados = useMemo(() => {
    const grouped: Record<string, { nome: string; cor: string; bruto: number; liquido: number; qtd: number; items: typeof lancamentosMes }> = {};
    lancamentosMes
      .filter(l => l.tipo_lancamento === 'receita')
      .forEach(l => {
        const catId = l.categoria_id;
        const catNome = l.categorias?.nome || 'Geral';
        const catCor = l.categorias?.cor || '#888';
        if (!grouped[catId]) grouped[catId] = { nome: catNome, cor: catCor, bruto: 0, liquido: 0, qtd: 0, items: [] };
        grouped[catId].bruto += Number(l.valor_bruto);
        grouped[catId].liquido += Number(l.valor_liquido);
        grouped[catId].qtd += 1;
        grouped[catId].items.push(l);
      });
    return grouped;
  }, [lancamentosMes]);

  const categoriaAbertaData = categoriaAberta ? lancamentosAgrupados[categoriaAberta] : null;

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
    const mesesData: Record<number, { bruto: number; liquido: number; qtd: number }> = {};
    lancamentosAno.filter(l => l.tipo_lancamento === 'receita').forEach(l => {
      if (!mesesData[l.competencia_mes]) mesesData[l.competencia_mes] = { bruto: 0, liquido: 0, qtd: 0 };
      mesesData[l.competencia_mes].bruto += Number(l.valor_bruto);
      mesesData[l.competencia_mes].liquido += Number(l.valor_liquido);
      mesesData[l.competencia_mes].qtd += 1;
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mes: MESES[i].substring(0, 3),
      bruto: mesesData[i + 1]?.bruto || 0,
      liquido: mesesData[i + 1]?.liquido || 0,
      qtd: mesesData[i + 1]?.qtd || 0,
    }));
  }, [lancamentosAno]);

  const totalQtdAno = useMemo(
    () => lancamentosAno.filter(l => l.tipo_lancamento === 'receita').length,
    [lancamentosAno],
  );

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

  const launchEntry = useCallback(async (atalho: any, valorOverride?: number) => {
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
    <div className="space-y-6">
      {/* Hero header — compact (reference style) */}
      <div className="space-y-1 pt-1">
        <p className="text-xs italic text-muted-foreground">
          "Até aqui nos ajudou o Senhor" — 1 Samuel 7:12
        </p>
        <h1 className="font-display text-2xl font-bold text-primary capitalize leading-tight">
          {MESES[mes - 1]} de {ano}
        </h1>
      </div>

      {/* Month/year selector */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl bg-card border-border/70 shrink-0"
          onClick={() => {
            if (mes === 1) { setMes(12); setAno(ano - 1); } else { setMes(mes - 1); }
          }}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
          <SelectTrigger className="flex-1 bg-card border-border/70 rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
          <SelectTrigger className="w-20 bg-card border-border/70 rounded-xl h-10 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map(a => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl bg-card border-border/70 shrink-0"
          onClick={() => {
            if (mes === 12) { setMes(1); setAno(ano + 1); } else { setMes(mes + 1); }
          }}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick month chips — últimos 6 meses */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Ir para:</span>
        {Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(ano, mes - 1 - i, 1);
          const m = d.getMonth() + 1;
          const a = d.getFullYear();
          const isActive = m === mes && a === ano;
          const label = `${MESES[m - 1].substring(0, 3).toLowerCase()} de ${String(a).slice(-2)}`;
          return (
            <button
              key={`${m}-${a}`}
              onClick={() => { setMes(m); setAno(a); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border/70 hover:bg-muted'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 1. Previsão Salarial */}
      <SalaryForecast previsao={previsao} recebidoRecorrente={recebidoRecorrente} avulsos={avulsos} mes={mes} ano={ano} porPessoa={porPessoa} />

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

      {/* Faturamento anual — estilo lista (referência) */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-end justify-between gap-2">
            <CardTitle className="text-base font-bold">Faturamento {ano}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {totalQtdAno} lançamentos ·{' '}
              <span className="font-semibold text-foreground">{formatCurrency(resumoAno.bruto)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {(() => {
            const max = Math.max(...chartMensal.map(m => m.bruto), 1);
            return (
              <div className="space-y-2">
                {chartMensal.map((m, i) => {
                  const isActive = i === mes - 1;
                  const pct = (m.bruto / max) * 100;
                  const hasValue = m.bruto > 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setMes(i + 1)}
                      className="w-full grid grid-cols-[36px_1fr_40px_84px] items-center gap-2"
                    >
                      <span className={`text-xs text-left ${isActive ? 'font-bold text-foreground' : 'text-muted-foreground'} ${!hasValue ? 'opacity-40' : ''}`}>
                        {MESES[i].substring(0, 3)}
                      </span>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs tabular-nums text-right ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'} ${!hasValue ? 'opacity-40' : ''}`}>
                        {hasValue ? `${m.qtd}x` : '—'}
                      </span>
                      <span className={`text-xs tabular-nums text-right ${isActive ? 'font-bold text-primary' : hasValue ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {hasValue ? formatCurrency(m.bruto) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* 2. Recorrências Pendentes */}
      <RecorrenciasPendentes modelos={modelos} lancamentosMes={lancamentosMes} mes={mes} ano={ano} />


      {/* 3. Atalhos Rápidos — botões individuais para lançamento rápido */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Atalhos Rápidos</h2>
        {atalhos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {atalhos.map(atalho => (
              <Card
                key={atalho.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDialogAtalho(atalho)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: atalho.cor || '#3B82F6' }}
                    />
                    <span className="text-sm font-semibold truncate">{atalho.nome}</span>
                  </div>
                  {(atalho as any).descricao && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{(atalho as any).descricao}</p>
                  )}
                  {Number(atalho.valor_padrao) > 0 && (
                    <p className="text-base font-bold text-primary">{formatCurrency(Number(atalho.valor_padrao))}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Link to="/configuracoes" className="block">
            <Button variant="outline" className="w-full h-14 gap-2 text-muted-foreground">
              <Plus className="h-4 w-4" /> Configurar atalhos rápidos
            </Button>
          </Link>
        )}
        <Link to="/configuracoes" className="block">
          <Button variant="outline" className="w-full h-10 gap-2 text-muted-foreground text-xs">
            <Plus className="h-4 w-4" /> Adicionar atalho rápido
          </Button>
        </Link>
      </div>

      {/* 3. Resumo por Categoria — lançamentos reais do mês */}
      {Object.keys(lancamentosAgrupados).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Receitas por Categoria</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(lancamentosAgrupados)
              .sort(([, a], [, b]) => b.bruto - a.bruto)
              .map(([catId, group]) => (
                <Card
                  key={catId}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCategoriaAberta(catId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.cor }}
                      />
                      <span className="text-sm font-semibold truncate">{group.nome}</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(group.bruto)}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.qtd} lançamento{group.qtd > 1 ? 's' : ''} · Líq: {formatCurrency(group.liquido)}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* 4. Cards financeiros do mês — compactos estilo referência */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => {
          const highlight = c.title === 'Líquido';
          return (
            <Card
              key={c.title}
              className={`rounded-2xl border-border/60 shadow-none ${highlight ? 'bg-accent/40' : 'bg-card'} ${i === cards.length - 1 ? 'col-span-2' : ''}`}
            >
              <CardContent className="p-3.5">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {c.title}
                </p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
                  {formatCurrency(c.value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 5. Investimento */}
      <InvestmentCard liquidoMes={resumoMes.liquido} />


      {/* 7. Resumo anual */}
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

      {/* Receitas por mês — estilo lista (referência) */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-end justify-between gap-2">
            <CardTitle className="text-base font-bold">Faturamento {ano}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {totalQtdAno} lançamentos ·{' '}
              <span className="font-semibold text-foreground">{formatCurrency(resumoAno.bruto)}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {(() => {
            const max = Math.max(...chartMensal.map(m => m.bruto), 1);
            return (
              <div className="space-y-2">
                {chartMensal.map((m, i) => {
                  const isActive = i === mes - 1;
                  const pct = (m.bruto / max) * 100;
                  const hasValue = m.bruto > 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setMes(i + 1)}
                      className="w-full grid grid-cols-[36px_1fr_40px_84px] items-center gap-2"
                    >
                      <span className={`text-xs text-left ${isActive ? 'font-bold text-foreground' : 'text-muted-foreground'} ${!hasValue ? 'opacity-40' : ''}`}>
                        {MESES[i].substring(0, 3)}
                      </span>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-accent'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs tabular-nums text-right ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'} ${!hasValue ? 'opacity-40' : ''}`}>
                        {hasValue ? `${m.qtd}x` : '—'}
                      </span>
                      <span className={`text-xs tabular-nums text-right ${isActive ? 'font-bold text-primary' : hasValue ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {hasValue ? formatCurrency(m.bruto) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Receitas por Categoria (pizza) */}
      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Receitas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {chartCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
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

      {/* Category Group Dialog — mostra lançamentos reais */}
      <CategoryGroupDialog
        open={!!categoriaAberta && !!categoriaAbertaData}
        onOpenChange={open => !open && setCategoriaAberta(null)}
        categoriaNome={categoriaAbertaData?.nome || ''}
        categoriaCor={categoriaAbertaData?.cor || '#888'}
        lancamentos={categoriaAbertaData?.items || []}
        totalBruto={categoriaAbertaData?.bruto || 0}
        totalLiquido={categoriaAbertaData?.liquido || 0}
      />

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


    </div>
  );
}
