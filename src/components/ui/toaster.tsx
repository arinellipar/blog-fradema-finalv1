// src/components/ui/toaster.tsx

"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Props do componente Toaster
 */
interface ToasterProps {
  /**
   * Posição dos toasts na tela
   * @default "bottom-right"
   */
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

  /**
   * Tema dos toasts
   * @default "light"
   */
  theme?: "light" | "dark" | "system";

  /**
   * Número máximo de toasts visíveis
   * @default 3
   */
  toastOptions?: {
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    classNames?: {
      toast?: string;
      title?: string;
      description?: string;
      actionButton?: string;
      cancelButton?: string;
    };
  };
}

/**
 * Componente Toaster - Sistema de notificações
 *
 * Este componente deve ser incluído uma única vez no layout root
 * para que os toasts funcionem em toda a aplicação.
 *
 * @param props - Configurações do toaster
 *
 * @example
 * ```tsx
 * // Em app/layout.tsx
 * import { Toaster } from '@/components/ui/toaster'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function Toaster({
  position = "bottom-right",
  theme = "system",
  toastOptions,
}: ToasterProps = {}) {
  return (
    <Sonner
      position={position}
      theme={theme}
      toastOptions={{
        duration: 4000,
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        className:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        ...toastOptions,
      }}
      richColors
      closeButton
      expand
      visibleToasts={3}
    />
  );
}
