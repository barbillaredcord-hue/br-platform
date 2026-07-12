export interface CommercialTrendPaymentLike {
  amount?: number | string | null;
  created_at?: string | null;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  paymentCount: number;
}

export interface CommercialTrendsSummary {
  trends: MonthlyTrend[];
  currentMonth: MonthlyTrend | null;
  previousMonth: MonthlyTrend | null;
  bestMonth: MonthlyTrend | null;
  growthPercentage: number;
}

export function buildCommercialTrends(
  payments: CommercialTrendPaymentLike[],
  months = 12,
): CommercialTrendsSummary {
  const trendsByMonth = new Map<string, MonthlyTrend>();

  for (const payment of payments) {
    const amount = Number(payment.amount ?? 0);
    const date = payment.created_at ? new Date(payment.created_at) : null;

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !date ||
      !Number.isFinite(date.getTime())
    ) {
      continue;
    }

    const month = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;
    const trend = trendsByMonth.get(month) ?? {
      month,
      revenue: 0,
      paymentCount: 0,
    };

    trend.revenue += amount;
    trend.paymentCount += 1;
    trendsByMonth.set(month, trend);
  }

  const monthLimit = Math.max(0, Math.floor(months));
  const allTrends = [...trendsByMonth.values()].sort((left, right) =>
    left.month.localeCompare(right.month),
  );
  const trends = monthLimit > 0 ? allTrends.slice(-monthLimit) : [];
  const currentMonth = trends.at(-1) ?? null;
  const previousMonth = trends.at(-2) ?? null;
  const bestMonth = trends.reduce<MonthlyTrend | null>(
    (best, trend) => (!best || trend.revenue > best.revenue ? trend : best),
    null,
  );
  const growthPercentage =
    currentMonth && previousMonth && previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) /
          previousMonth.revenue) *
        100
      : 0;

  return {
    trends,
    currentMonth,
    previousMonth,
    bestMonth,
    growthPercentage,
  };
}
