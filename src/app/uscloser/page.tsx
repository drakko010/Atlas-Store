import { PageHeader } from "@/components/layout/page-header";
import { USCloserCalculatorPanel } from "@/features/uscloser/uscloser-calculator-panel";

export const metadata = {
  title: "Calculadora USCloser — Atlas Store",
  description:
    "Estime o custo final em reais de uma importação USCloser: produto, frete, serviço, imposto de importação, ICMS e outras taxas configuráveis.",
};

export default function USCloserPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="🇺🇸 USCloser → Brasil"
        description="Simule o custo real de uma remessa dos Estados Unidos. Todas as alíquotas são configuráveis e o resultado é uma estimativa."
      />
      <USCloserCalculatorPanel />
    </div>
  );
}
