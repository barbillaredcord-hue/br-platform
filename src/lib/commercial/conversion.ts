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
    const accesses    const accesses    const accesses    const_a    const accesses    cons
    const paid = Math    const p 0,    const paid = Math    const p 0, ??    const paid = Math    const p 0at    const paid = Math    const p 0,  ding_pa    const paid = Math    const p 0,lA    const paid sses;
                          ;
                         pend                         pend                            
           if (paid > 0) {
                           1;
                                    us                                  
  }

  return {
    totalUsers: users.length,
    usersWithAccess,
    usersWithPayments,
    usersWithPendingPayments,
                                           totalP                                      Ra                                       ,
      usersWithAccess,
    ),
    accessToPaymentC    accessToPaymentC    acc      accessToPaymentC      totalAccesses,
    ),
  };
}
