import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZimZAP SaaS - CRM e Automação",
  description: "Plataforma de CRM e automação usando a API Oficial do WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} theme-dark`}>
      <body className={outfit.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
