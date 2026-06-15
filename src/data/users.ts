export type DemoUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  accessibleBeatIds: string[];
};

export const demoUser: DemoUser = {
  id: "demo-user",
  name: "Demo User",
  username: "demouser",
  email: "demo@example.com",
  accessibleBeatIds: ["back-alley-receipt"],
};

export const demoUsers: DemoUser[] = [
  demoUser,
  {
    id: "cliente-uno",
    name: "Cliente Uno",
    username: "clienteuno",
    email: "clienteuno@example.com",
    accessibleBeatIds: ["back-alley-receipt"],
  },
  {
    id: "cliente-dos",
    name: "Cliente Dos",
    username: "clientedos",
    email: "clientedos@example.com",
    accessibleBeatIds: [],
  },
  {
    id: "artista-invitado",
    name: "Artista Invitado",
    username: "artistainvitado",
    email: "artistainvitado@example.com",
    accessibleBeatIds: ["dust-on-my-name"],
  },
];
