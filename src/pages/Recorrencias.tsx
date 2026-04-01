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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, User, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Recorrencias() {
  const { user } = useAuth();
  const { data: modelos = [], isLoading } = useModelosRecorrentes();
  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    pessoa_id: '',
    categoria_id: '',
    descricao: '',
    tipo_lancamento: 'receita' as string,
    modo_valor: 'editavel' as string,
    valor_padrao: 0,
    recorrencia: 'mensal' as string,
    dia_referencia: 1,
    gerar_automaticamente: true,
  });
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

  const startEdit = (m: any) => {
    setEditId(m.id);
    setEditForm({
      pessoa_id: m.pessoa_id,
      categoria_id: m.categoria_id,
      descricao: m.descricao,
      tipo_lancamento: m.tipo_lancamento,
      modo_valor: m.modo_valor,
      valor_padrao: Number(m.valor_padrao),
      recorrencia: m.recorrencia,
      dia_referencia: m.dia_referencia || 1,
      gerar_automaticamente: m.gerar_automaticamente,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const { error } = await supabase.from('modelos_recorrentes').update({
      pessoa_id: editForm.pessoa_id,
      categoria_id: editForm.categoria_id,
      descricao: editForm.descricao,
      tipo_lancamento: editForm.tipo_lancamento,
      modo_valor: editForm.modo_valor,
      valor_padrao: editForm.valor_padrao,
      recorrencia: editForm.recorrencia,
      dia_referencia: editForm.dia_referencia,
      gerar_automaticamente: editForm.gerar_automaticamente,
    }).eq('id', editId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['modelos'] });
      setEditDialogOpen(false);
      toast({ title: 'Recorrência atualizada!' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('modelos_recorrentes').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['modelos'] });
    toast({ title: 'Recorrência removida' });
  };

  const filteredCats = categorias.filter(c => c.tipo === form.tipo_lancamento);
  const editFilteredCats = categorias.filter(c => c.tipo === editForm.tipo_lancamento);

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
                <Label>Dia Pagamento</Label>
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
        <div className="space-y-6">
          {pessoas.map(pessoa => {
            const pessoaModelos = modelos.filter((m: any) => m.pessoa_id === pessoa.id);
            if (pessoaModelos.length === 0) return null;
            return (
              <div key={pessoa.id} className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">{pessoa.nome}</span>
                  <span className="text-xs text-muted-foreground">({pessoaModelos.length})</span>
                </div>
                {pessoaModelos.map((m: any) => (
                  <Card key={m.id} className={!m.ativo ? 'opacity-50' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{m.descricao}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">{modoLabels[m.modo_valor]}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {m.categorias?.nome} • {formatCurrency(Number(m.valor_padrao))} • Dia {m.dia_referencia}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Switch checked={m.ativo} onCheckedChange={() => toggleAtivo(m.id, m.ativo)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Recorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={editForm.valor_padrao || ''} onChange={e => setEditForm(f => ({ ...f, valor_padrao: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Dia Pagamento</Label>
                <Input type="number" min="1" max="28" value={editForm.dia_referencia} onChange={e => setEditForm(f => ({ ...f, dia_referencia: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pessoa</Label>
              <Select value={editForm.pessoa_id} onValueChange={v => setEditForm(f => ({ ...f, pessoa_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editForm.categoria_id} onValueChange={v => setEditForm(f => ({ ...f, categoria_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{editFilteredCats.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modo</Label>
              <Select value={editForm.modo_valor} onValueChange={v => setEditForm(f => ({ ...f, modo_valor: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="editavel">Editável</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.gerar_automaticamente} onCheckedChange={v => setEditForm(f => ({ ...f, gerar_automaticamente: v }))} />
              <Label>Gerar automaticamente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditSave} className="w-full">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
