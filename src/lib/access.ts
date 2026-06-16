import { demoUsers, type User } from "@/data/users";
import type { Beat } from "@/data/beats";

export function canAccessBeat(userId: string | null | undefined, beatId: string) {
  if (!userId) {
    return false;
  }

  const user = demoUsers.find((item) => item.id === userId);

  return Boolean(user?.accessibleBeatIds.includes(beatId));
}

export function userCanAccessBeat(user: User | null | undefined, beat: Pick<Beat, "id" | "dbId"> & { slug?: string | null }) {
  if (!user) {
    return false;
  }

  const accessIds = new Set(user.accessibleBeatIds.map(String));
  const beatIds = [beat.id, beat.dbId, beat.slug].filter(Boolean).map(String);

  return beatIds.some((id) => accessIds.has(id));
}

export function getUsersWithAccessToBeat(beatId: string, users: User[] = demoUsers) {
  return users.filter((user) => user.accessibleBeatIds.includes(beatId));
}

export function getUsersWithBeatAccess(beatId: string) {
  return getUsersWithAccessToBeat(beatId);
}

export function grantBeatAccess(users: User[], userId: string, beatId: string) {
  return users.map((user) => {
    if (user.id !== userId || user.accessibleBeatIds.includes(beatId)) {
      return user;
    }

    return { ...user, accessibleBeatIds: [...user.accessibleBeatIds, beatId] };
  });
}

export function revokeBeatAccess(users: User[], userId: string, beatId: string) {
  return users.map((user) => {
    if (user.id !== userId) {
      return user;
    }

    return { ...user, accessibleBeatIds: user.accessibleBeatIds.filter((id) => id !== beatId) };
  });
}

export function getPublicAccessLabel(beatId: string, users: User[] = demoUsers) {
  const usersWithAccess = getUsersWithAccessToBeat(beatId, users);

  if (usersWithAccess.length === 0) {
    return "Disponible";
  }

  if (usersWithAccess.length === 1) {
    return `Comprado por @${usersWithAccess[0].username}`;
  }

  return `Acceso de ${usersWithAccess.length} usuarios`;
}
