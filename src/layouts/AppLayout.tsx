import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/agro/AppSidebar";
import { ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const titles: Record<string, { title: string; subtitle: string; group: string }> = {
  "/": { title: "Dashboard", subtitle: "Visao estrategica da operacao rural", group: "Estrategia" },
  "/controle": { title: "Centro de Controle", subtitle: "Pendencias criticas e acompanhamento operacional", group: "Estrategia" },
  "/financeiro": { title: "Financeiro", subtitle: "Receitas, despesas, contas e fluxo de caixa", group: "Gestao" },
  "/estoque": { title: "Estoque", subtitle: "Insumos, materiais, alertas e validade", group: "Gestao" },
  "/tarefas": { title: "Tarefas", subtitle: "Quadro operacional da fazenda", group: "Gestao" },
  "/propriedades": { title: "Propriedades", subtitle: "Areas, hectares e talhoes", group: "Producao" },
  "/plantacoes": { title: "Plantacoes & Safras", subtitle: "Lavouras em andamento e manejos", group: "Producao" },
  "/rebanho": { title: "Rebanho", subtitle: "Lotes, patrimonio e historico sanitario", group: "Producao" },
  "/calendario": { title: "Calendario", subtitle: "Lembretes, atividades e agenda da fazenda", group: "Gestao" },
  "/relatorios": { title: "Relatorios", subtitle: "Indicadores consolidados da fazenda", group: "Estrategia" },
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = titles[location.pathname] ?? { title: "Raizal", subtitle: "", group: "Produto" };
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "AG";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/82 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="hidden min-w-0 flex-1 md:block">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Raizal</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{meta.group}</span>
                </div>
                <h1 className="font-display text-lg font-extrabold leading-tight tracking-tight text-foreground">
                  {meta.title}
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle} aria-label="Alternar tema">
                  {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </Button>
                <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-card/90 py-1 pl-1 pr-3 shadow-sm sm:flex">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left leading-tight">
                    <p className="max-w-28 truncate text-xs font-bold text-foreground">{user?.name ?? "Raizal"}</p>
                    <p className="text-[10px] text-muted-foreground">Conta demo</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="hidden rounded-full sm:inline-flex" onClick={handleLogout}>
                  <LogOut className="mr-1.5 h-4 w-4" /> Sair
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full sm:hidden" onClick={handleLogout} aria-label="Sair da conta">
                  <LogOut className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1480px] animate-fade-in">
              <div className="mb-6 md:hidden">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>{meta.group}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>Raizal</span>
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                  {meta.title}
                </h1>
                <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
              </div>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
