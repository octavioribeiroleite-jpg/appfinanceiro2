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
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Configuracoes() {
  const { user } = useAuth();
  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [novaPessoa, setNovaPessoa] = useState({ nome: '', tipo: 'outro' });
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', tipo: 'despesa', cor: '#6b7280', icone: 'circle' });

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

  const togglePessoa = async (id: string, ativo: boolean) => {
    await supabase.from('pessoas').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['pessoas'] });
  };

  const toggleCategoria = async (id: string, ativo: boolean) => {
    await supabase.from('categorias').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['categorias'] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="pessoas">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
        </TabsList>

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
