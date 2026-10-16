import { ImportsListPanel } from "@/features/importacoes/imports-list-panel";

export const metadata = {
  title: "Importações — Atlas Store",
  description:
    "Controle completo de importações da Atlas Store: do orçamento ao recebimento, com custos rateados e entrada no estoque.",
};

export default function ImportsPage() {
  return <ImportsListPanel />;
}
