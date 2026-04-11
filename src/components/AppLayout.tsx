import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  List,
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
  LogOut,
  DollarSign,
  Sliders,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const mainNav = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/novo', label: 'Novo', icon: Plus },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

const moreNav = [
  { to: '/lancamentos', label: 'Lançamentos', icon: List },
  { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw },
  { to: '/regras', label: 'Regras', icon: Sliders },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

const allNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', icon: List },
  { to: '/novo', label: 'Novo', icon: Plus },
  { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw },
  { to: '/regras', label: 'Regras', icon: Sliders },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">Controle Financeiro</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6 md:ml-56 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* More menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-0 right-0 bg-card border-t rounded-t-2xl p-4 space-y-1"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-muted-foreground">Menu</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {moreNav.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Nav - mobile (4 items: 3 main + Mais) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 md:hidden">
        <div className="flex justify-around py-2">
          {mainNav.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
              menuOpen ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Menu className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {/* Side Nav - desktop */}
      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-card border-r flex-col p-4 gap-1 z-40">
        {allNav.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
