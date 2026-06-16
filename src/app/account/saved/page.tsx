import { AccountSaved } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountSavedPage() {
  return (
    <AccountShell title="Guardados" subtitle="Favoritos preparados como UI demo, sin persistencia todavía.">
      <AccountSaved />
    </AccountShell>
  );
}
