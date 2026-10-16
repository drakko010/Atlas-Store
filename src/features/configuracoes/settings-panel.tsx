"use client";

import { useEffect, useState } from "react";
import { Save, AlertTriangle, Percent, DollarSign, Calculator } from "lucide-react";

import {
  getFullSettings,
  updateSettings,
  type FullSettings,
} from "@/app/actions/settings";
import { formatBRL } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

function parsePercent(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : Math.min(Math.max(n, 0), 100);
}

function parseMoney(value: string): number {
  let cleaned = value.replace(/[^\d,.-]/g, "");
  const dots = (cleaned.match(/\./g) ?? []).length;
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (dots > 1) {
    cleaned = cleaned.replace(/\./g, "");
  }
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function formatPercentInput(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatMoneyInput(value: number, digits = 2): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function Section({
  title,
  icon: Icon,
  children,
  warning,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  warning?: string;
}) {
  return (
    <section className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {warning && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{warning}</p>
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  prefix,
  suffix,
  value,
  onChange,
  type = "money",
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "money" | "percent";
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
        {prefix && (
          <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
        />
        {suffix && (
          <span className="flex items-center border-l border-border bg-surface px-3 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<FullSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [available, setAvailable] = useState("50");
  const [reinvestment, setReinvestment] = useState("50");
  const [usdRate, setUsdRate] = useState("5,00");
  const [cnyRate, setCnyRate] = useState("0,70");
  const [importTax, setImportTax] = useState("60");
  const [icms, setIcms] = useState("17");
  const [otherFees, setOtherFees] = useState("0,00");
  const [paymentFee, setPaymentFee] = useState("0");
  const [saleOtherCosts, setSaleOtherCosts] = useState("0,00");

  useEffect(() => {
    setIsLoading(true);
    getFullSettings().then((s) => {
      setSettings(s);
      setAvailable(formatPercentInput(s.availableProfitPercentage));
      setReinvestment(formatPercentInput(s.reinvestmentPercentage));
      setUsdRate(formatMoneyInput(s.usdRate));
      setCnyRate(formatMoneyInput(s.cnyRate, 4));
      setImportTax(formatPercentInput(s.importTax));
      setIcms(formatPercentInput(s.icms));
      setOtherFees(formatMoneyInput(s.otherFees));
      setPaymentFee(formatPercentInput(s.paymentFee));
      setSaleOtherCosts(formatMoneyInput(s.saleOtherCosts));
      setIsLoading(false);
    });
  }, []);

  const handleAvailableChange = (value: string) => {
    const n = parsePercent(value);
    setAvailable(formatPercentInput(n));
    setReinvestment(formatPercentInput(100 - n));
  };

  const handleReinvestmentChange = (value: string) => {
    const n = parsePercent(value);
    setReinvestment(formatPercentInput(n));
    setAvailable(formatPercentInput(100 - n));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings({
        availableProfitPercentage: parsePercent(available),
        reinvestmentPercentage: parsePercent(reinvestment),
        usdRate: parseMoney(usdRate),
        cnyRate: parseMoney(cnyRate),
        importTax: parsePercent(importTax),
        icms: parsePercent(icms),
        otherFees: parseMoney(otherFees),
        paymentFee: parsePercent(paymentFee),
        saleOtherCosts: parseMoney(saleOtherCosts),
      });
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Não foi possível salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="surface-card h-48 animate-pulse rounded-2xl" />
        <div className="surface-card h-48 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="surface-card rounded-2xl p-4 sm:p-5">
        <h1 className="font-display text-lg font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste os parâmetros financeiros que alimentam as calculadoras e relatórios.
        </p>
      </div>

      <Section title="Lucro" icon={Percent}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Percentual disponível"
            suffix="%"
            value={available}
            onChange={handleAvailableChange}
            type="percent"
          />
          <Field
            label="Percentual de reinvestimento"
            suffix="%"
            value={reinvestment}
            onChange={handleReinvestmentChange}
            type="percent"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          A soma dos dois percentuais deve ser 100%. Ao alterar um, o outro é ajustado automaticamente.
        </p>
      </Section>

      <Section title="Moedas" icon={DollarSign}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="USD → BRL" prefix="R$" value={usdRate} onChange={setUsdRate} />
          <Field label="CNY → BRL" prefix="R$" value={cnyRate} onChange={setCnyRate} />
        </div>
        <p className="text-xs text-muted-foreground">
          Cotações usadas nas calculadoras USCloser e CSSBuy. Você pode atualizar manualmente a qualquer momento.
        </p>
      </Section>

      <Section
        title="Tributação"
        icon={Calculator}
        warning="As alíquotas de impostos e taxas são configuráveis e servem como estimativa. Os valores reais podem variar conforme a operação e a legislação vigente."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Imposto de importação"
            suffix="%"
            value={importTax}
            onChange={setImportTax}
            type="percent"
          />
          <Field label="ICMS" suffix="%" value={icms} onChange={setIcms} type="percent" />
          <Field
            label="Outras taxas"
            prefix="R$"
            value={otherFees}
            onChange={setOtherFees}
          />
        </div>
      </Section>

      <Section title="Vendas" icon={Calculator}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Taxa padrão de pagamento"
            suffix="%"
            value={paymentFee}
            onChange={setPaymentFee}
            type="percent"
          />
          <Field label="Outros custos" prefix="R$" value={saleOtherCosts} onChange={setSaleOtherCosts} />
        </div>
        <p className="text-xs text-muted-foreground">
          Valores padrão para novas vendas. Cada venda pode ter seus próprios valores ajustados no cadastro.
        </p>
      </Section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
