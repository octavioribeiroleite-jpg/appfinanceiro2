import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Check } from 'lucide-react';

interface Atalho {
  id: string;
  nome: string;
  valor_padrao: number;
  categoria_id: string;
  pessoa_id: string | null;
  cor: string | null;
  icone: string | null;
  categorias?: { nome: string; cor: string | null } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaNome: string;
  categoriaCor: string;
  atalhos: Atalho[];
  onLancar: (atalho: Atalho) => void;
}

export default function CategoryGroupDialog({
  open, onOpenChange, categoriaNome, categoriaCor, atalhos, onLancar,
}: Props) {
  const total = atalhos.reduce((s, a) => s + Number(a.valor_padrao), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: categoriaCor }} />
            {categoriaNome}
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {atalhos.length} itens · {formatCurrency(total)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {atalhos.map(atalho => (
            <div
              key={atalho.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div>
                <p className="text-sm font-medium">{atalho.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(atalho.valor_padrao))}
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => {
                  onLancar(atalho);
                }}
              >
                <Check className="h-3.5 w-3.5" /> Lançar
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
