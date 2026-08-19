import type { Metadata } from "next";
import "./globals.css";
import "./methodology.css";

export const metadata: Metadata = {
  title: "Radar 2030 · Ingeniería Industrial en México",
  description: "Cinco escenarios para explorar el futuro de la ingeniería industrial en México.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
