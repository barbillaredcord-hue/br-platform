export interface CommercialPaymentLike {
  amount?: number | string | null;
  created_at?: string | null;
}

export interface RevenueSummary {
  today: number;
  last7Days: number;
  last30Days: number;
  thisMonth: number;
  total: number;
  averagePayment: number;
}

export function buildRevenueSummary(
  payments: CommercialPaymentLike[],
  now = new Date(),
): RevenueSummary {
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const last7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const last30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const nowTimestamp = now.getTime();
  const summary: RevenueSummary = {
    today: 0,
    last7Days: 0,
    last30Days: 0,
    thisMonth: 0,
    total: 0,
    averagePayment: 0,
  };

  let paymentCount = 0;

  for (const payment of payments) {
    const amount = Number(payment.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    paymentCount += 1;
    summary.total += amount;

    const timestamp = payment.created_at
      ? new Date(payment.created_at).getTime()
      : Number.NaN;

    if (!Number.isFinite(timestamp) || timestamp > nowTimestamp) {
      continue;
    }

    if (timestamp >= startToday) {
      summary.today += amount;
    }

    if (timestamp >= last7) {
      summary.last7Days += amount;
    }

    if (timestamp >= last30) {
      summary.last30Days += amount;
    }

    if (timestamp >= startMonth) {
      summary.thisMonth += amount;
    }
  }

  summary.averagePayment = paymentCount > 0 ? summary.total / paymentCount : 0;

  return summary;
}
