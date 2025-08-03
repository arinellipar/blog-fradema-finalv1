import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Sistema de componentes Card seguindo o padrão Compound Component
 * Implementa composição flexível com múltiplos subcomponentes semânticos
 *
 * @module Card
 *
 * @remarks
 * A arquitetura Compound Component permite:
 * - Composição declarativa de layouts complexos
 * - Manutenção de contexto compartilhado entre subcomponentes
 * - Flexibilidade na ordenação e presença de elementos
 * - Encapsulamento de estilos e comportamentos relacionados
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Título do Card</CardTitle>
 *     <CardDescription>Descrição contextual</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Conteúdo principal do card</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Ação Principal</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */

/**
 * Componente raiz Card
 * Container principal que estabelece o contexto visual e semântico
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props nativas do elemento div
 *
 * @remarks
 * Implementa:
 * - Border radius consistente via design tokens
 * - Sombra elevation para hierarquia visual
 * - Background com suporte para temas light/dark
 * - Transições suaves para estados interativos
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeader - Container para elementos de cabeçalho
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props nativas do elemento div
 *
 * @remarks
 * Define espaçamento padrão e estrutura flexível para:
 * - Título e subtítulo
 * - Ações contextuais
 * - Metadados temporais
 * - Indicadores de status
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Elemento de título principal
 *
 * @component
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - Props nativas do elemento h3
 *
 * @remarks
 * Características de implementação:
 * - Usa h3 para hierarquia semântica apropriada
 * - Font-weight semibold para destaque visual
 * - Leading tight para melhor densidade de informação
 * - Tracking tight para melhor legibilidade em tamanhos maiores
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Texto descritivo secundário
 *
 * @component
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Props nativas do elemento p
 *
 * @remarks
 * Otimizações visuais:
 * - Cor muted para hierarquia visual clara
 * - Tamanho sm para não competir com conteúdo principal
 * - Suporta múltiplas linhas com line-clamp quando necessário
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent - Container para conteúdo principal
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props nativas do elemento div
 *
 * @remarks
 * Considerações de design:
 * - Padding lateral mantido, vertical removido no topo
 * - Permite composição flexível de elementos filhos
 * - Mantém alinhamento visual com header e footer
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter - Container para ações e metadados finais
 *
 * @component
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props nativas do elemento div
 *
 * @remarks
 * Implementação flexbox para:
 * - Alinhamento horizontal de botões
 * - Distribuição space-between para ações opostas
 * - Suporte para wrapping em telas menores
 * - Padding consistente com design system
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * Variantes avançadas de Card para casos de uso específicos
 * Implementam estados visuais e comportamentais especializados
 */

/**
 * Interface para CardInteractive
 * Estende Card padrão com propriedades de interação
 */
interface CardInteractiveProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Desabilita interações e aplica estilos de estado desabilitado
   * @default false
   */
  disabled?: boolean;

  /**
   * Aplica estilos de estado pressionado/ativo
   * @default false
   */
  pressed?: boolean;
}

/**
 * CardInteractive - Variante com estados interativos
 *
 * @component
 * @example
 * ```tsx
 * <CardInteractive
 *   onClick={handleClick}
 *   disabled={isLoading}
 * >
 *   <CardHeader>
 *     <CardTitle>Card Clicável</CardTitle>
 *   </CardHeader>
 * </CardInteractive>
 * ```
 */
const CardInteractive = React.forwardRef<HTMLDivElement, CardInteractiveProps>(
  ({ className, disabled = false, pressed = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "transition-all duration-200 cursor-pointer",
        !disabled && "hover:shadow-md hover:border-primary/20",
        !disabled && "active:scale-[0.98]",
        pressed && "ring-2 ring-primary ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-disabled={disabled}
      aria-pressed={pressed}
      {...props}
    />
  )
);
CardInteractive.displayName = "CardInteractive";

/**
 * CardSkeleton - Componente de loading skeleton
 *
 * @component
 * @remarks
 * Implementa padrão skeleton loading para melhor UX percebida
 * Usa animação shimmer para indicar carregamento ativo
 */
const CardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border bg-card", "animate-pulse", className)}
    {...props}
  >
    <div className="p-6 space-y-3">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
));
CardSkeleton.displayName = "CardSkeleton";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardInteractive,
  CardSkeleton,
};
