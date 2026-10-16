import { HistoryPanel } from "@/features/historico/history-panel";

export const metadata = {
  title: "Histórico — Atlas Store",
  description:
    "Linha do tempo das operações da Atlas Store: importações, vendas, metas e movimentações.",
};

export default function HistoricoPage() {
  return <HistoryPanel />;
}
