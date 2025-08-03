import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Configuração de variantes do Button usando class-variance-authority
 * Define múltiplas variantes visuais e tamanhos de forma type-safe
 *
 * @remarks
 * Este componente implementa o padrão Compound Component com variantes
 * permitindo composição flexível e reutilização consistente
 */
const buttonVariants = cva(
  // Classes base aplicadas a todas as variantes
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Variante primária - botões de ação principal
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        // Variante destrutiva - ações perigosas ou irreversíveis
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        // Variante outline - botões secundários com borda
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",

        // Variante secundária - ações secundárias com destaque médio
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        // Variante ghost - mínimo destaque visual, usado em menus
        ghost: "hover:bg-accent hover:text-accent-foreground",

        // Variante link - aparência de link com comportamento de botão
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Tamanho padrão - uso geral
        default: "h-10 px-4 py-2",

        // Tamanho pequeno - espaços compactos
        sm: "h-9 rounded-md px-3",

        // Tamanho grande - CTAs principais
        lg: "h-11 rounded-md px-8",

        // Tamanho ícone - botões apenas com ícone
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Interface de props do componente Button
 * Estende HTMLButtonElement e adiciona props customizadas
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Permite renderizar o Button como um elemento filho customizado
   * Útil para integração com componentes de roteamento (Link do Next.js)
   */
  asChild?: boolean;
}

/**
 * Componente Button polimórfico e acessível
 *
 * @example
 * ```tsx
 * // Uso básico
 * <Button>Click me</Button>
 *
 * // Com variante e tamanho
 * <Button variant="outline" size="lg">
 *   Secondary Action
 * </Button>
 *
 * // Como Link do Next.js
 * <Button asChild>
 *   <Link href="/dashboard">Go to Dashboard</Link>
 * </Button>
 *
 * // Com ícone
 * <Button size="icon" variant="ghost">
 *   <Search className="h-4 w-4" />
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Determina o componente a ser renderizado
    // Slot permite composição polimórfica quando asChild é true
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

// Display name para debugging no React DevTools
Button.displayName = "Button";

export { Button, buttonVariants };
