import { useEffect, useState } from "react";
import { getDashboardData } from "@/app/actions/dashboard";

export type FinanceMetric = {
  id: string;
  label: string;
  value: number;
  hint: string;
  emphasis?: "primary" | "positive" | "neutral";
};

export type DashboardGoal = {
  name: string;
  targetValue: number;
  currentValue: number;
  averageTicket: number;
};

export type MonthPoint = { month: string; receita: number; lucro: number };

export type DashboardData = {
  metrics: FinanceMetric[];
  goal: DashboardGoal | null;
  monthly: MonthPoint[];
  counts: { importations: number; products: number; sales: number };
};

export function useDashboardData(): {
  data: DashboardData | null;
  isPending: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsPending(true);
        const result = await getDashboardData();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setIsPending(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isPending, error };
}
