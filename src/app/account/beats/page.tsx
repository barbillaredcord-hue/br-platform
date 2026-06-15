import { AccountBeats } from "@/components/account/AccountData";
import { AccountShell } from "@/components/account/AccountShell";

export default function AccountBeatsPage() {
  return (
    <AccountShell title="Mis beats" subtitle="Beats con acceso completo, reproducción full y descarga MP3.">
      <AccountBeats />
    </AccountShell>
  );
}
