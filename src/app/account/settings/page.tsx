import { AccountSettings } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountSettingsPage() {
  return (
    <AccountShell title="Ajustes" subtitle="Edita tu username y display name en public.profiles.">
      <AccountSettings />
    </AccountShell>
  );
}
