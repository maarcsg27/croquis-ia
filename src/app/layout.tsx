import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ROOMIA · Tu habitación, a tu manera",
  description:
    "Genera ideas de decoración y distribución en cada habitación de casa. Dibuja el plano de tu espacio, añade elementos fijos y obtén propuestas de interiorismo con IA, renders 3D fotorrealistas y lista de productos de compra.",
  openGraph: {
    title: "ROOMIA · Tu habitación, a tu manera",
    description:
      "Genera ideas de decoración y distribución en cada habitación de casa con IA.",
    siteName: "ROOMIA",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
