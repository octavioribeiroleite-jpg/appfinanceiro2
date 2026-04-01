import { useState } from 'react';
import { usePessoas, useCategorias } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function Configuracoes() {
  const { user } = useAuth();
  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Atalhos
  const { data: atalhos = [] } = useQuery({
    queryKey: ['atalhos-all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atalhos_rapidos')
        .select('*, categorias(*), pessoas(*)')
        .order('ordem');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const categoriasReceita = categorias.filter(c => c.tipo === 'receita');

  const [novaPessoa, setNovaPessoa] = useState({ nome: '', tipo: 'outro' });
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', tipo: 'despesa', cor: '#6b7280', icone: 'circle' });
  const [novoAtalho, setNovoAtalho] = useState({ nome: '', categoria_id: '', pessoa_id: '', valor_padrao: 0, cor: '#3B82F6', icone: 'zap' });
  const [editAtalhoId, setEditAtalhoId] = useState<string | null>(null);

  const handleAddPessoa = async () => {
    if (!user || !novaPessoa.nome) return;
    const { error } = await supabase.from('pessoas').insert({ user_id: user.id, ...novaPessoa });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['pessoas'] });
      setNovaPessoa({ nome: '', tipo: 'outro' });
      toast({ title: 'Pessoa adicionada!' });
    }
  };

  const handleAddCategoria = async () => {
    if (!user || !novaCategoria.nome) return;
    const { error } = await supabase.from('categorias').insert({ user_id: user.id, ...novaCategoria });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setNovaCategoria({ nome: '', tipo: 'despesa', cor: '#6b7280', icone: 'circle' });
      toast({ title: 'Categoria adicionada!' });
    }
  };

  const handleSaveAtalho = async () => {
    if (!user || !novoAtalho.nome || !novoAtalho.categoria_id) return;
    const payload = {
      user_id: user.id,
      nome: novoAtalho.nome,
      categoria_id: novoAtalho.categoria_id,
      pessoa_id: novoAtalho.pessoa_id || null,
      valor_padrao: novoAtalho.valor_padrao,
      cor: novoAtalho.cor,
      icone: novoAtalho.icone,
      ordem: atalhos.length,
    };

    let error;
    if (editAtalhoId) {
      ({ error } = await supabase.from('atalhos_rapidos').update(payload).eq('id', editAtalhoId));
    } else {
      ({ error } = await supabase.from('atalhos_rapidos').insert(payload));
    }

    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['atalhos'] });
      queryClient.invalidateQueries({ queryKey: ['atalhos-all'] });
      setNovoAtalho({ nome: '', categoria_id: '', pessoa_id: '', valor_padrao: 0, cor: '#3B82F6', icone: 'zap' });
      setEditAtalhoId(null);
      toast({ title: editAtalhoId ? 'Atalho atualizado!' : 'Atalho adicionado!' });
    }
  };

  const startEditAtalho = (a: typeof atalhos[0]) => {
    setEditAtalhoId(a.id);
    setNovoAtalho({
      nome: a.nome,
      categoria_id: a.categoria_id,
      pessoa_id: a.pessoa_id || '',
      valor_padrao: Number(a.valor_padrao),
      cor: a.cor || '#3B82F6',
      icone: a.icone || 'zap',
    });
  };

  const deleteAtalho = async (id: string) => {
    await supabase.from('atalhos_rapidos').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['atalhos'] });
    queryClient.invalidateQueries({ queryKey: ['atalhos-all'] });
    toast({ title: 'Atalho removido' });
  };

  const toggleAtalho = async (id: string, ativo: boolean) => {
    await supabase.from('atalhos_rapidos').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['atalhos'] });
    queryClient.invalidateQueries({ queryKey: ['atalhos-all'] });
  };

  const togglePessoa = async (id: string, ativo: boolean) => {
    await supabase.from('pessoas').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['pessoas'] });
  };

  const toggleCategoria = async (id: string, ativo: boolean) => {
    await supabase.from('categorias').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
  };

  const ICONES = [
    { value: 'zap', label: '⚡ Geral' },
    { value: 'activity', label: '💉 Radial' },
    { value: 'heart', label: '❤️ Eletro' },
    { value: 'dumbbell', label: '💪 Personal' },
    { value: 'shopping-bag', label: '📊 Vendas' },
    { value: 'receipt', label: '💼 Consultoria' },
    { value: 'fuel', label: '🚗 Gasolina' },
    { value: 'church', label: '⛪ Igreja' },
    { value: 'briefcase', label: '💰 Dinheiro' },
    { value: 'star', label: '⭐ Outros' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="atalhos">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="atalhos">Atalhos</TabsTrigger>
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

        {/* ATALHOS TAB */}
        <TabsContent value="atalhos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{editAtalhoId ? 'Editar Atalho' : 'Novo Atalho Rápido'}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Eletro Centro"
                  value={novoAtalho.nome}
                  onChange={e => setNovoAtalho(f => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0 = preencher manual"
                  value={novoAtalho.valor_padrao || ''}
                  onChange={e => setNovoAtalho(f => ({ ...f, valor_padrao: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria (setor)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categoriasReceita.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNovoAtalho(f => ({ ...f, categoria_id: c.id }))}
                      className={`flex items-center gap-2 rounded-lg border-2 p-2.5 text-sm font-medium transition-all ${
                        novoAtalho.categoria_id === c.id
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div
                        className="h-5 w-5 rounded-full shrink-0"
                        style={{ backgroundColor: c.cor || '#888' }}
                      />
                      <span className="truncate">{c.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pessoa (opcional)</Label>
                <Select value={novoAtalho.pessoa_id} onValueChange={v => setNovoAtalho(f => ({ ...f, pessoa_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {pessoas.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cor do botão</Label>
                  <Input type="color" value={novoAtalho.cor} onChange={e => setNovoAtalho(f => ({ ...f, cor: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={novoAtalho.icone} onValueChange={v => setNovoAtalho(f => ({ ...f, icone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICONES.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAtalho} className="flex-1">
                  {editAtalhoId ? 'Salvar' : 'Adicionar'}
                </Button>
                {editAtalhoId && (
                  <Button variant="outline" onClick={() => {
                    setEditAtalhoId(null);
                    setNovoAtalho({ nome: '', categoria_id: '', pessoa_id: '', valor_padrao: 0, cor: '#3B82F6', icone: 'zap' });
                  }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista agrupada por categoria */}
          {(() => {
            const grouped: Record<string, typeof atalhos> = {};
            atalhos.forEach(a => {
              const catNome = a.categorias?.nome || 'Sem categoria';
              if (!grouped[catNome]) grouped[catNome] = [];
              grouped[catNome].push(a);
            });
            return Object.entries(grouped).map(([catNome, items]) => (
              <div key={catNome} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: items[0]?.categorias?.cor || '#888' }}
                  />
                  <h3 className="text-sm font-semibold text-muted-foreground">{catNome}</h3>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
                {items.map(a => (
                  <Card key={a.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center" style={{ backgroundColor: a.cor || '#3B82F6' }}>
                          <span className="text-white text-xs">
                            {ICONES.find(i => i.value === a.icone)?.label.split(' ')[0] || '⚡'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{a.nome}</p>
                          <div className="flex items-center gap-1">
                            {Number(a.valor_padrao) > 0 && (
                              <span className="text-[10px] text-muted-foreground">{formatCurrency(Number(a.valor_padrao))}</span>
                            )}
                            {!Number(a.valor_padrao) && (
                              <span className="text-[10px] text-muted-foreground">Valor manual</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditAtalho(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteAtalho(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Switch checked={a.ativo} onCheckedChange={() => toggleAtalho(a.id, a.ativo)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ));
          })()}
        </TabsContent>

        {/* PESSOAS TAB */}
        <TabsContent value="pessoas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nova Pessoa</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={novaPessoa.nome} onChange={e => setNovaPessoa(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={novaPessoa.tipo} onValueChange={v => setNovaPessoa(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="octavio">Octávio</SelectItem>
                    <SelectItem value="esposa">Esposa</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPessoa} className="w-full">Adicionar</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {pessoas.map(p => (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{p.nome}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{p.tipo}</Badge>
                  </div>
                  <Switch checked={p.ativo} onCheckedChange={() => togglePessoa(p.id, p.ativo)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CATEGORIAS TAB */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Nova Categoria</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={novaCategoria.nome} onChange={e => setNovaCategoria(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={novaCategoria.tipo} onValueChange={v => setNovaCategoria(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Input type="color" value={novaCategoria.cor} onChange={e => setNovaCategoria(f => ({ ...f, cor: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleAddCategoria} className="w-full">Adicionar</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {categorias.map(c => (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.cor || '#888' }} />
                    <span className="font-medium">{c.nome}</span>
                    <Badge variant="outline" className="text-[10px]">{c.tipo}</Badge>
                  </div>
                  <Switch checked={c.ativo} onCheckedChange={() => toggleCategoria(c.id, c.ativo)} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
