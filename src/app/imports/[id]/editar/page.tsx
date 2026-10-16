import { notFound } from "next/navigation";

import { getImportation } from "@/app/actions/importations";
import { ImportFormPanel } from "@/features/importacoes/import-form-panel";

export const metadata = {
  title: "Editar importação — Atlas Store",
  description: "Edite produtos, custos e câmbio da importação.",
};

export default async function EditImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importation = await getImportation(id);

  if (!importation) notFound();

  return <ImportFormPanel existing={importation} />;
}
