import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Delete } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const PIN_LENGTH = 6;

export default function Auth() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const tryLogin = async (value: string) => {
    setSubmitting(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('pin-login', {
        body: { pin: value },
      });
      if (fnError || !data?.token_hash) throw new Error(data?.error || 'PIN incorreto');

      const { error: otpError } = await supabase.auth.verifyOtp({
        type: 'magiclink',
        token_hash: data.token_hash,
      });
      if (otpError) throw otpError;
    } catch (e: any) {
      setError(true);
      setPin('');
      toast({ title: 'PIN incorreto', description: e.message, variant: 'destructive' });
      setTimeout(() => setError(false), 600);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submitting) {
      tryLogin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const press = (n: string) => {
    if (submitting) return;
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + n));
  };
  const backspace = () => setPin((p) => p.slice(0, -1));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <DollarSign className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">Controle Financeiro</CardTitle>
          <CardDescription>Digite seu PIN para entrar</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Dots */}
          <div className={cn('flex justify-center gap-3 mb-8', error && 'animate-pulse')}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-3 w-3 rounded-full border-2 transition-colors',
                  i < pin.length
                    ? error
                      ? 'bg-destructive border-destructive'
                      : 'bg-primary border-primary'
                    : 'border-muted-foreground/40',
                )}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((k) => (
              <Button
                key={k}
                variant="outline"
                className="h-16 text-2xl font-semibold"
                onClick={() => press(k)}
                disabled={submitting}
              >
                {k}
              </Button>
            ))}
            <div />
            <Button
              variant="outline"
              className="h-16 text-2xl font-semibold"
              onClick={() => press('0')}
              disabled={submitting}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-16"
              onClick={backspace}
              disabled={submitting || pin.length === 0}
            >
              <Delete className="h-6 w-6" />
            </Button>
          </div>

          {submitting && (
            <div className="flex justify-center mt-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
