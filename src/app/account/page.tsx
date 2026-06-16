import { AccountOverview } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountPage() {
  return (
    <AccountShell title="Resumen" subtitle="Tu espacio privado para revisar accesos, solicitudes y datos de cuenta.">
      <AccountOverview />
    </AccountShell>
  );
}
