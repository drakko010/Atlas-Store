import { SettingsPanel } from "@/features/configuracoes/settings-panel";

export const metadata = {
  title: "Configurações — Atlas Store",
  description:
    "Preferências da Atlas Store: parâmetros de margem, moedas, integrações e acesso ao sistema.",
};

export default function ConfiguracoesPage() {
  return <SettingsPanel />;
}
