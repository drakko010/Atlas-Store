"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag, Scale, TrendingDown } from "lucide-react";

import { formatBRL } from "@/lib/format";
import {
  getCSSBuySettings,
  getUsCloserSettings,
  type CSSBuySettings,
  type UsCloserSettings,
} from "@/app/actions/settings";
import { compareImportation, type ComparisonResult } from "@/features/comparar/comparison";
import { cn } from "@/lib/utils";

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

function InputRow({
  label,
  prefix,
  suffix,
  value,
  onChange,
  helper,
  inputMode = "decimal",
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  inputMode?: "decimal" | "numeric";
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
          inputMode={inputMode}
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

function MethodCard({
  title,
  flag,
  data,
  winner,
}: {
  title: string;
  flag: string;
  data: ComparisonResult["usCloser"];
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-card rounded-2xl p-4 transition-all sm:p-5",
        winner && "glow-primary ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{flag}</span>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>

      <div className="mt-4 space-y-3">
        <ResultLine label="Custo do produto" value={data.productCost} />
        <ResultLine label="Frete" value={data.shipping} />
        <ResultLine label="Impostos" value={data.taxes} />
        <ResultLine label="Taxas" value={data.fees} />
        <div className="border-t border-border pt-3">
          <ResultLine label="Custo final" value={data.finalCost} bold accent />
        </div>
        <ResultLine label="Custo por peça" value={data.costPerPiece} />
      </div>
    </div>
  );
}

function ResultLine({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: number;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn("text-muted-foreground", bold && "font-medium text-foreground")}>{label}</span>
      <span
        className={cn(
          "font-display tabular-nums",
          bold ? "text-base font-bold" : "font-medium",
          accent && "text-primary",
        )}
      >
        {formatBRL(value)}
      </span>
    </div>
  );
}

export function ComparePanel() {
  const [usRate, setUsRate] = useState("5,10");
  const [cnYRate, setCnYRate] = useState("0,72");
  const [usSettings, setUsSettings] = useState<UsCloserSettings | null>(null);
  const [cnSettings, setCnSettings] = useState<CSSBuySettings | null>(null);

  // USCloser inputs
  const [usProduct, setUsProduct] = useState("100,00");
  const [usDeclared, setUsDeclared] = useState("100,00");
  const [usShipping, setUsShipping] = useState("20,00");

  // CSSBuy inputs
  const [cnProduct, setCnProduct] = useState("700,00");
  const [cnDomesticShipping, setCnDomesticShipping] = useState("30,00");
  const [cnServiceFee, setCnServiceFee] = useState("50,00");
  const [cnOtherCosts, setCnOtherCosts] = useState("20,00");
  const [cnInternationalShipping, setCnInternationalShipping] = useState("180,00");
  const [cnInsurance, setCnInsurance] = useState("0,00");
  const [cnDeclared, setCnDeclared] = useState("700,00");
  const [cnWeight, setCnWeight] = useState("1");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    Promise.all([getUsCloserSettings(), getCSSBuySettings()]).then(([us, cn]) => {
      setUsSettings(us);
      setCnSettings(cn);
      setUsRate(us.commercialRate.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      setCnYRate(cn.yuanRate.toLocaleString("pt-BR", { minimumFractionDigits: 4 }));
    });
  }, []);

  const result: ComparisonResult | null = useMemo(() => {
    const usProductNum = parseMoney(usProduct);
    const cnProductNum = parseMoney(cnProduct);
    if (usProductNum <= 0 || cnProductNum <= 0) return null;

    return compareImportation(
      {
        productPrice: usProductNum,
        declaredValue: parseMoney(usDeclared),
        declaredShipping: parseMoney(usShipping),
        commercialRate: parseMoney(usRate),
      },
      {
        productPrice: cnProductNum,
        domesticShipping: parseMoney(cnDomesticShipping),
        serviceFee: parseMoney(cnServiceFee),
        otherChinaCosts: parseMoney(cnOtherCosts),
        weight: Number(cnWeight) || 1,
        weightUnit: "kg",
        internationalShipping: parseMoney(cnInternationalShipping),
        insurance: parseMoney(cnInsurance),
        declaredValue: parseMoney(cnDeclared),
        yuanRate: parseMoney(cnYRate),
      },
      {
        importTax: usSettings?.importTax ?? 60,
        icms: usSettings?.icms ?? 17,
        otherFees: usSettings?.otherFees ?? 0,
        usCloserRateFactor: 1.026,
      },
      {
        taxRate: cnSettings?.taxRate ?? 60,
        otherFees: cnSettings?.otherFees ?? 0,
      },
      Number(quantity) || 1,
    );
  }, [
    usProduct,
    usDeclared,
    usShipping,
    usRate,
    cnProduct,
    cnDomesticShipping,
    cnServiceFee,
    cnOtherCosts,
    cnInternationalShipping,
    cnInsurance,
    cnDeclared,
    cnYRate,
    cnWeight,
    quantity,
    usSettings,
    cnSettings,
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Formulários lado a lado */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* USCloser */}
        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🇺🇸</span>
            <h2 className="font-display text-lg font-semibold">USCloser</h2>
          </div>
          <div className="space-y-3">
            <InputRow label="Valor pago pelo produto" prefix="US$" value={usProduct} onChange={setUsProduct} />
            <InputRow label="Valor declarado" prefix="US$" value={usDeclared} onChange={setUsDeclared} />
            <InputRow label="Frete declarado" prefix="US$" value={usShipping} onChange={setUsShipping} />
            <InputRow
              label="Dólar comercial"
              prefix="R$"
              value={usRate}
              onChange={setUsRate}
              helper="UsCloser = comercial × 1,026"
            />
          </div>
        </section>

        {/* CSSBuy */}
        <section className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🇨🇳</span>
            <h2 className="font-display text-lg font-semibold">CSSBuy</h2>
          </div>
          <div className="space-y-3">
            <InputRow label="Valor do produto" prefix="¥" value={cnProduct} onChange={setCnProduct} />
            <InputRow label="Frete doméstico China" prefix="¥" value={cnDomesticShipping} onChange={setCnDomesticShipping} />
            <InputRow label="Taxa CSSBuy" prefix="¥" value={cnServiceFee} onChange={setCnServiceFee} />
            <InputRow label="Outros custos China" prefix="¥" value={cnOtherCosts} onChange={setCnOtherCosts} />
            <InputRow label="Frete internacional" prefix="¥" value={cnInternationalShipping} onChange={setCnInternationalShipping} />
            <InputRow label="Seguro" prefix="¥" value={cnInsurance} onChange={setCnInsurance} />
            <InputRow label="Valor declarado" prefix="¥" value={cnDeclared} onChange={setCnDeclared} />
            <div className="grid grid-cols-2 gap-3">
              <InputRow label="Peso" suffix="kg" value={cnWeight} onChange={setCnWeight} />
              <InputRow label="Quantidade" suffix="pc" value={quantity} onChange={setQuantity} inputMode="numeric" />
            </div>
            <InputRow label="Cotação do Yuan" prefix="R$" value={cnYRate} onChange={setCnYRate} />
          </div>
        </section>
      </div>

      {/* Resultados */}
      {result && (
        <>
          <div className="surface-card rounded-2xl p-5 text-center sm:p-6">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
              <Scale className="h-6 w-6" />
            </div>
            <h2 className="mt-3 font-display text-xl font-semibold">Melhor opção</h2>
            <p className="mt-1 text-sm text-muted-foreground">Baseado no custo final estimado</p>
            <p className="mt-3 font-display text-2xl font-bold text-primary">
              {result.winner === "tie" ? "Empate" : result.winner === "USCloser" ? "🇺🇸 USCloser" : "🇨🇳 CSSBuy"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{result.savingsLabel}</p>
            <div className="mt-3 flex items-center justify-center gap-4 text-sm">
              <span className="text-muted-foreground">Diferença percentual:</span>
              <span className="font-display font-semibold text-primary">{result.differencePercent}%</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MethodCard
              title="USCloser"
              flag="🇺🇸"
              data={result.usCloser}
              winner={result.winner === "USCloser"}
            />
            <MethodCard
              title="CSSBuy"
              flag="🇨🇳"
              data={result.cssBuy}
              winner={result.winner === "CSSBuy"}
            />
          </div>
        </>
      )}

      {!result && (
        <div className="surface-card rounded-2xl p-6 text-center sm:p-8">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <TrendingDown className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold">Preencha os valores para comparar</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Informe o valor do produto nos dois métodos para ver qual sai mais barato e a diferença em reais.
          </p>
        </div>
      )}
    </div>
  );
}
