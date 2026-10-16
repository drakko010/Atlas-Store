import { PageHeader } from "@/components/layout/page-header";
import { ComparePanel } from "@/features/comparar/compare-panel";

export const metadata = {
  title: "Comparar importação: USCloser x CSSBuy — Atlas Store",
  description:
    "Compare em reais o custo do mesmo produto pela rota USCloser (🇺🇸) e CSSBuy (🇨🇳): produto, frete, impostos, taxas, custo final e custo por peça, com a melhor opção destacada.",
};

export default function CompararPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Ferramenta"
        title="Comparar importação"
        description="Preencha as duas simulações e veja lado a lado qual rota entrega o menor custo final. Cálculos independentes — estimativa."
      />
      <ComparePanel />
    </div>
  );
}
