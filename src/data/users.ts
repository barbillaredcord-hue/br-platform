export type DemoUser = {
  id: string;
  name: string;
  accessibleBeatIds: string[];
};

export const demoUser: DemoUser = {
  id: "demo-user",
  name: "Demo User",
  accessibleBeatIds: ["aqua-nights", "midnight-drill"],
};

export const demoUsers: DemoUser[] = [demoUser];
