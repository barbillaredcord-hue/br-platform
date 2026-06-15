export type DemoUser = {
  id: string;
  name: string;
  accessibleBeatIds: string[];
};

export const demoUser: DemoUser = {
  id: "demo-user",
  name: "Demo User",
  accessibleBeatIds: ["back-alley-receipt"],
};

export const demoUsers: DemoUser[] = [demoUser];
