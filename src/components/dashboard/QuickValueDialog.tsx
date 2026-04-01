import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { Pencil, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome: string;
  valorPadrao: number;
  categoriaNome?: string;
  categoriaCor?: string;
  onConfirm: (valor: number) => void;
  onEditRecorrencia?: () => void;
}

export default function QuickValueDialog({
  open, onOpenChange, nome, valorPadrao, categoriaNome, categoriaCor, onConfirm, onEditRecorrencia,
}: Props) {
  const [valor, setValor] = useState('');
  const [editandoValor, setEditandoValor] = useState(false);

  useEffect(() => {
    if (open) {
      setValor(valorPadrao > 0 ? String(valorPadrao) : '');
      setEditandoValor(valorPadrao === 0);
    }
  }, [open, valorPadrao]);

  const valorNum = parseFloat(valor.replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorNum > 0) {
      onConfirm(valorNum);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {categoriaCor && (
              <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: categoriaCor }} />
            )}
            {nome}
          </DialogTitle>
          {categoriaNome && (
            <p className="text-xs text-muted-foreground">{categoriaNome}</p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            {editandoValor ? (
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{formatCurrency(valorNum)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditandoValor(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button type="submit" className="w-full gap-2" disabled={valorNum <= 0}>
              <Check className="h-4 w-4" /> Lançar como Recebido
            </Button>
            {onEditRecorrencia && (
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onEditRecorrencia();
                }}
              >
                <Pencil className="h-4 w-4" /> Editar Atalho
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
