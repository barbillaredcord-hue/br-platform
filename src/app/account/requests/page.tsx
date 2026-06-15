import { AccountRequests } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountRequestsPage() {
  return (
    <AccountShell title="Solicitudes" subtitle="Historial de solicitudes enviadas a B.R.">
      <AccountRequests />
    </AccountShell>
  );
}
