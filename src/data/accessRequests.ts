export type AccessRequestStatus = "pending" | "contacted" | "payment_pending" | "paid" | "fulfilled" | "approved" | "rejected" | "cancelled";

export type AccessRequest = {
  id: string;
  user: string;
  beat: string;
  status: AccessRequestStatus;
  date: string;
};

export const accessRequests: AccessRequest[] = [
  {
    id: "req-001",
    user: "Demo User",
    beat: "Dust On My Name",
    status: "pending",
    date: "2026-06-14",
  },
  {
    id: "req-002",
    user: "Studio Buyer",
    beat: "Back Alley Receipt",
    status: "approved",
    date: "2026-06-13",
  },
  {
    id: "req-003",
    user: "Urban Producer",
    beat: "Dust On My Name",
    status: "rejected",
    date: "2026-06-12",
  },
];
