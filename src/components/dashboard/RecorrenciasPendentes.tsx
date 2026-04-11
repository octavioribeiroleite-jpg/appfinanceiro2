import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, calcularDescontos } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Check, ChevronDown, ChevronUp, User, Pencil, Undo2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Modelo {
  id: string;
  descricao: string;
  valor_padrao: number;
  modo_valor: string;
  categoria_id: string;
  pessoa_id: string;
  tipo_lancamento: string;
  ativo: boolean;
  dia_referencia?: number | null;
  pessoas?: { id: string; nome: string } | null;
  categorias?: { id: string; nome: string; cor: string | null } | null;
}

interface Lancamento {
  id: string;
  modelo_id: string | null;
  status: string;
  valor_bruto: number;
}

interface Props {
  modelos: Modelo[];
  lancamentosMes: Lancamento[];
  mes: number;
  ano: number;
}

export default function RecorrenciasPendentes({ modelos, lancamentosMes, mes, ano }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogModelo, setDialogModelo] = useState<Modelo | null>(null);
  const [valorCustom, setValorCustom] = useState('');

  const modelosAtivos = useMemo(() =>
    modelos.filter(m => m.tipo_lancamento === 'receita' && m.ativo),
    [modelos]
  );

  const lancadosMap = useMemo(() => {
    const map = new Map<string, string>(); // modelo_id -> lancamento_id
    lancamentosMes.forEach(l => {
      if (l.modelo_id) map.set(l.modelo_id, l.id);
    });
    return map;
  }, [lancamentosMes]);

  const lancadosIds = useMemo(() => new Set(lancadosMap.keys()), [lancadosMap]);

  // Agrupar por pessoa
  const grupos = useMemo(() => {
    const map: Record<string, { pessoa: string; modelos: (Modelo & { recebido: boolean })[] }> = {};
    modelosAtivos.forEach(m => {
      const pessoaId = m.pessoa_id;
      const pessoaNome = m.pessoas?.nome || 'Sem pessoa';
      if (!map[pessoaId]) map[pessoaId] = { pessoa: pessoaNome, modelos: [] };
      map[pessoaId].modelos.push({ ...m, recebido: lancadosIds.has(m.id) });
    });
    // Sort: pendentes primeiro dentro de cada grupo
    Object.values(map).forEach(g => {
      g.modelos.sort((a, b) => {
        if (a.recebido !== b.recebido) return a.recebido ? 1 : -1;
        return a.descricao.localeCompare(b.descricao);
      });
    });
    return map;
  }, [modelosAtivos, lancadosIds]);

  const darBaixa = useCallback(async (modelo: Modelo, valorOverride?: number) => {
    if (!user) return;
    setLoading(modelo.id);

    try {
      const valor = valorOverride ?? Number(modelo.valor_padrao);

      let r: any = null;
      try {
        const { data: regra } = await supabase.rpc('obter_regra_categoria', {
          p_user_id: user.id,
          p_categoria_id: modelo.categoria_id,
          p_pessoa_id: modelo.pessoa_id,
        });
        r = regra?.[0];
      } catch {}

      const { valorDizimo, valorImposto, valorGasolina, valorLiquido } = calcularDescontos(
        valor,
        r?.percentual_dizimo ?? 0,
        r?.percentual_imposto ?? 0,
        r?.percentual_gasolina ?? 0,
        r?.aplicar_dizimo ?? false,
        r?.aplicar_imposto ?? false,
        r?.aplicar_gasolina ?? false,
      );

      const hoje = new Date();
      const payload = {
        user_id: user.id,
        pessoa_id: modelo.pessoa_id,
        categoria_id: modelo.categoria_id,
        modelo_id: modelo.id,
        descricao: modelo.descricao,
        tipo_lancamento: 'receita' as const,
        valor_bruto: valor,
        valor_dizimo: valorDizimo,
        valor_imposto: valorImposto,
        valor_gasolina: valorGasolina,
        valor_liquido: valorLiquido,
        percentual_dizimo: r?.percentual_dizimo ?? 0,
        percentual_imposto: r?.percentual_imposto ?? 0,
        percentual_gasolina: r?.percentual_gasolina ?? 0,
        aplicar_dizimo: r?.aplicar_dizimo ?? false,
        aplicar_imposto: r?.aplicar_imposto ?? false,
        aplicar_gasolina: r?.aplicar_gasolina ?? false,
        data_prevista: hoje.toISOString().split('T')[0],
        competencia_mes: mes,
        competencia_ano: ano,
        status: 'recebido',
      };

      const { error } = await supabase.from('lancamentos').insert(payload);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
        queryClient.invalidateQueries({ queryKey: ['lancamentos-ano'] });
        toast({ title: `${modelo.descricao} — ${formatCurrency(valor)} lançado!` });
      }
    } finally {
      setLoading(null);
    }
  }, [user, mes, ano, toast, queryClient]);

  const desfazerBaixa = useCallback(async (modelo: Modelo) => {
    const lancamentoId = lancadosMap.get(modelo.id);
    if (!lancamentoId) return;
    setLoading(modelo.id);
    try {
      const { error } = await supabase.from('lancamentos').delete().eq('id', lancamentoId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
        queryClient.invalidateQueries({ queryKey: ['lancamentos-ano'] });
        toast({ title: `${modelo.descricao} — baixa desfeita` });
      }
    } finally {
      setLoading(null);
    }
  }, [lancadosMap, toast, queryClient]);

  const handleCheckClick = useCallback((modelo: Modelo) => {
    if (modelo.modo_valor === 'variavel' || Number(modelo.valor_padrao) === 0) {
      setDialogModelo(modelo);
      setValorCustom(Number(modelo.valor_padrao) > 0 ? String(modelo.valor_padrao) : '');
    } else {
      darBaixa(modelo);
    }
  }, [darBaixa]);

  const handleDialogConfirm = useCallback(() => {
    if (!dialogModelo) return;
    const val = parseFloat(valorCustom.replace(',', '.')) || 0;
    if (val > 0) {
      darBaixa(dialogModelo, val);
      setDialogModelo(null);
    }
  }, [dialogModelo, valorCustom, darBaixa]);

  const grupoEntries = Object.entries(grupos);
  if (grupoEntries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Recorrências do Mês</h2>

      {grupoEntries.map(([pessoaId, grupo]) => {
        const pendentes = grupo.modelos.filter(m => !m.recebido).length;
        const total = grupo.modelos.length;
        const isOpen = expandido[pessoaId] !== false; // default open

        return (
          <Card key={pessoaId}>
            <Collapsible open={isOpen} onOpenChange={open => setExpandido(prev => ({ ...prev, [pessoaId]: open }))}>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{grupo.pessoa}</span>
                    <span className="text-xs text-muted-foreground">
                      {pendentes > 0 ? `${pendentes} de ${total} pendentes` : `✅ Todos recebidos`}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-1">
                  {grupo.modelos.map(modelo => (
                    <div
                      key={modelo.id}
                      className={`flex items-center justify-between py-2 px-2 rounded-md transition-colors ${
                        modelo.recebido
                          ? 'bg-muted/50'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {modelo.recebido ? (
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        )}
                        <span className={`text-sm truncate ${modelo.recebido ? 'line-through text-muted-foreground' : ''}`}>
                          {modelo.descricao}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${modelo.recebido ? 'text-muted-foreground' : ''}`}>
                          {Number(modelo.valor_padrao) > 0
                            ? formatCurrency(Number(modelo.valor_padrao))
                            : 'Variável'}
                        </span>
                        {modelo.recebido ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-destructive/20 hover:text-destructive"
                            disabled={loading === modelo.id}
                            onClick={() => desfazerBaixa(modelo)}
                            title="Desfazer baixa"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-primary/20 hover:text-primary"
                            disabled={loading === modelo.id}
                            onClick={() => handleCheckClick(modelo)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Dialog para valor variável */}
      <Dialog open={!!dialogModelo} onOpenChange={open => !open && setDialogModelo(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">{dialogModelo?.descricao}</DialogTitle>
            <p className="text-xs text-muted-foreground">{dialogModelo?.categorias?.nome}</p>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valorCustom}
              onChange={e => setValorCustom(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full gap-2"
              disabled={!(parseFloat(valorCustom.replace(',', '.')) > 0)}
              onClick={handleDialogConfirm}
            >
              <Check className="h-4 w-4" /> Lançar como Recebido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
