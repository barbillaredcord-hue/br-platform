import { AdminShell } from "@/components/admin/AdminShell";
import { allBeats } from "@/data/beats";
import { demoUsers } from "@/data/users";

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Usuarios demo"
      subtitle="Listado visual de usuarios y beats con acceso completo habilitado manualmente."
    >
      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101317]">
        <div className="hidden md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Beats autorizados</th>
              </tr>
            </thead>
            <tbody>
              {demoUsers.map((user) => {
                const authorizedBeats = allBeats.filter((beat) => user.accessibleBeatIds.includes(beat.id));
                return (
                  <tr key={user.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold">{user.name}</td>
                    <td className="px-4 py-3 text-cyan-200">@{user.username}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.role === "admin" ? "Admin" : "Usuario"}</td>
                    <td className="px-4 py-3 text-zinc-400">{authorizedBeats.length}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {demoUsers.map((user) => {
            const authorizedBeats = allBeats.filter((beat) => user.accessibleBeatIds.includes(beat.id));
            return (
              <article key={user.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
                <p className="font-semibold">{user.name}</p>
                <p className="mt-1 text-sm text-cyan-200">@{user.username}</p>
                <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                <p className="mt-1 text-sm text-zinc-400">Rol: {user.role === "admin" ? "Admin" : "Usuario"}</p>
                <p className="mt-3 text-sm text-zinc-300">Beats: {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}</p>
              </article>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
