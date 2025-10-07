// src/app/layout.tsx - Versão atualizada

import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster"; // Nova importação
import { SITE_CONFIG } from "@/lib/utils";

// Configuração de fontes
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Metadata da aplicação
export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  // ... resto da metadata
};

// Configuração do viewport
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0073e6" },
    { media: "(prefers-color-scheme: dark)", color: "#0073e6" },
  ],
};

/**
 * Layout raiz da aplicação
 * Configura contextos globais, fontes e estrutura HTML base
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="pt-BR"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Meta tags e preloads */}
        <meta name="robots" content="noai, noimageai" />
        <meta name="googlebot" content="nosnippet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <meta name="application-name" content={SITE_CONFIG.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_CONFIG.name} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0073e6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>

      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Providers */}
        <AuthProvider>
          {/* Conteúdo principal */}
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>

          {/* Sistema de notificações - NOVO */}
          <Toaster
            position="bottom-right"
            theme="system"
            toastOptions={{
              duration: 4000,
              classNames: {
                toast:
                  "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                title: "group-[.toast]:text-foreground",
                description: "group-[.toast]:text-muted-foreground",
                actionButton:
                  "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton:
                  "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
              },
            }}
          />
        </AuthProvider>

        {/* Analytics (apenas em produção) */}
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {page_title: document.title,page_location: window.location.href});`,
                  }}
                />
              </>
            )}
          </>
        )}
      </body>
    </html>
  );
}
