import { SimulatorPanel } from "@/features/simulador/simulator-panel";

export const metadata = {
  title: "Simulador de negócio — Atlas Store",
  description:
    "Simule operações de compra e venda antes de realizá-las. Calcule investimento, faturamento, lucro, margem e ROI.",
};

export default function SimuladorPage() {
  return <SimulatorPanel />;
}
