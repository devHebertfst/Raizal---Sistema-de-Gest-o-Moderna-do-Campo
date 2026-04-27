import {
  BarChart3,
  Beef,
  CalendarDays,
  CheckSquare,
  Boxes,
  Gauge,
  LayoutDashboard,
  Leaf,
  MapPinned,
  ShieldCheck,
  Sprout,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Estratégia",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, end: true },
      { title: "Centro de Controle", url: "/controle", icon: Gauge },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Estoque", url: "/estoque", icon: Boxes },
      { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Produção",
    items: [
      { title: "Propriedades", url: "/propriedades", icon: MapPinned },
      { title: "Plantações", url: "/plantacoes", icon: Sprout },
      { title: "Rebanho", url: "/rebanho", icon: Beef },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className={cn("border-b border-sidebar-border py-5", collapsed ? "items-center px-2" : "px-4")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant">
            <Leaf className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
              A
            </span>
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-base font-extrabold tracking-tight text-sidebar-accent-foreground">
                Raizal
              </span>
              <span className="mt-0.5 line-clamp-2 text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/70">
                Gestão rural SaaS
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="h-10 rounded-xl">
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={cn(
                          "group/nav relative flex h-full w-full items-center rounded-xl text-sm text-sidebar-foreground/88 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed ? "justify-center px-0" : "gap-3 px-3",
                        )}
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary group-[.active]/nav:block" />
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {!collapsed && (
          <div className="mx-2 mt-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-3">
            <div className="flex items-center gap-2 text-sidebar-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Demo comercial</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/70">
              Plataforma de gestão rural para controle financeiro, lavoura, rebanho e operação.
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
