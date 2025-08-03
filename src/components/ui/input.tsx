import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Interface de propriedades do componente Input
 * Estende todas as propriedades nativas do HTMLInputElement
 *
 * @interface InputProps
 * @extends {React.InputHTMLAttributes<HTMLInputElement>}
 *
 * @remarks
 * Este componente implementa um input controlado/não-controlado
 * com suporte completo para validação HTML5 e acessibilidade WCAG 2.1
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Estado de erro do input
   * Aplica estilos visuais de erro quando true
   */
  error?: boolean;

  /**
   * Mensagem de erro a ser exibida
   * Renderizada abaixo do input quando presente
   */
  errorMessage?: string;

  /**
   * Ícone a ser exibido no início do input
   * Aceita qualquer componente React válido
   */
  startIcon?: React.ReactNode;

  /**
   * Ícone a ser exibido no final do input
   * Aceita qualquer componente React válido
   */
  endIcon?: React.ReactNode;

  /**
   * Variante visual do input
   * @default "default"
   */
  variant?: "default" | "filled" | "flushed";
}

/**
 * Componente Input com suporte avançado para formulários
 *
 * @component
 * @example
 * ```tsx
 * // Input básico
 * <Input
 *   type="email"
 *   placeholder="Digite seu email"
 *   required
 * />
 *
 * // Input com validação e erro
 * <Input
 *   type="password"
 *   error={errors.password}
 *   errorMessage="Senha deve ter no mínimo 8 caracteres"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 *
 * // Input com ícones
 * <Input
 *   type="search"
 *   placeholder="Buscar artigos..."
 *   startIcon={<Search className="h-4 w-4" />}
 *   endIcon={loading && <Loader2 className="h-4 w-4 animate-spin" />}
 * />
 *
 * // Input com variante filled
 * <Input
 *   variant="filled"
 *   placeholder="Campo preenchido"
 * />
 * ```
 *
 * @remarks
 * O componente implementa:
 * - Forwarding de refs para acesso imperativo ao DOM
 * - Composição com ícones de forma performática
 * - Estados visuais para hover, focus, disabled e error
 * - Suporte completo para formulários controlados/não-controlados
 * - Validação HTML5 nativa com :invalid pseudo-class
 * - Acessibilidade com aria-invalid e aria-describedby
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error = false,
      errorMessage,
      startIcon,
      endIcon,
      variant = "default",
      disabled,
      ...props
    },
    ref
  ) => {
    // ID único para associar mensagem de erro via aria-describedby
    const errorId = React.useId();

    // Classes base compartilhadas entre todas as variantes
    const baseClasses = [
      "flex w-full rounded-md text-sm transition-colors",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ];

    // Classes específicas por variante
    const variantClasses = {
      default: [
        "h-10 border border-input bg-background px-3 py-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        error ? "border-destructive focus-visible:ring-destructive" : "",
      ],
      filled: [
        "h-10 bg-secondary/20 px-3 py-2 border-b-2 border-transparent",
        "hover:bg-secondary/30 focus:bg-secondary/30",
        "focus-visible:border-primary focus-visible:ring-0",
        error ? "border-destructive bg-destructive/10" : "",
      ],
      flushed: [
        "h-10 px-0 py-2 border-b border-input bg-transparent",
        "rounded-none focus-visible:ring-0",
        "focus-visible:border-primary",
        error ? "border-destructive" : "",
      ],
    };

    // Renderização condicional com ícones
    if (startIcon || endIcon) {
      return (
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {startIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              baseClasses,
              variantClasses[variant],
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={errorMessage ? errorId : undefined}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {endIcon}
            </div>
          )}

          {errorMessage && (
            <p
              id={errorId}
              className="mt-1 text-xs text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          )}
        </div>
      );
    }

    // Renderização padrão sem ícones
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(baseClasses, variantClasses[variant], className)}
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={errorMessage ? errorId : undefined}
          {...props}
        />

        {errorMessage && (
          <p
            id={errorId}
            className="mt-1 text-xs text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
