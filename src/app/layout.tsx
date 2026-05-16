import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manager Lite",
  description: "Gestão simples para oficinas: clientes, OS e orçamentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
