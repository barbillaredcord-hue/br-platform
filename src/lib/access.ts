import { demoUsers, type DemoUser } from "@/data/users";

export function canAccessBeat(userId: string, beatId: string) {
  const user = demoUsers.find((item) => item.id === userId);

  return Boolean(user?.accessibleBeatIds.includes(beatId));
}

export function getUsersWithAccessToBeat(beatId: string, users: DemoUser[] = demoUsers) {
  return users.filter((user) => user.accessibleBeatIds.includes(beatId));
}

export function getUsersWithBeatAccess(beatId: string) {
  return getUsersWithAccessToBeat(beatId);
}

export function grantBeatAccess(users: DemoUser[], userId: string, beatId: string) {
  return users.map((user) => {
    if (user.id !== userId || user.accessibleBeatIds.includes(beatId)) {
      return user;
    }

    return { ...user, accessibleBeatIds: [...user.accessibleBeatIds, beatId] };
  });
}

export function revokeBeatAccess(users: DemoUser[], userId: string, beatId: string) {
  return users.map((user) => {
    if (user.id !== userId) {
      return user;
    }

    return { ...user, accessibleBeatIds: user.accessibleBeatIds.filter((id) => id !== beatId) };
  });
}

export function getPublicAccessLabel(beatId: string, users: DemoUser[] = demoUsers) {
  const usersWithAccess = getUsersWithAccessToBeat(beatId, users);

  if (usersWithAccess.length === 0) {
    return "Disponible";
  }

  if (usersWithAccess.length === 1) {
    return `Comprado por @${usersWithAccess[0].username}`;
  }

  return `Acceso de ${usersWithAccess.length} usuarios`;
}
