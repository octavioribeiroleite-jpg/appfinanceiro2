import { useState, useMemo } from 'react';
import { useLancamentos, useLancamentosAno, usePessoas } from '@/hooks/useFinanceData';
import { formatCurrency, MESES } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Wallet, Church, Receipt, Fuel, TrendingDown } from 'lucide-react';

const now = new Date();

function ResumoCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
      <Icon className={`h-4 w-4 ${color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold ${color}`}>{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

function PessoaReport({ lancamentos, nome }: { lancamentos: any[]; nome: string }) {
  const receitas = lancamentos.filter(l => l.tipo_lancamento === 'receita');
  const despesas = lancamentos.filter(l => l.tipo_lancamento === 'despesa');

  const bruto = receitas.reduce((s, l) => s + Number(l.valor_bruto), 0);
  const liquido = receitas.reduce((s, l) => s + Number(l.valor_liquido), 0);
  const dizimo = receitas.reduce((s, l) => s + Number(l.valor_dizimo), 0);
  const imposto = receitas.reduce((s, l) => s + Number(l.valor_imposto), 0);
  const gasolina = receitas.reduce((s, l) => s + Number(l.valor_gasolina), 0);
  const totalDespesas = despesas.reduce((s, l) => s + Number(l.valor_bruto), 0);
  const saldo = liquido - totalDespesas;

  // Progresso recebido vs pendente
  const recebido = receitas.filter(l => l.status === 'recebido').reduce((s, l) => s + Number(l.valor_bruto), 0);
  const pendente = receitas.filter(l => l.status === 'pendente').reduce((s, l) => s + Number(l.valor_bruto), 0);
  const totalPrevisto = recebido + pendente;
  const progressoPct = totalPrevisto > 0 ? Math.round((recebido / totalPrevisto) * 100) : 0;

  // Por categoria
  const porCategoria: Record<string, { nome: string; bruto: number; liquido: number; dizimo: number; imposto: number; gasolina: number; cor: string }> = {};
  receitas.forEach(l => {
    const cat = l.categorias;
    if (!cat) return;
    if (!porCategoria[l.categoria_id]) porCategoria[l.categoria_id] = { nome: cat.nome, bruto: 0, liquido: 0, dizimo: 0, imposto: 0, gasolina: 0, cor: cat.cor || '#888' };
    porCategoria[l.categoria_id].bruto += Number(l.valor_bruto);
    porCategoria[l.categoria_id].liquido += Number(l.valor_liquido);
    porCategoria[l.categoria_id].dizimo += Number(l.valor_dizimo);
    porCategoria[l.categoria_id].imposto += Number(l.valor_imposto);
    porCategoria[l.categoria_id].gasolina += Number(l.valor_gasolina);
  });
  const cats = Object.values(porCategoria);

  const lancamentosReceita = receitas.sort((a, b) => (a.descricao || '').localeCompare(b.descricao || ''));

  if (bruto === 0 && totalDespesas === 0) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Nenhum lançamento para {nome} neste período</p>;
  }

  const pieData = [
    { nome: 'Líquido', valor: liquido, cor: 'hsl(142, 71%, 45%)' },
    ...(dizimo > 0 ? [{ nome: 'Dízimo', valor: dizimo, cor: 'hsl(0, 72%, 51%)' }] : []),
    ...(imposto > 0 ? [{ nome: 'Imposto', valor: imposto, cor: 'hsl(0, 84%, 40%)' }] : []),
    ...(gasolina > 0 ? [{ nome: 'Gasolina', valor: gasolina, cor: 'hsl(45, 93%, 47%)' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Progresso do mês */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Progresso do Mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Recebido</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(recebido)} <span className="text-muted-foreground font-normal">/ {formatCurrency(totalPrevisto)}</span></span>
          </div>
          <Progress value={progressoPct} className="h-3" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressoPct}% recebido</span>
            <span className="font-semibold text-amber-600">Falta: {formatCurrency(pendente)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-2">
        <ResumoCard icon={TrendingUp} label="Bruto" value={bruto} color="text-primary" />
        <ResumoCard icon={Wallet} label="Líquido" value={liquido} color="text-emerald-500" />
        <ResumoCard icon={Receipt} label="Imposto" value={imposto} color="text-rose-600" />
        <ResumoCard icon={Fuel} label="Gasolina" value={gasolina} color="text-amber-500" />
        <ResumoCard icon={TrendingDown} label="Despesas" value={totalDespesas} color="text-destructive" />
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
          <Wallet className={`h-4 w-4 shrink-0 ${saldo >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Saldo</p>
            <p className={`text-sm font-bold ${saldo >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>{formatCurrency(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Dízimo em destaque */}
      {dizimo > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Church className="h-6 w-6 text-red-600" />
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Dízimo do Mês</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(dizimo)}</p>
            <p className="text-[10px] text-muted-foreground">Valor a devolver para a igreja</p>
          </CardContent>
        </Card>
      )}

      {/* Gráfico pizza */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Distribuição do Bruto</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Por categoria */}
      {cats.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por Categoria</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs text-right">Bruto</TableHead>
                    <TableHead className="text-xs text-right">Dízimo</TableHead>
                    <TableHead className="text-xs text-right">Imposto</TableHead>
                    <TableHead className="text-xs text-right">Gasolina</TableHead>
                    <TableHead className="text-xs text-right">Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats.map(c => (
                    <TableRow key={c.nome}>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                          {c.nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(c.bruto)}</TableCell>
                      <TableCell className="text-xs text-right text-red-500">{formatCurrency(c.dizimo)}</TableCell>
                      <TableCell className="text-xs text-right text-rose-600">{formatCurrency(c.imposto)}</TableCell>
                      <TableCell className="text-xs text-right text-amber-500">{formatCurrency(c.gasolina)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-emerald-600">{formatCurrency(c.liquido)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="text-xs font-bold">Total</TableCell>
                    <TableCell className="text-xs text-right font-bold">{formatCurrency(bruto)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-red-500">{formatCurrency(dizimo)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-rose-600">{formatCurrency(imposto)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-amber-500">{formatCurrency(gasolina)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-emerald-600">{formatCurrency(liquido)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lançamentos detalhados */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Lançamentos Detalhados</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Descrição</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs text-right">Bruto</TableHead>
                  <TableHead className="text-xs text-right">Líquido</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentosReceita.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{l.descricao}</TableCell>
                    <TableCell className="text-xs">{l.categorias?.nome}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(Number(l.valor_bruto))}</TableCell>
                    <TableCell className="text-xs text-right text-emerald-600">{formatCurrency(Number(l.valor_liquido))}</TableCell>
                    <TableCell className="text-xs text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${l.status === 'recebido' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {l.status === 'recebido' ? 'Recebido' : 'Pendente'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Relatorios() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const { data: lancamentosMes = [] } = useLancamentos(mes, ano);
  const { data: lancamentosAno = [] } = useLancamentosAno(ano);
  const { data: pessoas = [] } = usePessoas();

  const lancamentosPorPessoa = useMemo(() => {
    const map: Record<string, any[]> = {};
    lancamentosMes.forEach(l => {
      if (!map[l.pessoa_id]) map[l.pessoa_id] = [];
      map[l.pessoa_id].push(l);
    });
    return map;
  }, [lancamentosMes]);

  // Evolução anual
  const evolucaoMensal = useMemo(() => {
    const meses: Record<number, { bruto: number; liquido: number; despesas: number }> = {};
    lancamentosAno.forEach(l => {
      if (!meses[l.competencia_mes]) meses[l.competencia_mes] = { bruto: 0, liquido: 0, despesas: 0 };
      if (l.tipo_lancamento === 'receita') {
        meses[l.competencia_mes].bruto += Number(l.valor_bruto);
        meses[l.competencia_mes].liquido += Number(l.valor_liquido);
      } else {
        meses[l.competencia_mes].despesas += Number(l.valor_bruto);
      }
    });
    return Array.from({ length: 12 }, (_, i) => ({
      mes: MESES[i].substring(0, 3),
      ...meses[i + 1] || { bruto: 0, liquido: 0, despesas: 0 },
    }));
  }, [lancamentosAno]);

  // Abas fixas: todas as pessoas cadastradas + Geral + Anual
  const defaultTab = pessoas.length > 0 ? pessoas[0].id : 'geral';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${pessoas.length + 2}, 1fr)` }}>
          {pessoas.map(p => (
            <TabsTrigger key={p.id} value={p.id} className="text-xs">{p.nome}</TabsTrigger>
          ))}
          <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
          <TabsTrigger value="anual" className="text-xs">Anual</TabsTrigger>
        </TabsList>

        {/* Abas por pessoa — sempre visíveis */}
        {pessoas.map(p => (
          <TabsContent key={p.id} value={p.id}>
            <PessoaReport lancamentos={lancamentosPorPessoa[p.id] || []} nome={p.nome} />
          </TabsContent>
        ))}

        {/* Aba Geral */}
        <TabsContent value="geral">
          <PessoaReport lancamentos={lancamentosMes} nome="Todos" />
        </TabsContent>

        {/* Aba Anual */}
        <TabsContent value="anual" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Evolução {ano}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucaoMensal}>
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="bruto" stroke="hsl(217, 91%, 60%)" strokeWidth={2} name="Bruto" />
                  <Line type="monotone" dataKey="liquido" stroke="hsl(142, 71%, 45%)" strokeWidth={2} name="Líquido" />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Despesas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Totais por Mês</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Mês</TableHead>
                      <TableHead className="text-xs text-right">Bruto</TableHead>
                      <TableHead className="text-xs text-right">Líquido</TableHead>
                      <TableHead className="text-xs text-right">Despesas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evolucaoMensal.map((m, i) => (
                      (m.bruto > 0 || m.despesas > 0) && (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{MESES[i]}</TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(m.bruto)}</TableCell>
                          <TableCell className="text-xs text-right text-emerald-600">{formatCurrency(m.liquido)}</TableCell>
                          <TableCell className="text-xs text-right text-destructive">{formatCurrency(m.despesas)}</TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
