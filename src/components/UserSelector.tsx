"use client";

import { useUser } from "@/context/UserContext";

export function UserSelector() {
  const { currentUser, users, setCurrentUser } = useUser();

  return (
    <label className="grid gap-1 text-xs text-zinc-400 md:min-w-48">
      Cambiar usuario demo
      <select
        value={currentUser.id}
        onChange={(event) => {
          const selectedUser = users.find((user) => user.id === event.target.value);
          if (selectedUser) {
            setCurrentUser(selectedUser);
          }
        }}
        className="h-11 rounded-md border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-300"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id} className="bg-[#101317] text-white">
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
