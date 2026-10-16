import { ReverseCalculatorPanel } from "@/features/reverse-calculator/reverse-calculator-panel";

export const metadata = {
  title: "Quanto preciso cobrar? — Atlas Store",
  description:
    "Calcule qual preço de venda é necessário para atingir o lucro disponível desejado, considerando custos, taxas e divisão de lucro.",
};

export default function QuantoCobrarPage() {
  return <ReverseCalculatorPanel />;
}
