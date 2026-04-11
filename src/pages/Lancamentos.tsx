import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { useLancamentos, usePessoas, useCategorias } from '@/hooks/useFinanceData';
import { formatCurrency, formatDate, MESES } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Copy, Check, Search } from 'lucide-react';

const now = new Date();

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-green-100 text-green-800',
  pago: 'bg-blue-100 text-blue-800',
  atrasado: 'bg-red-100 text-red-800',
};

export default function Lancamentos() {
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [pessoaId, setPessoaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();

  const { data: lancamentos = [], isLoading } = useLancamentos(mes, ano, {
    pessoa_id: pessoaId || undefined,
    categoria_id: categoriaId || undefined,
    tipo_lancamento: tipo || undefined,
    status: status || undefined,
    search: search || undefined,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast({ title: 'Excluído!' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('lancamentos').update({
      status: newStatus,
      data_real: newStatus === 'recebido' || newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  };

  const handleDuplicate = async (l: any) => {
    const { error } = await supabase.from('lancamentos').insert({
      user_id: l.user_id,
      pessoa_id: l.pessoa_id,
      categoria_id: l.categoria_id,
      descricao: l.descricao,
      tipo_lancamento: l.tipo_lancamento,
      valor_bruto: l.valor_bruto,
      percentual_dizimo: l.percentual_dizimo,
      percentual_imposto: l.percentual_imposto,
      percentual_gasolina: l.percentual_gasolina,
      aplicar_dizimo: l.aplicar_dizimo,
      aplicar_imposto: l.aplicar_imposto,
      aplicar_gasolina: l.aplicar_gasolina,
      data_prevista: l.data_prevista,
      competencia_mes: l.competencia_mes,
      competencia_ano: l.competencia_ano,
      status: 'pendente',
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast({ title: 'Duplicado!' });
    }
  };

  const totalBruto = lancamentos.filter(l => l.tipo_lancamento === 'receita').reduce((s, l) => s + Number(l.valor_bruto), 0);
  const totalLiquido = lancamentos.filter(l => l.tipo_lancamento === 'receita').reduce((s, l) => s + Number(l.valor_liquido), 0);
  const totalDespesas = lancamentos.filter(l => l.tipo_lancamento === 'despesa').reduce((s, l) => s + Number(l.valor_bruto), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Lançamentos">
        <Link to="/novo"><Button size="sm">+ Novo</Button></Link>
      </PageHeader>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pessoaId} onValueChange={setPessoaId}>
          <SelectTrigger><SelectValue placeholder="Pessoa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-primary/10 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Bruto</p>
          <p className="font-bold text-primary">{formatCurrency(totalBruto)}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Líquido</p>
          <p className="font-bold text-emerald-600">{formatCurrency(totalLiquido)}</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="font-bold text-destructive">{formatCurrency(totalDespesas)}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : lancamentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhum lançamento encontrado</div>
      ) : (
        <div className="space-y-2">
          {lancamentos.map(l => (
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full ${l.tipo_lancamento === 'receita' ? 'bg-emerald-500' : 'bg-destructive'}`} />
                      <span className="font-medium text-sm truncate">{l.descricao}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[l.status] || ''}`}>
                        {l.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{l.pessoas?.nome}</span>
                      <span>•</span>
                      <span style={{ color: l.categorias?.cor || undefined }}>{l.categorias?.nome}</span>
                      <span>•</span>
                      <span>{formatDate(l.data_prevista)}</span>
                    </div>
                    {l.tipo_lancamento === 'receita' && (Number(l.valor_dizimo) > 0 || Number(l.valor_imposto) > 0 || Number(l.valor_gasolina) > 0) && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Bruto: {formatCurrency(Number(l.valor_bruto))}
                        {Number(l.valor_dizimo) > 0 && ` | Dízimo: -${formatCurrency(Number(l.valor_dizimo))}`}
                        {Number(l.valor_imposto) > 0 && ` | Imp: -${formatCurrency(Number(l.valor_imposto))}`}
                        {Number(l.valor_gasolina) > 0 && ` | Gas: -${formatCurrency(Number(l.valor_gasolina))}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${l.tipo_lancamento === 'receita' ? 'text-emerald-600' : 'text-destructive'}`}>
                      {l.tipo_lancamento === 'receita' ? '' : '-'}{formatCurrency(Number(l.tipo_lancamento === 'receita' ? l.valor_liquido : l.valor_bruto))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 justify-end">
                  {l.status === 'pendente' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(l.id, l.tipo_lancamento === 'receita' ? 'recebido' : 'pago')}>
                      <Check className="h-3 w-3 mr-1" />{l.tipo_lancamento === 'receita' ? 'Recebido' : 'Pago'}
                    </Button>
                  )}
                  <Link to={`/novo?edit=${l.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(l)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
