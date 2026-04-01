import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLancamentos, useLancamentosAno, useCategorias } from '@/hooks/useFinanceData';
import { formatCurrency, MESES } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, TrendingDown, Church, Receipt, Fuel,
  Wallet, ArrowUpRight, Activity, Heart, Dumbbell, ShoppingBag, Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const now = new Date();

export default function Dashboard() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const { data: lancamentosMes = [] } = useLancamentos(mes, ano);
  const { data: lancamentosAno = [] } = useLancamentosAno(ano);
  const { data: categoriasReceita = [] } = useCategorias('receita');

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
    const meses: Record<number, { bruto: number; liquido: number }> = {};
    lancamentosAno.filter(l => l.tipo_lancamento === 'receita').forEach(l => {
      if (!meses[l.competencia_mes]) meses[l.competencia_mes] = { bruto: 0, liquido: 0 };
      meses[l.competencia_mes].bruto += Number(l.valor_bruto);
      meses[l.competencia_mes].liquido += Number(l.valor_liquido);
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mes: MESES[i].substring(0, 3),
      bruto: meses[i + 1]?.bruto || 0,
      liquido: meses[i + 1]?.liquido || 0,
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

  const quickActions = [
    { label: '+ Raio X', icon: Activity, categoria: 'Raio X', color: 'bg-blue-500' },
    { label: '+ Eletro', icon: Heart, categoria: 'Eletro', color: 'bg-violet-500' },
    { label: '+ Personal', icon: Dumbbell, categoria: 'Personal esposa', color: 'bg-green-500' },
    { label: '+ Venda', icon: ShoppingBag, categoria: 'Vendas', color: 'bg-orange-500' },
  ];

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map(action => {
          const cat = categoriasReceita.find(c => c.nome === action.categoria);
          return (
            <Link
              key={action.categoria}
              to={cat ? `/novo?categoria_id=${cat.id}&tipo=receita` : '/novo?tipo=receita'}
            >
              <Button variant="outline" className="w-full h-12 gap-2 text-sm font-medium">
                <div className={`h-6 w-6 rounded-md ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-3.5 w-3.5 text-white" />
                </div>
                {action.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.title}>
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

      {/* FAB */}
      <Link to="/novo" className="fixed bottom-20 right-4 md:bottom-6 z-50">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
