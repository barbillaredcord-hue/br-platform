import { AccountSettings } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountSettingsPage() {
  return (
    <AccountShell title="Ajustes" subtitle="Edita tu username y display name en public.profiles.">
      <AccountSettings />
    </AccountShell>
  );
}
