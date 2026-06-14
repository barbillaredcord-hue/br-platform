import { demoUsers } from "@/data/users";

export function canAccessBeat(userId: string, beatId: string) {
  const user = demoUsers.find((item) => item.id === userId);

  return Boolean(user?.accessibleBeatIds.includes(beatId));
}

export function getUsersWithBeatAccess(beatId: string) {
  return demoUsers.filter((user) => user.accessibleBeatIds.includes(beatId));
}
