import { notFound } from "next/navigation";

import { getImportation } from "@/app/actions/importations";
import { ImportDetailPanel } from "@/features/importacoes/import-detail-panel";

export const metadata = {
  title: "Detalhes da importação — Atlas Store",
  description: "Histórico completo da importação: status, custos, produtos e linha do tempo.",
};

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importation = await getImportation(id);

  if (!importation) notFound();

  return <ImportDetailPanel importation={importation} />;
}
