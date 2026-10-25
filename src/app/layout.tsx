import type { Metadata, Viewport } from "next"
import { Archivo, Shrikhand } from "next/font/google"

import "./globals.css"

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
})

const shrikhand = Shrikhand({
  variable: "--font-shrikhand",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "JM Burguer | Peça pelo WhatsApp",
  description:
    "Hambúrguer artesanal em Campinas. Monte seu pedido no cardápio e envie direto para o WhatsApp da loja.",
  openGraph: {
    title: "JM Burguer",
    description: "Monte seu pedido e envie pelo WhatsApp.",
    locale: "pt_BR",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#c8102e",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${shrikhand.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
