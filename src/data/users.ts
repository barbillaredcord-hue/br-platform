export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: "admin" | "user";
  accessibleBeatIds: string[];
};

export const adminUser: User = {
  id: "brceo",
  name: "B.RCEO",
  username: "brceo",
  email: process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "admin@br.local",
  role: "admin",
  accessibleBeatIds: ["back-alley-receipt", "dust-on-my-name"],
};

export const demoUsers: User[] = [
  adminUser,
  {
    id: "cliente-uno",
    name: "Cliente Uno",
    username: "clienteuno",
    email: "clienteuno@example.com",
    role: "user",
    accessibleBeatIds: ["back-alley-receipt"],
  },
  {
    id: "cliente-dos",
    name: "Cliente Dos",
    username: "clientedos",
    email: "clientedos@example.com",
    role: "user",
    accessibleBeatIds: [],
  },
  {
    id: "artista-invitado",
    name: "Artista Invitado",
    username: "artistainvitado",
    email: "artistainvitado@example.com",
    role: "user",
    accessibleBeatIds: ["dust-on-my-name"],
  },
];
