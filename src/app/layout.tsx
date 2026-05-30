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
  title: {
    default: 'Software para Taller Mecánico | AutoCoreFix',
    template: '%s | AutoCoreFix',
  },
  description: 'Digitaliza tu taller mecánico: crea órdenes de servicio, controla clientes y genera reportes en minutos. Prueba gratis 14 días, sin tarjeta.',
  keywords: ['software para taller mecánico', 'sistema para taller automotriz', 'control de órdenes de servicio', 'gestión taller mecánico México'],
  openGraph: {
    title: 'AutoCoreFix — Software para Taller Mecánico',
    description: 'Digitaliza tu taller: órdenes de servicio, clientes y reportes en un solo sistema.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'AutoCoreFix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoCoreFix — Software para Taller Mecánico',
    description: 'Digitaliza tu taller: órdenes de servicio, clientes y reportes en un solo sistema.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
