"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, TrendingUp, DollarSign, PiggyBank, Wallet, Package, Percent, Target } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatPercent } from "@/lib/format";
import { calculateSimulation } from "@/features/simulador/simulator-math";
import { getProfitSplit } from "@/app/actions/settings";

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

function parsePercent(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : Math.min(Math.max(n, 0), 100);
}

function formatMoneyInput(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Field({
  label,
  prefix,
  suffix,
  value,
  onChange,
  helper,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
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
      {helper && <p className="text-[0.65rem] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function ResultCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <p className="label-caps">{label}</p>
      </div>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

export function SimulatorPanel() {
  const [quantity, setQuantity] = useState("20");
  const [costPerPiece, setCostPerPiece] = useState("100,00");
  const [salePrice, setSalePrice] = useState("500,00");
  const [paymentFee, setPaymentFee] = useState("0,00");
  const [otherCosts, setOtherCosts] = useState("0,00");
  const [availablePct, setAvailablePct] = useState("50");
  const [reinvestmentPct, setReinvestmentPct] = useState("50");

  useEffect(() => {
    getProfitSplit().then((s) => {
      setAvailablePct(s.availablePercentage.toString());
      setReinvestmentPct(s.reinvestmentPercentage.toString());
    });
  }, []);

  const result = useMemo(() => {
    return calculateSimulation({
      quantity: Number(quantity) || 0,
      costPerPiece: parseMoney(costPerPiece),
      salePrice: parseMoney(salePrice),
      paymentFee: parseMoney(paymentFee),
      otherCosts: parseMoney(otherCosts),
      availablePercentage: parsePercent(availablePct),
      reinvestmentPercentage: parsePercent(reinvestmentPct),
    });
  }, [quantity, costPerPiece, salePrice, paymentFee, otherCosts, availablePct, reinvestmentPct]);

  const handleAvailableChange = (value: string) => {
    const n = parsePercent(value);
    setAvailablePct(n.toString());
    setReinvestmentPct((100 - n).toString());
  };

  const handleReinvestmentChange = (value: string) => {
    const n = parsePercent(value);
    setReinvestmentPct(n.toString());
    setAvailablePct((100 - n).toString());
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Ferramenta"
        title="Simulador de negócio"
        description="Simule uma operação de compra e venda antes de realizá-la. Nenhum dado é salvo."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Formulário */}
        <section className="space-y-4">
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">Dados da operação</h2>
            <p className="text-sm text-muted-foreground">
              Preencha os valores para simular investimento, faturamento e lucro.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Produto / Quantidade"
              suffix="peças"
              value={quantity}
              onChange={setQuantity}
              helper="Quantidade de peças na simulação."
            />
            <Field
              label="Custo por peça"
              prefix="R$"
              value={costPerPiece}
              onChange={setCostPerPiece}
            />
            <Field
              label="Preço de venda"
              prefix="R$"
              value={salePrice}
              onChange={setSalePrice}
            />
            <Field
              label="Taxa de pagamento"
              prefix="R$"
              value={paymentFee}
              onChange={setPaymentFee}
            />
            <Field
              label="Outros custos"
              prefix="R$"
              value={otherCosts}
              onChange={setOtherCosts}
            />
          </div>

          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold">Divisão do lucro</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field
                label="Percentual disponível"
                suffix="%"
                value={availablePct}
                onChange={handleAvailableChange}
              />
              <Field
                label="Percentual reinvestimento"
                suffix="%"
                value={reinvestmentPct}
                onChange={handleReinvestmentChange}
              />
            </div>
          </div>
        </section>

        {/* Resultados */}
        <aside className="space-y-4">
          <div className="surface-card glow-primary rounded-2xl p-5 sm:p-6">
            <p className="label-caps">Resultado estimado</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
              {formatBRL(result.profit)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Lucro estimado da operação</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <ResultCard label="Investimento" value={formatBRL(result.investment)} icon={Wallet} />
            <ResultCard label="Faturamento" value={formatBRL(result.revenue)} icon={DollarSign} accent />
            <ResultCard label="Custos" value={formatBRL(result.costs)} icon={Package} />
            <ResultCard label="Lucro" value={formatBRL(result.profit)} icon={TrendingUp} accent />
            <ResultCard label="Disponível" value={formatBRL(result.available)} icon={PiggyBank} />
            <ResultCard label="Reinvestimento" value={formatBRL(result.reinvestment)} icon={Calculator} />
            <ResultCard label="Margem" value={formatPercent(result.margin)} icon={Percent} />
            <ResultCard label="ROI" value={formatPercent(result.roi)} icon={Target} />
          </div>

          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold">Resumo em uma frase</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Se você vender todas as peças, terá aproximadamente{" "}
              <span className="font-semibold text-primary">{formatBRL(result.available)}</span>{" "}
              disponíveis para retirar e{" "}
              <span className="font-semibold text-foreground">{formatBRL(result.reinvestment)}</span>{" "}
              para reinvestir.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
