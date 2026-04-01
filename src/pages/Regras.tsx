import { useState } from 'react';
import { useRegras, useCategorias, usePessoas } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Regras() {
  const { user } = useAuth();
  const { data: regras = [], isLoading } = useRegras();
  const { data: categoriasReceita = [] } = useCategorias('receita');
  const { data: pessoas = [] } = usePessoas();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [showNew, setShowNew] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [criarNovaCategoria, setCriarNovaCategoria] = useState(false);
  const [newForm, setNewForm] = useState({
    categoria_id: '',
    pessoa_id: '',
    percentual_dizimo: 10,
    percentual_imposto: 7,
    percentual_gasolina: 5,
    aplicar_dizimo: true,
    aplicar_imposto: true,
    aplicar_gasolina: true,
  });

  const handleSave = async (id: string, categoriaId?: string) => {
    // Update category name if changed
    if (form.nome_categoria && categoriaId) {
      const { error: catError } = await supabase.from('categorias').update({ nome: form.nome_categoria }).eq('id', categoriaId);
      if (catError) {
        toast({ title: 'Erro ao salvar nome', description: catError.message, variant: 'destructive' });
        return;
      }
    }
    const { nome_categoria, ...regraFields } = form;
    const { error } = await supabase.from('regras_categoria').update(regraFields).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    // Recalculate all lancamentos with this categoria_id
    if (categoriaId) {
      let query = supabase
        .from('lancamentos')
        .select('id, valor_bruto')
        .eq('categoria_id', categoriaId)
        .eq('tipo_lancamento', 'receita');

      // Find the regra to check if it's pessoa-specific
      const regra = regras.find((r: any) => r.id === id);
      if (regra?.pessoa_id) {
        query = query.eq('pessoa_id', regra.pessoa_id);
      }

      const { data: lancs } = await query;
      if (lancs && lancs.length > 0) {
        const pDizimo = regraFields.percentual_dizimo ?? form.percentual_dizimo;
        const pImposto = regraFields.percentual_imposto ?? form.percentual_imposto;
        const pGasolina = regraFields.percentual_gasolina ?? form.percentual_gasolina;
        const aDizimo = regraFields.aplicar_dizimo ?? form.aplicar_dizimo;
        const aImposto = regraFields.aplicar_imposto ?? form.aplicar_imposto;
        const aGasolina = regraFields.aplicar_gasolina ?? form.aplicar_gasolina;

        const updates = lancs.map((l: any) => {
          const vd = aDizimo ? Math.round(l.valor_bruto * pDizimo) / 100 : 0;
          const vi = aImposto ? Math.round(l.valor_bruto * pImposto) / 100 : 0;
          const vg = aGasolina ? Math.round(l.valor_bruto * pGasolina) / 100 : 0;
          return supabase.from('lancamentos').update({
            percentual_dizimo: pDizimo,
            percentual_imposto: pImposto,
            percentual_gasolina: pGasolina,
            aplicar_dizimo: aDizimo,
            aplicar_imposto: aImposto,
            aplicar_gasolina: aGasolina,
            valor_dizimo: vd,
            valor_imposto: vi,
            valor_gasolina: vg,
            valor_liquido: l.valor_bruto - vd - vi - vg,
          }).eq('id', l.id);
        });
        await Promise.all(updates);
        toast({ title: 'Salvo!', description: `${lancs.length} lançamento(s) recalculado(s)` });
      } else {
        toast({ title: 'Salvo!' });
      }
    } else {
      toast({ title: 'Salvo!' });
    }

    queryClient.invalidateQueries({ queryKey: ['regras'] });
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
    queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    queryClient.invalidateQueries({ queryKey: ['lancamentos-ano'] });
    setEditing(null);
  };

  const handleCreate = async () => {
    if (!user) return;

    let categoriaId = newForm.categoria_id;

    // Create new category if needed
    if (criarNovaCategoria) {
      if (!novaCategoriaNome.trim()) {
        toast({ title: 'Erro', description: 'Digite o nome da nova categoria', variant: 'destructive' });
        return;
      }
      const { data: novaCat, error: catError } = await supabase.from('categorias').insert({
        user_id: user.id,
        nome: novaCategoriaNome.trim(),
        tipo: 'receita',
      }).select().single();
      if (catError) {
        toast({ title: 'Erro ao criar categoria', description: catError.message, variant: 'destructive' });
        return;
      }
      categoriaId = novaCat.id;
    }

    if (!categoriaId) {
      toast({ title: 'Erro', description: 'Selecione ou crie uma categoria', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('regras_categoria').insert({
      user_id: user.id,
      ...newForm,
      categoria_id: categoriaId,
      pessoa_id: newForm.pessoa_id || null,
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['regras'] });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setShowNew(false);
      setCriarNovaCategoria(false);
      setNovaCategoriaNome('');
      toast({ title: 'Regra criada!' });
    }
  };

  const previewCalc = (bruto: number, perc: number, ativo: boolean) => ativo ? bruto * perc / 100 : 0;

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta regra?')) return;
    const { error } = await supabase.from('regras_categoria').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      queryClient.invalidateQueries({ queryKey: ['regras'] });
      toast({ title: 'Regra excluída!' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Regras Automáticas</h1>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancelar' : '+ Nova'}</Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex items-center gap-2 mb-1">
                <Button
                  type="button" variant={criarNovaCategoria ? 'default' : 'outline'} size="sm"
                  onClick={() => setCriarNovaCategoria(!criarNovaCategoria)}
                >
                  {criarNovaCategoria ? 'Selecionar existente' : '+ Nova categoria'}
                </Button>
              </div>
              {criarNovaCategoria ? (
                <Input
                  placeholder="Nome da nova fonte de renda"
                  value={novaCategoriaNome}
                  onChange={e => setNovaCategoriaNome(e.target.value)}
                />
              ) : (
                <Select value={newForm.categoria_id} onValueChange={v => setNewForm(f => ({ ...f, categoria_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categoriasReceita.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Pessoa (opcional - global se vazio)</Label>
              <Select value={newForm.pessoa_id} onValueChange={v => setNewForm(f => ({ ...f, pessoa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  {pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Dízimo', key: 'dizimo' },
                { label: 'Imposto', key: 'imposto' },
                { label: 'Gasolina', key: 'gasolina' },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(newForm as any)[`aplicar_${item.key}`]}
                      onCheckedChange={v => setNewForm(f => ({ ...f, [`aplicar_${item.key}`]: v }))}
                    />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <Input
                    type="number" step="0.1" className="text-sm"
                    value={(newForm as any)[`percentual_${item.key}`]}
                    onChange={e => setNewForm(f => ({ ...f, [`percentual_${item.key}`]: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="text-xs text-muted-foreground mb-1">Preview com R$ 1.000,00:</p>
              <p>Dízimo: {formatCurrency(previewCalc(1000, newForm.percentual_dizimo, newForm.aplicar_dizimo))}</p>
              <p>Imposto: {formatCurrency(previewCalc(1000, newForm.percentual_imposto, newForm.aplicar_imposto))}</p>
              <p>Gasolina: {formatCurrency(previewCalc(1000, newForm.percentual_gasolina, newForm.aplicar_gasolina))}</p>
              <p className="font-bold mt-1">
                Líquido: {formatCurrency(1000 - previewCalc(1000, newForm.percentual_dizimo, newForm.aplicar_dizimo) - previewCalc(1000, newForm.percentual_imposto, newForm.aplicar_imposto) - previewCalc(1000, newForm.percentual_gasolina, newForm.aplicar_gasolina))}
              </p>
            </div>
            <Button onClick={handleCreate} className="w-full">Criar Regra</Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : regras.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhuma regra cadastrada</p>
      ) : (
        <div className="space-y-2">
          {regras.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium" style={{ color: r.categorias?.cor || undefined }}>
                      {r.categorias?.nome}
                    </span>
                    {r.pessoas && <span className="text-xs text-muted-foreground ml-2">({r.pessoas.nome})</span>}
                    {!r.pessoas && <span className="text-xs text-muted-foreground ml-2">(Global)</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (editing === r.id) { setEditing(null); } else {
                        setEditing(r.id);
                        setForm({
                          nome_categoria: r.categorias?.nome || '',
                          percentual_dizimo: r.percentual_dizimo,
                          percentual_imposto: r.percentual_imposto,
                          percentual_gasolina: r.percentual_gasolina,
                          aplicar_dizimo: r.aplicar_dizimo,
                          aplicar_imposto: r.aplicar_imposto,
                          aplicar_gasolina: r.aplicar_gasolina,
                        });
                      }
                    }}>
                      {editing === r.id ? 'Cancelar' : 'Editar'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {editing === r.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={form.nome_categoria || ''} onChange={e => setForm((f: any) => ({ ...f, nome_categoria: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['dizimo', 'imposto', 'gasolina'].map(key => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch checked={form[`aplicar_${key}`]} onCheckedChange={v => setForm((f: any) => ({ ...f, [`aplicar_${key}`]: v }))} />
                            <span className="text-xs capitalize">{key}</span>
                          </div>
                          <Input
                            type="number"
                            step="0.1"
                            value={form[`percentual_${key}`] ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              setForm((f: any) => ({ ...f, [`percentual_${key}`]: val === '' ? 0 : parseFloat(val) }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <Button size="sm" onClick={() => handleSave(r.id, r.categoria_id)}>Salvar</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Dízimo:</span> {r.aplicar_dizimo ? `${r.percentual_dizimo}%` : 'Off'}</div>
                    <div><span className="text-muted-foreground">Imposto:</span> {r.aplicar_imposto ? `${r.percentual_imposto}%` : 'Off'}</div>
                    <div><span className="text-muted-foreground">Gasolina:</span> {r.aplicar_gasolina ? `${r.percentual_gasolina}%` : 'Off'}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
