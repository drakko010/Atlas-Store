import { FinancePanel } from "@/features/financeiro/finance-panel";

export const metadata = {
  title: "Financeiro — Atlas Store",
  description:
    "Caixa, capital investido, lucro disponível e reinvestimento da Atlas Store em um só lugar.",
};

export default function FinanceiroPage() {
  return <FinancePanel />;
}
