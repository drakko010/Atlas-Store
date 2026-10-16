"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, DollarSign, TrendingUp, PiggyBank, Wallet, Target, ArrowRight, AlertCircle, Percent } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatPercent } from "@/lib/format";
import { calculateRequiredSalePrice } from "@/features/reverse-calculator/reverse-calculator-math";
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
  large,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <p className="label-caps">{label}</p>
      </div>
      <p
        className={`mt-2 font-display font-bold tracking-tight tabular-nums ${
          large ? "text-3xl" : "text-2xl"
        } ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-display text-sm font-semibold">{title}</h4>
        <div className="mt-1 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function ReverseCalculatorPanel() {
  const [cost, setCost] = useState("100,00");
  const [fees, setFees] = useState("0,00");
  const [desiredAvailable, setDesiredAvailable] = useState("200,00");
  const [availablePct, setAvailablePct] = useState("50");
  const [reinvestmentPct, setReinvestmentPct] = useState("50");

  useEffect(() => {
    getProfitSplit().then((s) => {
      setAvailablePct(s.availablePercentage.toString());
      setReinvestmentPct(s.reinvestmentPercentage.toString());
    });
  }, []);

  const result = useMemo(() => {
    return calculateRequiredSalePrice({
      cost: parseMoney(cost),
      fees: parseMoney(fees),
      desiredAvailableProfit: parseMoney(desiredAvailable),
      availablePercentage: parsePercent(availablePct),
      reinvestmentPercentage: parsePercent(reinvestmentPct),
    });
  }, [cost, fees, desiredAvailable, availablePct, reinvestmentPct]);

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

  const costNum = parseMoney(cost);
  const feesNum = parseMoney(fees);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Ferramenta"
        title="Quanto preciso cobrar?"
        description="Descubra qual preço de venda é necessário para atingir o lucro disponível que você deseja."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Formulário */}
        <section className="space-y-4">
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">Dados da simulação</h2>
            <p className="text-sm text-muted-foreground">
              Informe custo, taxas e quanto você quer ter disponível.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Custo do produto" prefix="R$" value={cost} onChange={setCost} />
            <Field label="Taxas" prefix="R$" value={fees} onChange={setFees} helper="Taxas de pagamento, impostos e outros custos." />
            <Field
              label="Lucro disponível desejado"
              prefix="R$"
              value={desiredAvailable}
              onChange={setDesiredAvailable}
              helper="Quanto você quer poder retirar."
            />
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

          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold">Como o cálculo foi feito</h3>
            <div className="mt-4 space-y-4">
              <Step number={1} title="Definir o lucro total necessário">
                Para ter <span className="font-semibold text-primary">{formatBRL(parseMoney(desiredAvailable))}</span>{" "}
                disponíveis com{" "}
                <span className="font-semibold">{parsePercent(availablePct)}%</span> de divisão,
                o lucro total precisa ser:
                <div className="mt-1 rounded-lg bg-surface/50 p-2 font-display text-sm font-bold">
                  {formatBRL(parseMoney(desiredAvailable))} ÷ {parsePercent(availablePct)}% ={" "}
                  {formatBRL(result.requiredTotalProfit)}
                </div>
              </Step>

              <Step number={2} title="Somar custos e taxas">
                Custo + taxas ={" "}
                <span className="font-semibold">{formatBRL(costNum + feesNum)}</span>
              </Step>

              <Step number={3} title="Encontrar o preço de venda">
                Preço = custo + taxas + lucro total
                <div className="mt-1 rounded-lg bg-surface/50 p-2 font-display text-sm font-bold">
                  {formatBRL(costNum + feesNum)} + {formatBRL(result.requiredTotalProfit)} ={" "}
                  {formatBRL(result.requiredSalePrice)}
                </div>
              </Step>

              <Step number={4} title="Aplicar a divisão do lucro">
                Disponível = {formatBRL(result.totalProfit)} × {parsePercent(availablePct)}% ={" "}
                {formatBRL(result.availableProfit)}
                <br />
                Reinvestimento = {formatBRL(result.totalProfit)} × {parsePercent(reinvestmentPct)}% ={" "}
                {formatBRL(result.reinvestmentProfit)}
              </Step>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <aside className="space-y-4">
          <div className="surface-card glow-primary rounded-2xl p-5 sm:p-6">
            <p className="label-caps">Preço recomendado</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
              {formatBRL(result.recommendedPrice)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Valor sugerido para atingir seu lucro disponível desejado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <ResultCard label="Preço mínimo" value={formatBRL(result.minimumPrice)} icon={AlertCircle} />
            <ResultCard label="Preço calculado" value={formatBRL(result.requiredSalePrice)} icon={DollarSign} />
            <ResultCard label="Lucro total" value={formatBRL(result.totalProfit)} icon={TrendingUp} accent />
            <ResultCard label="Disponível" value={formatBRL(result.availableProfit)} icon={PiggyBank} />
            <ResultCard label="Reinvestimento" value={formatBRL(result.reinvestmentProfit)} icon={Wallet} />
            <ResultCard label="Margem" value={formatPercent(result.margin)} icon={Percent} />
            <ResultCard label="ROI" value={formatPercent(result.roi)} icon={Target} />
          </div>
        </aside>
      </div>
    </div>
  );
}
