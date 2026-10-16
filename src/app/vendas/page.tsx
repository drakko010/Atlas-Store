import { SalesPanel } from "@/features/vendas/sales-panel";

export const metadata = {
  title: "Vendas — Atlas Store",
  description:
    "Registro de vendas da Atlas Store com receita, custo real, lucro e divisão configurável entre disponível e reinvestimento.",
};

export default function VendasPage() {
  return <SalesPanel />;
}
