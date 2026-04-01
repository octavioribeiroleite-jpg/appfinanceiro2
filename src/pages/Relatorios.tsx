import { useState, useMemo } from 'react';
import { useLancamentos, useLancamentosAno, usePessoas } from '@/hooks/useFinanceData';
import { formatCurrency, MESES } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Wallet, Church, Receipt, Fuel, TrendingDown, ChevronDown } from 'lucide-react';

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
  const porCategoria: Record<string, { nome: string; bruto: number; liquido: number; dizimo: number; imposto: number; gasolina: number; cor: string; total: number; recebidos: number; lancamentos: any[] }> = {};
  receitas.forEach(l => {
    const cat = l.categorias;
    if (!cat) return;
    if (!porCategoria[l.categoria_id]) porCategoria[l.categoria_id] = { nome: cat.nome, bruto: 0, liquido: 0, dizimo: 0, imposto: 0, gasolina: 0, cor: cat.cor || '#888', total: 0, recebidos: 0, lancamentos: [] };
    porCategoria[l.categoria_id].bruto += Number(l.valor_bruto);
    porCategoria[l.categoria_id].liquido += Number(l.valor_liquido);
    porCategoria[l.categoria_id].dizimo += Number(l.valor_dizimo);
    porCategoria[l.categoria_id].imposto += Number(l.valor_imposto);
    porCategoria[l.categoria_id].gasolina += Number(l.valor_gasolina);
    porCategoria[l.categoria_id].total += 1;
    if (l.status === 'recebido') porCategoria[l.categoria_id].recebidos += 1;
    porCategoria[l.categoria_id].lancamentos.push(l);
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

      {/* Caixinhas por categoria */}
      {cats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Fontes de Renda</h3>
          {cats.map(c => (
            <Collapsible key={c.nome}>
              <Card>
                <CollapsibleTrigger className="w-full text-left">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                        <span className="text-sm font-semibold">{c.nome}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Bruto</span>
                      <span className="text-sm font-bold">{formatCurrency(c.bruto)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Líquido</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(c.liquido)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                      {c.dizimo > 0 && <span>Dízimo: <span className="text-red-500 font-medium">{formatCurrency(c.dizimo)}</span></span>}
                      {c.imposto > 0 && <span>Imposto: <span className="text-rose-600 font-medium">{formatCurrency(c.imposto)}</span></span>}
                      {c.gasolina > 0 && <span>Gasolina: <span className="text-amber-500 font-medium">{formatCurrency(c.gasolina)}</span></span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {c.total} lançamentos · <span className="text-emerald-600 font-medium">{c.recebidos} recebidos</span>
                    </p>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-4 pb-3 pt-2 space-y-1.5">
                    {c.lancamentos.sort((a: any, b: any) => (a.descricao || '').localeCompare(b.descricao || '')).map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                        <span className="truncate mr-2">{l.descricao}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-medium">{formatCurrency(Number(l.valor_bruto))}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${l.status === 'recebido' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {l.status === 'recebido' ? '✅' : '⏳'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
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
