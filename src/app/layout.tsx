import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { Metadata } from "next";
import { ModalProvider } from "@/components/ModalProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "App i3",
  description: "Índice da Indústria Inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ModalProvider>{children}</ModalProvider>
      </body>
    </html>
  );
}
