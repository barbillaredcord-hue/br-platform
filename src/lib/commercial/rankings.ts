export interface CommercialRankingUser {
  id: string;
  [key: string]: unknown;
}

export interface CommercialRankingBeat {
  id: string;
  [key: string]: unknown;
}

export interface CommercialRankingPayment {
  user_id?: string | null;
  beat_id?: string | null;
  amount?: number | string | null;
  payment_method?: string | null;
}

export interface UserCommercialRanking {
  user: CommercialRankingUser;
  revenue: number;
  paymentCount: number;
}

export interface BeatCommercialRanking {
  beat: CommercialRankingBeat;
  revenue: number;
  paymentCount: number;
}

export interface PaymentMethodCommercialRanking {
  paymentMethod: string;
  revenue: number;
  paymentCount: number;
}

export interface CommercialRankings {
  mostProfitableUser: UserCommercialRanking | null;
  mostProfitableBeat: BeatCommercialRanking | null;
  favoritePaymentMethod: PaymentMethodCommercialRanking | null;
  users: UserCommercialRanking[];
  beats: BeatCommercialRanking[];
  paymentMethods: PaymentMethodCommercialRanking[];
}

export function buildCommercialRankings(
  users: readonly CommercialRankingUser[],
  payments: readonly CommercialRankingPayment[],
  beats: readonly CommercialRankingBeat[],
): CommercialRankings {
  const userRankings = new Map<string, UserCommercialRanking>(
    users.map((user) => [user.id, { user, revenue: 0, paymentCount: 0 }]),
  );
  const beatRankings = new Map<string, BeatCommercialRanking>(
    beats.map((beat) => [beat.id, { beat, revenue: 0, paymentCount: 0 }]),
  );
  const methodRankings = new Map<string, PaymentMethodCommercialRanking>();

  for (const payment of payments) {
    const amount = Number(payment.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    if (payment.user_id) {
      const ranking = userRankings.get(payment.user_id);

      if (ranking) {
        ranking.revenue += amount;
        ranking.paymentCount++;
      }
    }

    if (payment.beat_id) {
      const ranking = beatRankings.get(payment.beat_id);

      if (ranking) {
        ranking.revenue += amount;
        ranking.paymentCount++;
      }
    }

    const paymentMethod = payment.payment_method?.trim() || "Sin especificar";
    const methodRanking = methodRankings.get(paymentMethod) ?? {
      paymentMethod,
      revenue: 0,
      paymentCount: 0,
    };

    methodRanking.revenue += amount;
    methodRanking.paymentCount++;
    methodRankings.set(paymentMethod, methodRanking);
  }

  const byRevenue = <T extends { revenue: number; paymentCount: number }>(
    left: T,
    right: T,
  ): number =>
    right.revenue - left.revenue || right.paymentCount - left.paymentCount;

  const rankedUsers = [...userRankings.values()]
    .filter((ranking) => ranking.revenue > 0 || ranking.paymentCount > 0)
    .sort(byRevenue);

  const rankedBeats = [...beatRankings.values()]
    .filter((ranking) => ranking.revenue > 0 || ranking.paymentCount > 0)
    .sort(byRevenue);
  const rankedPaymentMethods = [...methodRankings.values()].sort(
    (left, right) =>
      right.paymentCount - left.paymentCount ||
      right.revenue - left.revenue ||
      left.paymentMethod.localeCompare(right.paymentMethod),
  );
  return {
    mostProfitableUser: rankedUsers[0] ?? null,
    mostProfitableBeat: rankedBeats[0] ?? null,
    favoritePaymentMethod: rankedPaymentMethods[0] ?? null,
    users: rankedUsers,
    beats: rankedBeats,
    paymentMethods: rankedPaymentMethods,
  };
}
