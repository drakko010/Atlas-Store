"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { formatBRL, formatNumber } from "@/lib/format";
import {
  calculateUSCloser,
  type USCloserConfig,
  type USCloserInput,
  type USCloserResult,
} from "@/features/uscloser/calculator";
import { getUsCloserSettings, type UsCloserSettings } from "@/app/actions/settings";
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

function formatMoneyInput(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InputRow({
  label,
  badge,
  prefix,
  value,
  onChange,
  placeholder,
  helper,
  type = "money",
}: {
  label: string;
  badge?: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  type?: "money" | "number";
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
        <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
          {prefix}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none placeholder:text-muted-foreground"
        />
      </div>
      {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function ResultRow({
  label,
  value,
  prefix = "R$",
  accent,
}: {
  label: string;
  value: number;
  prefix?: string;
  accent?: boolean;
}) {
  const formatted =
    prefix === "R$"
      ? formatBRL(value)
      : `${prefix} ${formatNumber(value)}`;

  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {formatted}
      </p>
    </div>
  );
}

export function USCloserCalculatorPanel() {
  const [settings, setSettings] = useState<UsCloserSettings | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const [productPrice, setProductPrice] = useState("0,00");
  const [declaredValue, setDeclaredValue] = useState("0,00");
  const [declaredValueTouched, setDeclaredValueTouched] = useState(false);
  const [weightLb, setWeightLb] = useState("1");
  const [declaredShipping, setDeclaredShipping] = useState("0,00");
  const [brazilPrice, setBrazilPrice] = useState("");
  const [commercialRate, setCommercialRate] = useState("5,00");

  useEffect(() => {
    getUsCloserSettings().then((s) => {
      setSettings(s);
      setCommercialRate(s.commercialRate.toLocaleString("pt-BR", { minimumFractionDigits: 4 }));
    });
  }, []);

  // Sincroniza valor declarado com valor pago até que o usuário edite o declarado
  useEffect(() => {
    if (!declaredValueTouched) {
      setDeclaredValue(productPrice);
    }
  }, [productPrice, declaredValueTouched]);

  const result: USCloserResult | null = useMemo(() => {
    const product = parseMoney(productPrice);
    if (product <= 0) return null;

    const input: USCloserInput = {
      productPrice: product,
      declaredValue: parseMoney(declaredValue),
      weightLb: Number(weightLb) || 1,
      declaredShipping: parseMoney(declaredShipping),
      brazilPrice: brazilPrice ? parseMoney(brazilPrice) : null,
      commercialRate: parseMoney(commercialRate),
    };

    const config: USCloserConfig = {
      importTax: settings?.importTax ?? 60,
      icms: settings?.icms ?? 17,
      otherFees: settings?.otherFees ?? 0,
      usCloserRateFactor: 1.026,
    };

    return calculateUSCloser(input, config);
  }, [productPrice, declaredValue, weightLb, declaredShipping, brazilPrice, commercialRate, settings]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Formulário */}
      <section className="space-y-4">
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold">Dados da compra e declaração</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O valor pago entra no custo real. O valor declarado entra na base dos impostos.
          </p>
        </div>

        <InputRow
          label="Valor pago pelo produto"
          badge="Obrigatório"
          prefix="US$"
          value={productPrice}
          onChange={setProductPrice}
          helper="Valor real desembolsado na compra."
        />

        <InputRow
          label="Valor declarado do produto"
          badge="Preenchido automaticamente"
          prefix="US$"
          value={declaredValue}
          onChange={(v) => {
            setDeclaredValue(v);
            setDeclaredValueTouched(true);
          }}
          helper="Acompanha o valor pago até você editar este campo."
        />

        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-display text-base font-semibold">Peso considerado no envio</label>
            <span className="rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Obrigatório · padrão 1 lb
            </span>
          </div>
          <div className="mt-3 flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
            <input
              type="text"
              inputMode="decimal"
              value={weightLb}
              onChange={(e) => setWeightLb(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
            />
            <span className="flex items-center border-l border-border bg-surface px-4 text-sm text-muted-foreground">
              lb
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Usado apenas para referência de envio.</p>
        </div>

        <InputRow
          label="Frete declarado"
          badge="Opcional"
          prefix="US$"
          value={declaredShipping}
          onChange={setDeclaredShipping}
          helper="Zero significa frete não declarado."
        />

        <InputRow
          label="Valor do item no Brasil"
          badge="Opcional"
          prefix="R$"
          value={brazilPrice}
          onChange={setBrazilPrice}
          placeholder="Digite para comparar"
          helper="Usado somente na comparação de economia."
        />

        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-display text-base font-semibold">Dólar comercial</label>
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
              value={commercialRate}
              onChange={(e) => setCommercialRate(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-base font-medium outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const saved = settings?.commercialRate ?? 5;
              setCommercialRate(saved.toLocaleString("pt-BR", { minimumFractionDigits: 4 }));
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar dólar
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            UsCloser = comercial × 1,026. Botão restaura o valor salvo nas configurações.
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
            Produto, frete real e serviço usam o dólar UsCloser. Os impostos usam o dólar comercial.
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

        {result ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <ResultRow label="Produto" value={result.productBRL} />
              <ResultRow label="Frete" value={result.shippingBRL} />
              <ResultRow
                label={`Imposto de importação ${settings?.importTax ?? 60}%`}
                value={result.importTaxBRL}
              />
              <ResultRow label={`ICMS ${settings?.icms ?? 17}%`} value={result.icmsBRL} />
              <ResultRow label="Outras taxas" value={result.otherFeesBRL} />
              <ResultRow label="Base declarada" value={result.taxBaseBRL} />
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5">
              <h3 className="font-display text-base font-semibold">Como o cálculo foi feito</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center justify-between">
                  <span>Produto</span>
                  <span className="font-medium text-foreground">{formatBRL(result.productBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Frete</span>
                  <span className="font-medium text-foreground">{formatBRL(result.shippingBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Base tributável</span>
                  <span className="font-medium text-foreground">{formatBRL(result.taxBaseBRL)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Impostos (II + ICMS)</span>
                  <span className="font-medium text-foreground">
                    {formatBRL(result.importTaxBRL + result.icmsBRL)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Taxas</span>
                  <span className="font-medium text-foreground">{formatBRL(result.otherFeesBRL)}</span>
                </li>
                <li className="mt-2 flex items-center justify-between border-t border-border pt-2 font-display text-base font-semibold text-foreground">
                  <span>Custo final</span>
                  <span className="text-primary">{formatBRL(result.totalCostBRL)}</span>
                </li>
              </ul>
            </div>

            <div className="surface-card rounded-2xl p-4 sm:p-5">
              <h3 className="font-display text-base font-semibold">Como a base tributária foi formada</h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Produto declarado</span>
                  <span className="font-medium text-foreground">
                    US$ {formatMoneyInput(parseMoney(declaredValue))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frete declarado</span>
                  <span className="font-medium text-foreground">
                    US$ {formatMoneyInput(parseMoney(declaredShipping))}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span>Total declarado</span>
                  <span className="font-medium text-foreground">
                    US$ {formatMoneyInput(parseMoney(declaredValue) + parseMoney(declaredShipping))}
                  </span>
                </div>
              </div>
            </div>

            {result.comparison && (
              <div className="surface-card rounded-2xl p-4 sm:p-5">
                <h3 className="font-display text-base font-semibold">Comparação com valor no Brasil</h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Valor no Brasil</span>
                    <span className="font-medium text-foreground">
                      {formatBRL(result.comparison.brazilPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Custo final importado</span>
                    <span className="font-medium text-foreground">{formatBRL(result.totalCostBRL)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diferença percentual</span>
                    <span
                      className={`font-medium ${result.comparison.differenceBRL >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {result.comparison.differencePercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span>Economia / Lucro</span>
                    <span
                      className={`font-display text-base font-semibold ${result.comparison.differenceBRL >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {formatBRL(result.comparison.differenceBRL)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="surface-card rounded-2xl p-5 text-center sm:p-8">
            <p className="font-display text-base font-semibold">Preencha o valor pago para concluir a simulação.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Informe o valor pago pelo produto para iniciar a simulação. O peso padrão já está definido em 1 lb.
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
                method: "uscloser",
                currency: "USD",
                exchangeRate: parseMoney(commercialRate),
                productTotal: parseMoney(productPrice),
                shipping: parseMoney(declaredShipping),
                fees: 0,
                insurance: 0,
                taxesBRL: result.importTaxBRL + result.icmsBRL,
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
