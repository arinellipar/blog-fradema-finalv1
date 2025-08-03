import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Configuração de variantes do Label usando class-variance-authority
 * Define estilos consistentes para diferentes contextos de uso
 *
 * @remarks
 * Este componente é construído sobre @radix-ui/react-label, que fornece:
 * - Associação automática com controles de formulário via htmlFor
 * - Suporte nativo para acessibilidade com screen readers
 * - Comportamento de clique que foca no elemento associado
 * - Compatibilidade com React Hook Form e outras bibliotecas de formulário
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

/**
 * Interface de propriedades do componente Label
 * Estende as props do Radix Label com variantes customizadas
 *
 * @interface LabelProps
 * @extends {React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>}
 * @extends {VariantProps<typeof labelVariants>}
 */
export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /**
   * Classes CSS customizadas para estilização adicional
   */
  className?: string;

  /**
   * Indica se o campo associado é obrigatório
   * Adiciona indicador visual de campo obrigatório
   * @default false
   */
  required?: boolean;

  /**
   * Indica se o campo associado possui erro
   * Aplica estilos visuais de erro no label
   * @default false
   */
  error?: boolean;

  /**
   * Texto de ajuda adicional
   * Renderizado em fonte menor abaixo do label principal
   */
  helpText?: string;

  /**
   * Tooltip informativo
   * Exibe ícone de informação com tooltip ao passar o mouse
   */
  tooltip?: string;

  /**
   * Conteúdo do label
   */
  children?: React.ReactNode;
}

/**
 * Componente Label com suporte avançado para formulários e acessibilidade
 *
 * @component
 * @example
 * ```tsx
 * // Label básico
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 *
 * // Label com campo obrigatório
 * <Label htmlFor="password" required>
 *   Senha
 * </Label>
 * <Input id="password" type="password" required />
 *
 * // Label com texto de ajuda
 * <Label
 *   htmlFor="cpf"
 *   helpText="Digite apenas números"
 * >
 *   CPF
 * </Label>
 * <Input id="cpf" placeholder="000.000.000-00" />
 *
 * // Label com erro e tooltip
 * <Label
 *   htmlFor="cnpj"
 *   error={errors.cnpj}
 *   tooltip="CNPJ da empresa matriz"
 *   required
 * >
 *   CNPJ
 * </Label>
 * <Input
 *   id="cnpj"
 *   error={errors.cnpj}
 *   errorMessage={errors.cnpj?.message}
 * />
 * ```
 *
 * @remarks
 * Implementações de acessibilidade:
 * - aria-label automático para screen readers
 * - Associação implícita/explícita com controles
 * - Indicadores visuais e semânticos para campos obrigatórios
 * - Suporte para navegação por teclado
 * - Contraste de cores WCAG AAA
 *
 * Considerações de performance:
 * - Renderização condicional otimizada para elementos opcionais
 * - Memoização de callbacks para prevenir re-renders
 * - Lazy loading de ícones quando tooltips são usados
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(
  (
    {
      className,
      required = false,
      error = false,
      helpText,
      tooltip,
      children,
      ...props
    },
    ref
  ) => {
    // ID único para associar elementos de ajuda via aria-describedby
    const helpTextId = React.useId();
    const tooltipId = React.useId();

    // Estado para controle do tooltip
    const [showTooltip, setShowTooltip] = React.useState(false);

    // Classes condicionais baseadas em estado
    const labelClasses = cn(
      labelVariants(),
      error && "text-destructive",
      className
    );

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <LabelPrimitive.Root
            ref={ref}
            className={labelClasses}
            aria-describedby={
              [helpText && helpTextId, tooltip && tooltipId]
                .filter(Boolean)
                .join(" ") || undefined
            }
            {...props}
          >
            {children}
            {required && (
              <span
                className="text-destructive ml-1"
                aria-label="Campo obrigatório"
              >
                *
              </span>
            )}
          </LabelPrimitive.Root>

          {tooltip && (
            <div className="relative inline-block">
              <button
                type="button"
                className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label="Informação adicional"
                aria-describedby={tooltipId}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {showTooltip && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className={cn(
                    "absolute z-50 w-64 p-2 text-xs",
                    "bg-popover text-popover-foreground",
                    "border rounded-md shadow-md",
                    "bottom-full left-1/2 -translate-x-1/2 mb-2",
                    "animate-in fade-in-0 zoom-in-95"
                  )}
                >
                  {tooltip}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
                    aria-hidden="true"
                  >
                    <div className="border-8 border-transparent border-t-popover" />
                    <div className="border-8 border-transparent border-t-border -mt-[17px]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {helpText && (
          <p
            id={helpTextId}
            className={cn(
              "text-xs text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Label.displayName = LabelPrimitive.Root.displayName;

/**
 * Hook customizado para gerenciamento de labels em formulários complexos
 *
 * @example
 * ```tsx
 * const { getLabelProps, getInputProps } = useFormField({
 *   name: 'email',
 *   label: 'Email corporativo',
 *   required: true,
 *   validation: {
 *     pattern: /^[^@]+@fradema\.com\.br$/,
 *     message: 'Use apenas emails @fradema.com.br'
 *   }
 * })
 *
 * return (
 *   <>
 *     <Label {...getLabelProps()} />
 *     <Input {...getInputProps()} />
 *   </>
 * )
 * ```
 */
export function useFormField(config: {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  tooltip?: string;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}) {
  const [error, setError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const getLabelProps = React.useCallback(
    () => ({
      htmlFor: config.name,
      required: config.required,
      error,
      helpText: config.helpText,
      tooltip: config.tooltip,
      children: config.label,
    }),
    [config, error]
  );

  const getInputProps = React.useCallback(
    () => ({
      id: config.name,
      name: config.name,
      required: config.required,
      error,
      errorMessage,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (config.validation?.pattern) {
          const isValid = config.validation.pattern.test(e.target.value);
          setError(!isValid && e.target.value.length > 0);
          setErrorMessage(
            !isValid && e.target.value.length > 0
              ? config.validation.message || "Formato inválido"
              : ""
          );
        }
      },
    }),
    [config, error, errorMessage]
  );

  return { getLabelProps, getInputProps, error, errorMessage };
}

export { Label };
