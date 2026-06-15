import { AccountOverview } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountPage() {
  return (
    <AccountShell title="Resumen" subtitle="Tu espacio privado para revisar accesos, solicitudes y datos de cuenta.">
      <AccountOverview />
    </AccountShell>
  );
}
