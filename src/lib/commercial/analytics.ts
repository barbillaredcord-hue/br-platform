export type CommercialTrend = "up" | "down" | "stable";

export interface MonthlyRecordLike {
  created_at?: string | Date | null;
}

export interface CommercialMetricsInput {
  values?: ReadonlyArray<number | null | undefined> | null;
  currentValue?: number | null;
  previousValue?: number | null;
  conversions?: number | null;
  opportunities?: number | null;
}

export interface CommercialMetricsSummary {
  total: number;
  average: number;
  growthPercentage: number;
  trend: CommercialTrend;
  conversionRate: number;
}

function finiteValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculatePercentageGrowth(
  currentValue: number | null | undefined,
  previousValue: number | null | undefined,
): number {
  const current = finiteValue(currentValue);
  const previous = finiteValue(previousValue);

  if (previous === 0) {
    return 0;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

export function calculateTrend(
  currentValue: number | null | undefined,
  previousValue: number | null | undefined,
): CommercialTrend {
  const current = Math.max(0, finiteValue(currentValue));
  const previous = Math.max(0, finiteValue(previousValue));

  if (current > previous) {
    return "up";
  }

  if (current < previous) {
    return "down";
  }

  return "stable";
}

export function calculateSum(
  values: ReadonlyArray<number | null | undefined> | null | undefined,
): number {
  return (values ?? []).reduce<number>(
    (total, value) => total + finiteValue(value),
    0,
  );
}

export function calculateAverage(
  values: ReadonlyArray<number | null | undefined> | null | undefined,
): number {
  const validValues = (values ?? []).filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  return validValues.length > 0
    ? calculateSum(validValues) / validValues.length
    : 0;
}

export function calculateConversionRate(
  conversions: number | null | undefined,
  opportunities: number | null | undefined,
): number {
  const validConversions = Math.max(0, finiteValue(conversions));
  const validOpportunities = Math.max(0, finiteValue(opportunities));

  if (validOpportunities === 0) {
    return 0;
  }

  return Math.min(
    100,
    (validConversions / validOpportunities) * 100,
  );
}

export function groupRecordsByMonth<T extends MonthlyRecordLike>(
  records: ReadonlyArray<T | null | undefined> | null | undefined,
): Record<string, T[]> {
  const groupedRecords: Record<string, T[]> = {};

  for (const record of records ?? []) {
    if (!record?.created_at) {
      continue;
    }

    const date =
      record.created_at instanceof Date
        ? record.created_at
        : new Date(record.created_at);

    if (!Number.isFinite(date.getTime())) {
      continue;
    }

    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;

    (groupedRecords[month] ??= []).push(record);
  }

  return Object.fromEntries(
    Object.entries(groupedRecords).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

export function generateCommercialMetricsSummary(
  input: CommercialMetricsInput | null | undefined,
): CommercialMetricsSummary {
  const metrics = input ?? {};

  return {
    total: calculateSum(metrics.values),
    average: calculateAverage(metrics.values),
    growthPercentage: calculatePercentageGrowth(
      metrics.currentValue,
      metrics.previousValue,
    ),
    trend: calculateTrend(metrics.currentValue, metrics.previousValue),
    conversionRate: calculateConversionRate(
      metrics.conversions,
      metrics.opportunities,
    ),
  };
}
