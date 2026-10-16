"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { formatBRL, formatNumber } from "@/lib/format";
import {
  calculateCSSBuy,
  toKg,
  type CSSBuyConfig,
  type CSSBuyInput,
  type CSSBuyResult,
  type WeightUnit,
} from "@/features/cssbuy/calculator";
import { getCSSBuySettings, type CSSBuySettings } from "@/app/actions/settings";
import { SaveAsImportationDialog } from "@/features/importacoes/save-as-importation-dialog";
import { Ship } from "lucide-react";

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
  badge,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  helper,
  inputMode = "decimal",
}: {
  label: string;
  badge?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-display text-base font-semibold">{label}</label>
        {badge && (
          <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
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
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none placeholder:text-muted-foreground"
        />
        {suffix && (
          <span className="flex items-center border-l border-border bg-surface px-4 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function ResultRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}

export function CSSBuyCalculatorPanel() {
  const [settings, setSettings] = useState<CSSBuySettings | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const [productPrice, setProductPrice] = useState("0,00");
  const [domesticShipping, setDomesticShipping] = useState("0,00");
  const [serviceFee, setServiceFee] = useState("0,00");
  const [otherChinaCosts, setOtherChinaCosts] = useState("0,00");
  const [weight, setWeight] = useState("1");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [internationalShipping, setInternationalShipping] = useState("0,00");
  const [insurance, setInsurance] = useState("0,00");
  const [declaredValue, setDeclaredValue] = useState("0,00");
  const [declaredValueTouched, setDeclaredValueTouched] = useState(false);
  const [yuanRate, setYuanRate] = useState("0,70");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    getCSSBuySettings().then((s) => {
      setSettings(s);
      setYuanRate(s.yuanRate.toLocaleString("pt-BR", { minimumFractionDigits: 4 }));
    });
  }, []);

  // Sincroniza valor declarado com valor do produto até que o usuário edite
  useEffect(() => {
    if (!declaredValueTouched) {
      setDeclaredValue(productPrice);
    }
  }, [productPrice, declaredValueTouched]);

  const result: CSSBuyResult | null = useMemo(() => {
    const product = parseMoney(productPrice);
    if (product <= 0) return null;

    const input: CSSBuyInput = {
      productPrice: product,
      domesticShipping: parseMoney(domesticShipping),
      serviceFee: parseMoney(serviceFee),
      otherChinaCosts: parseMoney(otherChinaCosts),
      weight: Number(weight) || 0,
      weightUnit,
      internationalShipping: parseMoney(internationalShipping),
      insurance: parseMoney(insurance),
      declaredValue: parseMoney(declaredValue),
      yuanRate: parseMoney(yuanRate),
      quantity: Number(quantity) || 1,
    };

    const config: CSSBuyConfig = {
      taxRate: settings?.taxRate ?? 60,
      otherFees: settings?.otherFees ?? 0,
    };

    return calculateCSSBuy(input, config);
  }, [
    productPrice,
    domesticShipping,
    serviceFee,
    otherChinaCosts,
    weight,
    weightUnit,
    internationalShipping,
    insurance,
    declaredValue,
    yuanRate,
    quantity,
    settings,
  ]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Formulário */}
      <section className="space-y-4">
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold">Dados da compra na China</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha os valores em yuan (¥). O sistema converte automaticamente para reais.
          </p>
        </div>

        <InputRow
          label="Valor do produto"
          badge="Obrigatório"
          prefix="¥"
          value={productPrice}
          onChange={setProductPrice}
          helper="Valor pago pelo produto ao fornecedor chinês."
        />

        <InputRow
          label="Frete doméstico na China"
          badge="Opcional"
          prefix="¥"
          value={domesticShipping}
          onChange={setDomesticShipping}
          helper="Frete do vendedor até o armazém da CSSBuy."
        />

        <InputRow
          label="Taxa de serviço CSSBuy"
          badge="Opcional"
          prefix="¥"
          value={serviceFee}
          onChange={setServiceFee}
          helper="Taxa cobrada pelo serviço de redirecionamento."
        />

        <InputRow
          label="Outros custos na China"
          badge="Opcional"
          prefix="¥"
          value={otherChinaCosts}
          onChange={setOtherChinaCosts}
          helper="Extras como embalagem, fotos ou verificação."
        />

        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <label className="font-display text-base font-semibold">Peso</label>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
            />
            <div className="flex border-l border-border">
              {(["kg", "g"] as WeightUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setWeightUnit(unit)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    weightUnit === unit
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:bg-muted"
                  } ${unit === "kg" ? "border-r border-border" : ""}`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Convertido automaticamente: {toKg(Number(weight) || 0, weightUnit).toLocaleString("pt-BR")} kg
          </p>
        </div>

        <InputRow
          label="Frete internacional"
          badge="Opcional"
          prefix="¥"
          value={internationalShipping}
          onChange={setInternationalShipping}
          helper="Frete da China para o Brasil."
        />

        <InputRow
          label="Seguro"
          badge="Opcional"
          prefix="¥"
          value={insurance}
          onChange={setInsurance}
          helper="Seguro opcional da remessa."
        />

        <InputRow
          label="Valor declarado"
          badge="Preenchido automaticamente"
          prefix="¥"
          value={declaredValue}
          onChange={(v) => {
            setDeclaredValue(v);
            setDeclaredValueTouched(true);
          }}
          helper="Base usada para cálculo dos impostos. Acompanha o valor do produto até você editar."
        />

        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <label className="font-display text-base font-semibold">Quantidade de peças</label>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
            />
            <span className="flex items-center border-l border-border bg-surface px-4 text-sm text-muted-foreground">
              peças
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Usado para calcular o custo por peça.</p>
        </div>

        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-display text-base font-semibold">Cotação do Yuan</label>
            <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Editável
            </span>
          </div>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
            <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={yuanRate}
              onChange={(e) => setYuanRate(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const saved = settings?.yuanRate ?? 0.7;
              setYuanRate(saved.toLocaleString("pt-BR", { minimumFractionDigits: 4 }));
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar cotação
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Botão restaura o valor salvo nas configurações. Futuramente poderá buscar cotação automática via API.
          </p>
        </div>
      </section>

      {/* Resultados */}
      <aside className="space-y-4">
        <div className="surface-card glow-primary rounded-2xl p-5 sm:p-6">
          <p className="label-caps">Custo final estimado</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
            {result ? formatBRL(result.totalCostBRL) : formatBRL(0)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Todos os valores da China são convertidos pela cotação do Yuan informada.
          </p>
          {result && (
            <button
              type="button"
              onClick={() => setSaveOpen(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Ship className="h-4 w-4" />
              Salvar como importação
            </button>
          )}
        </div>

        <div className="surface-card rounded-2xl p-5 sm:p-6">
          <p className="label-caps">Custo por peça</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {result ? formatBRL(result.costPerPieceBRL) : formatBRL(0)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Custo final ÷ {Number(quantity) || 1} peça(s).
          </p>
        </div>

        {result ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <ResultRow label="Produto" value={result.productBRL} />
              <ResultRow label="Frete China" value={result.domesticShippingBRL} />
              <ResultRow label="Taxa CSSBuy" value={result.serviceFeeBRL} />
              <ResultRow label="Frete internacional" value={result.internationalShippingBRL} />
              <ResultRow label="Seguro" value={result.insuranceBRL} />
              <ResultRow
                label={`Impostos ${settings?.taxRate ?? 60}%`}
                value={result.taxesBRL}
              />
              <ResultRow label="Outras taxas" value={result.otherFeesBRL} />
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5">
              <h3 className="font-display text-base font-semibold">Como o cálculo foi feito</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>Produto</span>
                  <span className="font-medium text-foreground">{formatBRL(result.productBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Frete China</span>
                  <span className="font-medium text-foreground">{formatBRL(result.domesticShippingBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Taxa CSSBuy</span>
                  <span className="font-medium text-foreground">{formatBRL(result.serviceFeeBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Frete internacional</span>
                  <span className="font-medium text-foreground">
                    {formatBRL(result.internationalShippingBRL)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Seguro</span>
                  <span className="font-medium text-foreground">{formatBRL(result.insuranceBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Impostos sobre valor declarado</span>
                  <span className="font-medium text-foreground">{formatBRL(result.taxesBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Outras taxas</span>
                  <span className="font-medium text-foreground">{formatBRL(result.otherFeesBRL)}</span>
                </li>
                <li className="mt-2 flex items-center justify-between border-t border-border pt-2 font-display text-base font-semibold text-foreground">
                  <span>Custo final</span>
                  <span className="text-primary">{formatBRL(result.totalCostBRL)}</span>
                </li>
                <li className="flex items-center justify-between pt-1 font-display text-sm font-semibold text-foreground">
                  <span>Custo por peça</span>
                  <span>{formatBRL(result.costPerPieceBRL)}</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="surface-card rounded-2xl p-5 text-center sm:p-8">
            <p className="font-display text-base font-semibold">Preencha o valor do produto para concluir a simulação.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe o valor do produto em yuan para iniciar o cálculo do custo final e custo por peça.
            </p>
          </div>
        )}
      </aside>

      <SaveAsImportationDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        payload={
          result
            ? {
                method: "cssbuy",
                currency: "CNY",
                exchangeRate: parseMoney(yuanRate),
                productTotal: parseMoney(productPrice),
                shipping: parseMoney(domesticShipping) + parseMoney(internationalShipping),
                fees: parseMoney(serviceFee) + parseMoney(otherChinaCosts),
                insurance: parseMoney(insurance),
                taxesBRL: result.taxesBRL,
                otherBRL: result.otherFeesBRL,
                totalBRL: result.totalCostBRL,
                unitPrice: parseMoney(productPrice),
              }
            : null
        }
      />
    </div>
  );
}
