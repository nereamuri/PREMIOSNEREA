import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premios Nerea",
  description: "Plataforma de votación de los Premios Nerea",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
