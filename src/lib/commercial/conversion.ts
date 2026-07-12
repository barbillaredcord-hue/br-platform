export interface CommercialUserConversionLike {
  id: string;
  total_access_beats?: number | null;
  total_paid_beats?: number | null;
  pending_payment_beats?: number | null;
}

export interface ConversionSummary {
  totalUsers: number;
  usersWithAccess: number;
  usersWithPayments: number;
  usersWithPendingPayments: number;
  totalAccesses: number;
  totalPaidBeats: number;
  totalPendingBeats: number;
  userPaymentConversionRate: number;
  accessToPaymentConversionRate: number;
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

export function buildConversionSummary(
  users: CommercialUserConversionLike[],
): ConversionSummary {
  let usersWithAccess = 0;
  let usersWithPayments = 0;
  let usersWithPendingPayments = 0;

  let totalAccesses = 0;
  let totalPaidBeats = 0;
  let totalPendingBeats = 0;

  for (const user of users) {
    const accesses = Number(user.total_access_beats ?? 0);
    const paid = Number(user.total_paid_beats ?? 0);
    const pending = Number(user.pending_payment_beats ?? 0);

    totalAccesses += accesses;
    totalPaidBeats += paid;
    totalPendingBeats += pending;

    if (accesses > 0) {
      usersWithAccess++;
    }

    if (paid > 0) {
      usersWithPayments++;
    }

    if (pending > 0) {
      usersWithPendingPayments++;
    }
  }

  return {
    totalUsers: users.length,
    usersWithAccess,
    usersWithPayments,
    usersWithPendingPayments,
    totalAccesses,
    totalPaidBeats,
    totalPendingBeats,
    userPaymentConversionRate: percentage(
      usersWithPayments,
      users.length,
    ),
    accessToPaymentConversionRate: percentage(
      totalPaidBeats,
      totalAccesses,
    ),
  };
}
