import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePessoas, useCategorias, useRegras } from '@/hooks/useFinanceData';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calcularDescontos } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';

interface LancamentoForm {
  pessoa_id: string;
  categoria_id: string;
  descricao: string;
  tipo_lancamento: 'receita' | 'despesa';
  valor_bruto: number;
  percentual_dizimo: number;
  percentual_imposto: number;
  percentual_gasolina: number;
  aplicar_dizimo: boolean;
  aplicar_imposto: boolean;
  aplicar_gasolina: boolean;
  data_prevista: string;
  data_real: string;
  status: string;
  observacoes: string;
}

const defaultForm: LancamentoForm = {
  pessoa_id: '',
  categoria_id: '',
  descricao: '',
  tipo_lancamento: 'receita',
  valor_bruto: 0,
  percentual_dizimo: 0,
  percentual_imposto: 0,
  percentual_gasolina: 0,
  aplicar_dizimo: false,
  aplicar_imposto: false,
  aplicar_gasolina: false,
  data_prevista: new Date().toISOString().split('T')[0],
  data_real: '',
  status: 'pendente',
  observacoes: '',
};

export default function NovoLancamento() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pessoas = [] } = usePessoas();
  const { data: todasCategorias = [] } = useCategorias();
  const { data: regras = [] } = useRegras();
  const [form, setForm] = useState<LancamentoForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const categorias = todasCategorias.filter(c => c.tipo === form.tipo_lancamento);

  // Initialize from URL params
  useEffect(() => {
    const tipo = searchParams.get('tipo') as 'receita' | 'despesa' | null;
    const categoriaId = searchParams.get('categoria_id');
    const edit = searchParams.get('edit');

    if (tipo) setForm(f => ({ ...f, tipo_lancamento: tipo }));
    if (categoriaId) setForm(f => ({ ...f, categoria_id: categoriaId }));

    if (edit) {
      setEditId(edit);
      supabase.from('lancamentos').select('*').eq('id', edit).single().then(({ data }) => {
        if (data) {
          setForm({
            pessoa_id: data.pessoa_id,
            categoria_id: data.categoria_id,
            descricao: data.descricao,
            tipo_lancamento: data.tipo_lancamento as 'receita' | 'despesa',
            valor_bruto: Number(data.valor_bruto),
            percentual_dizimo: Number(data.percentual_dizimo),
            percentual_imposto: Number(data.percentual_imposto),
            percentual_gasolina: Number(data.percentual_gasolina),
            aplicar_dizimo: data.aplicar_dizimo,
            aplicar_imposto: data.aplicar_imposto,
            aplicar_gasolina: data.aplicar_gasolina,
            data_prevista: data.data_prevista || '',
            data_real: data.data_real || '',
            status: data.status,
            observacoes: data.observacoes || '',
          });
        }
      });
    }
  }, [searchParams]);

  // Auto-fill percentages from regras when category changes
  useEffect(() => {
    if (!form.categoria_id || form.tipo_lancamento !== 'receita' || editId) return;
    const regra = regras.find(r =>
      r.categoria_id === form.categoria_id &&
      (form.pessoa_id ? r.pessoa_id === form.pessoa_id || !r.pessoa_id : !r.pessoa_id)
    );
    if (regra) {
      setForm(f => ({
        ...f,
        percentual_dizimo: Number(regra.percentual_dizimo),
        percentual_imposto: Number(regra.percentual_imposto),
        percentual_gasolina: Number(regra.percentual_gasolina),
        aplicar_dizimo: regra.aplicar_dizimo,
        aplicar_imposto: regra.aplicar_imposto,
        aplicar_gasolina: regra.aplicar_gasolina,
      }));
    }
  }, [form.categoria_id, form.pessoa_id, regras, editId]);

  // Auto-fill description from category name
  useEffect(() => {
    if (!form.categoria_id || editId) return;
    const cat = todasCategorias.find(c => c.id === form.categoria_id);
    if (cat && !form.descricao) {
      setForm(f => ({ ...f, descricao: cat.nome }));
    }
  }, [form.categoria_id, todasCategorias, editId]);

  const preview = useMemo(() => calcularDescontos(
    form.valor_bruto,
    form.percentual_dizimo,
    form.percentual_imposto,
    form.percentual_gasolina,
    form.aplicar_dizimo,
    form.aplicar_imposto,
    form.aplicar_gasolina,
  ), [form.valor_bruto, form.percentual_dizimo, form.percentual_imposto, form.percentual_gasolina, form.aplicar_dizimo, form.aplicar_imposto, form.aplicar_gasolina]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const now = new Date(form.data_prevista || new Date());
    const payload = {
      user_id: user.id,
      pessoa_id: form.pessoa_id,
      categoria_id: form.categoria_id,
      descricao: form.descricao,
      tipo_lancamento: form.tipo_lancamento,
      valor_bruto: form.valor_bruto,
      percentual_dizimo: form.percentual_dizimo,
      percentual_imposto: form.percentual_imposto,
      percentual_gasolina: form.percentual_gasolina,
      aplicar_dizimo: form.aplicar_dizimo,
      aplicar_imposto: form.aplicar_imposto,
      aplicar_gasolina: form.aplicar_gasolina,
      data_prevista: form.data_prevista || null,
      data_real: form.data_real || null,
      competencia_mes: now.getMonth() + 1,
      competencia_ano: now.getFullYear(),
      status: form.status,
      observacoes: form.observacoes || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('lancamentos').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('lancamentos').insert(payload));
    }

    setSubmitting(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos-ano'] });
      toast({ title: editId ? 'Atualizado!' : 'Salvo!' });
      navigate('/lancamentos');
    }
  };

  const update = (field: keyof LancamentoForm, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader title={editId ? 'Editar Lançamento' : 'Novo Lançamento'} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={form.tipo_lancamento === 'receita' ? 'default' : 'outline'} onClick={() => update('tipo_lancamento', 'receita')}>
            Receita
          </Button>
          <Button type="button" variant={form.tipo_lancamento === 'despesa' ? 'default' : 'outline'} onClick={() => update('tipo_lancamento', 'despesa')}>
            Despesa
          </Button>
        </div>

        {/* Pessoa */}
        <div className="space-y-2">
          <Label>Pessoa</Label>
          <Select value={form.pessoa_id} onValueChange={v => update('pessoa_id', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {pessoas.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={form.categoria_id} onValueChange={v => update('categoria_id', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input value={form.descricao} onChange={e => update('descricao', e.target.value)} required />
        </div>

        {/* Valor bruto */}
        <div className="space-y-2">
          <Label>Valor Bruto (R$)</Label>
          <Input type="number" step="0.01" min="0" value={form.valor_bruto || ''} onChange={e => update('valor_bruto', parseFloat(e.target.value) || 0)} required />
        </div>

        {/* Descontos (only for receita) */}
        {form.tipo_lancamento === 'receita' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Descontos Automáticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dízimo */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Switch checked={form.aplicar_dizimo} onCheckedChange={v => update('aplicar_dizimo', v)} />
                  <span className="text-sm font-medium">Dízimo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.1" min="0" max="100" className="w-20 text-right" value={form.percentual_dizimo} onChange={e => update('percentual_dizimo', parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <span className="text-sm font-semibold text-destructive w-24 text-right">
                  -{formatCurrency(preview.valorDizimo)}
                </span>
              </div>
              {/* Imposto */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Switch checked={form.aplicar_imposto} onCheckedChange={v => update('aplicar_imposto', v)} />
                  <span className="text-sm font-medium">Imposto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.1" min="0" max="100" className="w-20 text-right" value={form.percentual_imposto} onChange={e => update('percentual_imposto', parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <span className="text-sm font-semibold text-destructive w-24 text-right">
                  -{formatCurrency(preview.valorImposto)}
                </span>
              </div>
              {/* Gasolina */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Switch checked={form.aplicar_gasolina} onCheckedChange={v => update('aplicar_gasolina', v)} />
                  <span className="text-sm font-medium">Gasolina</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.1" min="0" max="100" className="w-20 text-right" value={form.percentual_gasolina} onChange={e => update('percentual_gasolina', parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <span className="text-sm font-semibold text-destructive w-24 text-right">
                  -{formatCurrency(preview.valorGasolina)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valor líquido */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor Líquido</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(form.tipo_lancamento === 'receita' ? preview.valorLiquido : form.valor_bruto)}
            </p>
          </CardContent>
        </Card>

        {/* Datas e status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Prevista</Label>
            <Input type="date" value={form.data_prevista} onChange={e => update('data_prevista', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data Real</Label>
            <Input type="date" value={form.data_real} onChange={e => update('data_real', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => update('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={form.observacoes} onChange={e => update('observacoes', e.target.value)} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !form.pessoa_id || !form.categoria_id}>
          {submitting ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
