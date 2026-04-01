import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome: string;
  onConfirm: (valor: number) => void;
}

export default function QuickValueDialog({ open, onOpenChange, nome, onConfirm }: Props) {
  const [valor, setValor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valor.replace(',', '.'));
    if (num > 0) {
      onConfirm(num);
      setValor('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">{nome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={e => setValor(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" className="w-full">Lançar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
