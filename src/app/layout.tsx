import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Premios Nerea",
  description: "Plataforma de votación de los Premios Nerea",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${instrumentSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
