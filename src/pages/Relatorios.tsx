import { useState, useMemo } from 'react';
import { useLancamentos, useLancamentosAno } from '@/hooks/useFinanceData';
import { formatCurrency, MESES } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const now = new Date();

export default function Relatorios() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const { data: lancamentosMes = [] } = useLancamentos(mes, ano);
  const { data: lancamentosAno = [] } = useLancamentosAno(ano);

  const resumoMensal = useMemo(() => {
    const receitas = lancamentosMes.filter(l => l.tipo_lancamento === 'receita');
    const despesas = lancamentosMes.filter(l => l.tipo_lancamento === 'despesa');
    return {
      bruto: receitas.reduce((s, l) => s + Number(l.valor_bruto), 0),
      dizimo: receitas.reduce((s, l) => s + Number(l.valor_dizimo), 0),
      imposto: receitas.reduce((s, l) => s + Number(l.valor_imposto), 0),
      gasolina: receitas.reduce((s, l) => s + Number(l.valor_gasolina), 0),
      liquido: receitas.reduce((s, l) => s + Number(l.valor_liquido), 0),
      despesas: despesas.reduce((s, l) => s + Number(l.valor_bruto), 0),
    };
  }, [lancamentosMes]);

  const porCategoria = useMemo(() => {
    const cats: Record<string, { nome: string; bruto: number; liquido: number; cor: string }> = {};
    lancamentosMes.filter(l => l.tipo_lancamento === 'receita').forEach(l => {
      const cat = l.categorias;
      if (!cat) return;
      if (!cats[l.categoria_id]) cats[l.categoria_id] = { nome: cat.nome, bruto: 0, liquido: 0, cor: cat.cor || '#888' };
      cats[l.categoria_id].bruto += Number(l.valor_bruto);
      cats[l.categoria_id].liquido += Number(l.valor_liquido);
    });
    return Object.values(cats);
  }, [lancamentosMes]);

  const porPessoa = useMemo(() => {
    const ps: Record<string, { nome: string; bruto: number; liquido: number; despesas: number }> = {};
    lancamentosMes.forEach(l => {
      const p = l.pessoas;
      if (!p) return;
      if (!ps[l.pessoa_id]) ps[l.pessoa_id] = { nome: p.nome, bruto: 0, liquido: 0, despesas: 0 };
      if (l.tipo_lancamento === 'receita') {
        ps[l.pessoa_id].bruto += Number(l.valor_bruto);
        ps[l.pessoa_id].liquido += Number(l.valor_liquido);
      } else {
        ps[l.pessoa_id].despesas += Number(l.valor_bruto);
      }
    });
    return Object.values(ps);
  }, [lancamentosMes]);

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

  // Projeções
  const projecoes = useMemo(() => {
    const receitasPorMes = lancamentosAno.filter(l => l.tipo_lancamento === 'receita');
    const mesesComDados: Record<number, { bruto: number; liquido: number }> = {};
    receitasPorMes.forEach(l => {
      if (!mesesComDados[l.competencia_mes]) mesesComDados[l.competencia_mes] = { bruto: 0, liquido: 0 };
      mesesComDados[l.competencia_mes].bruto += Number(l.valor_bruto);
      mesesComDados[l.competencia_mes].liquido += Number(l.valor_liquido);
    });

    const vals = Object.values(mesesComDados);
    if (vals.length === 0) return null;

    const brutos = vals.map(v => v.bruto);
    const liquidos = vals.map(v => v.liquido);
    const last3b = brutos.slice(-3);
    const last3l = liquidos.slice(-3);

    const media = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = (arr: number[]) => Math.min(...arr);
    const max = (arr: number[]) => Math.max(...arr);

    return {
      conservador: { bruto: min(last3b), liquido: min(last3l) },
      medio: { bruto: media(last3b), liquido: media(last3l) },
      otimista: { bruto: max(brutos), liquido: max(liquidos) },
    };
  }, [lancamentosAno]);

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

      <Tabs defaultValue="mensal">
        <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="mensal">Mensal</TabsTrigger>
          <TabsTrigger value="anual">Anual</TabsTrigger>
          <TabsTrigger value="categoria">Categoria</TabsTrigger>
          <TabsTrigger value="pessoa">Pessoa</TabsTrigger>
          <TabsTrigger value="descontos">Descontos</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo {MESES[mes - 1]} {ano}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Bruto:</span> <span className="font-bold">{formatCurrency(resumoMensal.bruto)}</span></div>
                <div><span className="text-muted-foreground">Líquido:</span> <span className="font-bold text-emerald-600">{formatCurrency(resumoMensal.liquido)}</span></div>
                <div><span className="text-muted-foreground">Dízimo:</span> <span className="font-bold">{formatCurrency(resumoMensal.dizimo)}</span></div>
                <div><span className="text-muted-foreground">Imposto:</span> <span className="font-bold">{formatCurrency(resumoMensal.imposto)}</span></div>
                <div><span className="text-muted-foreground">Gasolina:</span> <span className="font-bold">{formatCurrency(resumoMensal.gasolina)}</span></div>
                <div><span className="text-muted-foreground">Despesas:</span> <span className="font-bold text-destructive">{formatCurrency(resumoMensal.despesas)}</span></div>
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-muted-foreground">Saldo Final:</span>{' '}
                  <span className={`font-bold text-lg ${resumoMensal.liquido - resumoMensal.despesas >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {formatCurrency(resumoMensal.liquido - resumoMensal.despesas)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Evolução {ano}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolucaoMensal}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="bruto" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="liquido" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categoria" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Receitas por Categoria</CardTitle></CardHeader>
            <CardContent>
              {porCategoria.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={porCategoria}>
                      <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="bruto" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="liquido" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {porCategoria.map(c => (
                        <TableRow key={c.nome}>
                          <TableCell style={{ color: c.cor }}>{c.nome}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.bruto)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.liquido)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pessoa" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Por Pessoa</CardTitle></CardHeader>
            <CardContent>
              {porPessoa.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pessoa</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porPessoa.map(p => (
                      <TableRow key={p.nome}>
                        <TableCell>{p.nome}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.bruto)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.liquido)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(p.despesas)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descontos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Descontos do Mês</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { tipo: 'Dízimo', valor: resumoMensal.dizimo },
                  { tipo: 'Imposto', valor: resumoMensal.imposto },
                  { tipo: 'Gasolina', valor: resumoMensal.gasolina },
                ]}>
                  <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="valor" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">Total descontos</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(resumoMensal.dizimo + resumoMensal.imposto + resumoMensal.gasolina)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecoes" className="space-y-4">
          {projecoes ? (
            <div className="grid gap-3">
              {[
                { label: 'Conservador', data: projecoes.conservador, color: 'text-amber-600' },
                { label: 'Médio', data: projecoes.medio, color: 'text-primary' },
                { label: 'Otimista', data: projecoes.otimista, color: 'text-emerald-600' },
              ].map(c => (
                <Card key={c.label}>
                  <CardContent className="p-4">
                    <p className={`font-semibold ${c.color} mb-2`}>{c.label}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Bruto:</span> {formatCurrency(c.data.bruto)}</div>
                      <div><span className="text-muted-foreground">Líquido:</span> {formatCurrency(c.data.liquido)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados suficientes para projeções</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
