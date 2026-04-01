import { useState } from 'react';
import { useModelosRecorrentes, usePessoas, useCategorias } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Recorrencias() {
  const { user } = useAuth();
  const { data: modelos = [], isLoading } = useModelosRecorrentes();
  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    pessoa_id: '',
    categoria_id: '',
    descricao: '',
    tipo_lancamento: 'receita' as 'receita' | 'despesa',
    modo_valor: 'editavel' as 'fixo' | 'editavel' | 'incremental',
    valor_padrao: 0,
    recorrencia: 'mensal' as string,
    dia_referencia: 1,
    gerar_automaticamente: true,
  });

  const handleCreate = async () => {
    if (!user || !form.pessoa_id || !form.categoria_id || !form.descricao) return;
    const { error } = await supabase.from('modelos_recorrentes').insert({
      user_id: user.id,
      ...form,
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      setShowNew(false);
      toast({ title: 'Modelo criado!' });
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('modelos_recorrentes').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['modelos'] });
  };

  const handleGerarMes = async () => {
    if (!user) return;
    const now = new Date();
    const { error } = await supabase.rpc('gerar_recorrencias_mensais', {
      p_user_id: user.id,
      p_mes: now.getMonth() + 1,
      p_ano: now.getFullYear(),
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      toast({ title: 'Recorrências geradas!' });
    }
  };

  const filteredCats = categorias.filter(c => c.tipo === form.tipo_lancamento);

  const modoLabels: Record<string, string> = { fixo: 'Fixo', editavel: 'Editável', incremental: 'Incremental' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recorrências</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleGerarMes}>Gerar Mês</Button>
          <Button size="sm" onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancelar' : '+ Novo'}</Button>
        </div>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={form.tipo_lancamento === 'receita' ? 'default' : 'outline'} onClick={() => setForm(f => ({ ...f, tipo_lancamento: 'receita' }))}>Receita</Button>
              <Button type="button" variant={form.tipo_lancamento === 'despesa' ? 'default' : 'outline'} onClick={() => setForm(f => ({ ...f, tipo_lancamento: 'despesa' }))}>Despesa</Button>
            </div>
            <div className="space-y-2">
              <Label>Pessoa</Label>
              <Select value={form.pessoa_id} onValueChange={v => setForm(f => ({ ...f, pessoa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria_id} onValueChange={v => setForm(f => ({ ...f, categoria_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{filteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Modo</Label>
              <Select value={form.modo_valor} onValueChange={v => setForm(f => ({ ...f, modo_valor: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="editavel">Editável</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor Padrão</Label>
                <Input type="number" step="0.01" value={form.valor_padrao || ''} onChange={e => setForm(f => ({ ...f, valor_padrao: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Dia Referência</Label>
                <Input type="number" min="1" max="28" value={form.dia_referencia} onChange={e => setForm(f => ({ ...f, dia_referencia: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.gerar_automaticamente} onCheckedChange={v => setForm(f => ({ ...f, gerar_automaticamente: v }))} />
              <Label>Gerar automaticamente</Label>
            </div>
            <Button onClick={handleCreate} className="w-full">Criar Modelo</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : modelos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum modelo recorrente</p>
      ) : (
        <div className="space-y-2">
          {modelos.map((m: any) => (
            <Card key={m.id} className={!m.ativo ? 'opacity-50' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.descricao}</span>
                      <Badge variant="outline" className="text-[10px]">{modoLabels[m.modo_valor]}</Badge>
                      <Badge variant={m.tipo_lancamento === 'receita' ? 'default' : 'destructive'} className="text-[10px]">
                        {m.tipo_lancamento}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {m.pessoas?.nome} • {m.categorias?.nome} • {formatCurrency(Number(m.valor_padrao))} • Dia {m.dia_referencia}
                    </div>
                  </div>
                  <Switch checked={m.ativo} onCheckedChange={() => toggleAtivo(m.id, m.ativo)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
