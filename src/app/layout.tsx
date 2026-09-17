import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WaSeller SaaS - CRM para WhatsApp",
  description: "Plataforma de CRM e automação usando a API Oficial do WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable}`}>
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}
