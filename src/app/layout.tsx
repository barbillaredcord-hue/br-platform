import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BrandIntro } from "@/components/BrandIntro";
import { PlayerBar } from "@/components/PlayerBar";
import { PlayerProvider } from "@/context/PlayerContext";
import { UserProvider } from "@/context/UserContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brstudios.org"),
  title: "B.R — Beat Room | BR STUDIOS",
  description: "Plataforma privada de beats, previews y accesos exclusivos.",
  applicationName: "B.R — Beat Room",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/br-platform-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/br-platform-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#050607",
};

const introSessionScript = `try{if(sessionStorage.getItem("br-brand-intro-seen-v1")==="1")document.documentElement.classList.add("br-intro-seen")}catch{}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introSessionScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <BrandIntro />
        <UserProvider>
          <PlayerProvider>
            {children}
            <PlayerBar />
          </PlayerProvider>
        </UserProvider>
      </body>
    </html>
  );
}
