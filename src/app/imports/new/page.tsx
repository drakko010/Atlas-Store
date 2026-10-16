import { ImportFormPanel } from "@/features/importacoes/import-form-panel";

export const metadata = {
  title: "Nova importação — Atlas Store",
  description: "Crie uma importação com produtos, custos, câmbio congelado e rateio de custos por produto.",
};

export default function NewImportPage() {
  return <ImportFormPanel />;
}
