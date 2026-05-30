import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RedirectIfAuthed, RequireAuth } from "@/components/agro/RouteGuards";
import AppLayout from "./layouts/AppLayout";
import { FarmProvider } from "./context/FarmContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();
const Index = lazy(() => import("./pages/Index.tsx"));
const LoginPage = lazy(() => import("./pages/Login"));
const AdminPage = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const FinanceiroPage = lazy(() => import("./pages/modules/Financeiro"));
const PropriedadesPage = lazy(() => import("./pages/modules/Propriedades"));
const PlantacoesPage = lazy(() => import("./pages/modules/Plantacoes"));
const RebanhoPage = lazy(() => import("./pages/modules/Rebanho"));
const RelatoriosPage = lazy(() => import("./pages/modules/Relatorios"));
const CalendarioPage = lazy(() => import("./pages/modules/Calendario"));
const EstoquePage = lazy(() => import("./pages/modules/Estoque"));
const TarefasPage = lazy(() => import("./pages/modules/Tarefas"));
const CentroControlePage = lazy(() => import("./pages/modules/CentroControle"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <AuthProvider>
          <FarmProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando...</div>}>
                <Routes>
                <Route element={<RedirectIfAuthed />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                <Route element={<RequireAuth allow={["admin"]} />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route element={<RequireAuth allow={["gestor"]} />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/controle" element={<CentroControlePage />} />
                    <Route path="/financeiro" element={<FinanceiroPage />} />
                    <Route path="/estoque" element={<EstoquePage />} />
                    <Route path="/tarefas" element={<TarefasPage />} />
                    <Route path="/propriedades" element={<PropriedadesPage />} />
                    <Route path="/plantacoes" element={<PlantacoesPage />} />
                    <Route path="/rebanho" element={<RebanhoPage />} />
                    <Route path="/calendario" element={<CalendarioPage />} />
                    <Route path="/relatorios" element={<RelatoriosPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </FarmProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
