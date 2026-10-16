import { PageHeader } from "@/components/layout/page-header";
import { CSSBuyCalculatorPanel } from "@/features/cssbuy/cssbuy-calculator-panel";

export const metadata = {
  title: "Calculadora CSSBuy — Atlas Store",
  description:
    "Estime em reais o custo de uma importação CSSBuy: produto, frete na China, taxa de serviço, frete internacional, seguro, impostos configuráveis e custo por peça.",
};

export default function CSSBuyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="🇨🇳 CSSBuy → Brasil"
        description="Compras em yuan (¥) com motor de cálculo próprio, independente da USCloser. Peso em kg ou g, alíquotas configuráveis e resultado estimativo."
      />
      <CSSBuyCalculatorPanel />
    </div>
  );
}
