import {
  LayoutDashboard,
  Ship,
  Package,
  ShoppingBag,
  Target,
  Wallet,
  History,
  Settings,
  Boxes,
  Plane,
  Scale,
  Calculator,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  /** Itens principais aparecem na bottom navigation mobile. */
  primary?: boolean;
  group: "Operação" | "Financeiro" | "Sistema";
};

export const navItems: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard, primary: true, group: "Operação" },
  { title: "Importações", to: "/imports", icon: Ship, primary: true, group: "Operação" },
  { title: "USCloser", to: "/uscloser", icon: Plane, group: "Operação" },
  { title: "CSSBuy", to: "/cssbuy", icon: Boxes, group: "Operação" },
  { title: "Comparar", to: "/comparar", icon: Scale, group: "Operação" },
  { title: "Produtos", to: "/produtos", icon: Package, primary: true, group: "Operação" },
  { title: "Vendas", to: "/vendas", icon: ShoppingBag, primary: true, group: "Financeiro" },
  { title: "Metas", to: "/metas", icon: Target, group: "Financeiro" },
  { title: "Financeiro", to: "/financeiro", icon: Wallet, group: "Financeiro" },
  { title: "Simulador", to: "/simulador", icon: Calculator, group: "Financeiro" },
  { title: "Quanto cobrar", to: "/quanto-cobrar", icon: TrendingUp, group: "Financeiro" },
  { title: "Histórico", to: "/historico", icon: History, group: "Sistema" },
  { title: "Configurações", to: "/configuracoes", icon: Settings, group: "Sistema" },
];

export const navGroups = ["Operação", "Financeiro", "Sistema"] as const;
