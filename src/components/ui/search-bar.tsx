// src/components/ui/search-bar.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Clock, TrendingUp, FileText } from "lucide-react";
import { cn, debounce, ROUTES } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Interface de resultados de busca
 * Define estrutura de dados retornados pela API
 *
 * @interface SearchResult
 * @remarks
 * Implementa padrão de dados unificado para diferentes tipos de conteúdo
 * permitindo busca polimórfica em posts, categorias e autores
 */
export interface SearchResult {
  id: string;
  type: "post" | "category" | "author" | "tag";
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  date?: Date;
  relevanceScore: number;
  highlights?: {
    title?: string;
    content?: string;
  };
}

/**
 * Interface de sugestões de busca
 * Fornece autocomplete e histórico
 *
 * @interface SearchSuggestion
 */
export interface SearchSuggestion {
  id: string;
  query: string;
  type: "recent" | "trending" | "suggestion";
  icon?: React.ReactNode;
  metadata?: {
    searchCount?: number;
    lastSearched?: Date;
  };
}

/**
 * Props do componente SearchBar
 * Configuração e callbacks de busca
 *
 * @interface SearchBarProps
 */
export interface SearchBarProps {
  /**
   * Placeholder do campo de busca
   * @default "Buscar artigos, categorias..."
   */
  placeholder?: string;

  /**
   * Tamanho do componente
   * @default "default"
   */
  size?: "sm" | "default" | "lg";

  /**
   * Variante visual
   * @default "default"
   */
  variant?: "default" | "outline" | "minimal";

  /**
   * Callback executado ao realizar busca
   * @param query - Termo de busca
   */
  onSearch?: (query: string) => void;

  /**
   * Habilita busca em tempo real
   * @default true
   */
  enableRealTimeSearch?: boolean;

  /**
   * Delay para busca em tempo real (ms)
   * @default 300
   */
  searchDelay?: number;

  /**
   * Número máximo de sugestões
   * @default 5
   */
  maxSuggestions?: number;

  /**
   * Classes CSS adicionais
   */
  className?: string;

  /**
   * Habilita histórico de busca
   * @default true
   */
  enableHistory?: boolean;

  /**
   * Habilita sugestões de busca
   * @default true
   */
  enableSuggestions?: boolean;

  /**
   * Posição do dropdown de sugestões
   * @default "bottom"
   */
  dropdownPosition?: "top" | "bottom";
}

/**
 * Estados internos do componente
 * Gerencia UI e dados de busca
 *
 * @interface SearchState
 */
interface SearchState {
  query: string;
  isOpen: boolean;
  isLoading: boolean;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  selectedIndex: number;
  error: string | null;
}

/**
 * Componente SearchBar avançado
 * Implementa busca com autocomplete, histórico e sugestões
 *
 * @component
 * @example
 * ```tsx
 * // Busca simples
 * <SearchBar
 *   placeholder="Buscar no blog..."
 *   onSearch={(query) => console.log('Buscando:', query)}
 * />
 *
 * // Busca com configurações avançadas
 * <SearchBar
 *   size="lg"
 *   variant="outline"
 *   enableRealTimeSearch={true}
 *   searchDelay={500}
 *   maxSuggestions={10}
 *   onSearch={handleSearch}
 * />
 * ```
 *
 * @remarks
 * Funcionalidades implementadas:
 * - Busca em tempo real com debounce configurável
 * - Autocomplete com resultados relevantes
 * - Histórico de buscas recentes
 * - Sugestões de busca trending
 * - Navegação por teclado (arrows, enter, escape)
 * - Highlights nos resultados
 * - Loading states otimizados
 * - Acessibilidade ARIA completa
 * - Performance com React.memo e useMemo
 */
export const SearchBar = React.memo<SearchBarProps>(
  ({
    placeholder = "Buscar artigos, categorias...",
    size = "default",
    variant = "default",
    onSearch,
    enableRealTimeSearch = true,
    searchDelay = 300,
    maxSuggestions = 5,
    className,
    enableHistory = true,
    enableSuggestions = true,
    dropdownPosition = "bottom",
  }) => {
    const router = useRouter();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Estado inicial
    const [state, setState] = React.useState<SearchState>({
      query: "",
      isOpen: false,
      isLoading: false,
      results: [],
      suggestions: [],
      selectedIndex: -1,
      error: null,
    });

    /**
     * Histórico de busca local
     * Persiste últimas buscas do usuário
     */
    const [searchHistory, setSearchHistory] = React.useState<string[]>(() => {
      if (typeof window === "undefined" || !enableHistory) return [];

      try {
        const history = localStorage.getItem("searchHistory");
        return history ? JSON.parse(history) : [];
      } catch {
        return [];
      }
    });

    // Persiste histórico no localStorage quando muda
    React.useEffect(() => {
      if (enableHistory && typeof window !== "undefined") {
        try {
          localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
        } catch (error) {
          console.error("Erro ao salvar histórico no localStorage:", error);
        }
      }
    }, [searchHistory, enableHistory]);

    /**
     * Salva busca no histórico
     * Mantém máximo de 10 itens
     *
     * @param query - Termo buscado
     */
    const saveToHistory = React.useCallback(
      (query: string) => {
        if (!enableHistory || !query.trim()) return;

        setSearchHistory((prev) => {
          const newHistory = [...prev];
          const index = newHistory.indexOf(query);

          if (index > -1) {
            newHistory.splice(index, 1);
          }

          newHistory.unshift(query);
          return newHistory.slice(0, 10);
        });
      },
      [enableHistory]
    );

    /**
     * API simulada de busca
     * Em produção, substituir por chamada real
     *
     * @param query - Termo de busca
     * @returns Resultados da busca
     */
    const performSearch = async (query: string): Promise<SearchResult[]> => {
      // Simula delay de rede
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Simula resultados
      if (
        query.toLowerCase().includes("tax") ||
        query.toLowerCase().includes("tribut")
      ) {
        return [
          {
            id: "1",
            type: "post",
            title: "Reforma Tributária 2024: O que muda para empresas",
            description:
              "Análise completa das mudanças propostas na reforma tributária...",
            url: "/blog/reforma-tributaria-2024",
            date: new Date("2024-01-15"),
            relevanceScore: 0.95,
            highlights: {
              title: "Reforma <mark>Tributária</mark> 2024",
              content:
                "Análise completa das mudanças propostas na reforma <mark>tributária</mark>...",
            },
          },
          {
            id: "2",
            type: "post",
            title: "Como reduzir a carga tributária legalmente",
            description:
              "Estratégias de planejamento tributário para otimização fiscal...",
            url: "/blog/planejamento-tributario",
            date: new Date("2024-01-10"),
            relevanceScore: 0.85,
          },
          {
            id: "3",
            type: "category",
            title: "Tributário",
            description: "45 artigos sobre direito tributário",
            url: "/blog/categoria/tributario",
            relevanceScore: 0.8,
          },
        ];
      }

      return [];
    };

    /**
     * Gera sugestões de busca
     * Combina histórico, trending e autocomplete
     *
     * @param query - Termo parcial
     * @returns Lista de sugestões
     */
    const generateSuggestions = React.useCallback(
      (query: string): SearchSuggestion[] => {
        const suggestions: SearchSuggestion[] = [];

        // Adiciona histórico recente
        if (enableHistory && query.length === 0) {
          searchHistory.slice(0, 3).forEach((item: string, index: number) => {
            suggestions.push({
              id: `history-${index}`,
              query: item,
              type: "recent",
              icon: <Clock className="w-4 h-4" />,
            });
          });
        }

        // Adiciona trending (simulado)
        if (enableSuggestions) {
          const trending = [
            "reforma tributária",
            "ICMS ST",
            "planejamento fiscal",
            "compliance tributário",
          ];

          trending
            .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 2)
            .forEach((item, index) => {
              suggestions.push({
                id: `trending-${index}`,
                query: item,
                type: "trending",
                icon: <TrendingUp className="w-4 h-4" />,
              });
            });
        }

        return suggestions.slice(0, maxSuggestions);
      },
      [enableHistory, enableSuggestions, searchHistory, maxSuggestions]
    );

    /**
     * Busca com debounce
     * Otimiza performance em busca tempo real
     */
    const debouncedSearch: (query: string) => void = React.useMemo(
      () =>
        debounce((...args: unknown[]) => {
          const query = args[0] as string;
          if (!query?.trim()) {
            setState((prev) => ({
              ...prev,
              results: [],
              isLoading: false,
            }));
            return undefined;
          }

          setState((prev) => ({ ...prev, isLoading: true, error: null }));

          performSearch(query)
            .then((results) => {
              setState((prev) => ({
                ...prev,
                results,
                isLoading: false,
              }));
            })
            .catch(() => {
              setState((prev) => ({
                ...prev,
                error: "Erro ao buscar. Tente novamente.",
                isLoading: false,
              }));
            });
          return undefined;
        }, searchDelay),
      [searchDelay]
    );

    /**
     * Handler de mudança no input
     * Atualiza query e dispara busca
     *
     * @param value - Novo valor do input
     */
    const handleInputChange = React.useCallback(
      (value: string) => {
        setState((prev) => ({
          ...prev,
          query: value,
          isOpen: true,
          suggestions: generateSuggestions(value),
        }));

        if (enableRealTimeSearch) {
          debouncedSearch(value);
        }
      },
      [enableRealTimeSearch, debouncedSearch, generateSuggestions]
    );

    /**
     * Handler de submissão de busca
     * Executa busca e navega para resultados
     *
     * @param e - Evento de form
     */
    const handleSubmit = React.useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();

        const query = state.query.trim();
        if (!query) return;

        saveToHistory(query);

        if (onSearch) {
          onSearch(query);
        } else {
          // Navega para página de resultados
          router.push(`${ROUTES.blog}?q=${encodeURIComponent(query)}`);
        }

        setState((prev) => ({ ...prev, isOpen: false }));
      },
      [state.query, saveToHistory, onSearch, router]
    );

    /**
     * Navegação por teclado
     * Implementa acessibilidade completa
     *
     * @param e - Evento de teclado
     */
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        const totalItems = state.results.length + state.suggestions.length;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setState((prev) => ({
              ...prev,
              selectedIndex: Math.min(prev.selectedIndex + 1, totalItems - 1),
            }));
            break;

          case "ArrowUp":
            e.preventDefault();
            setState((prev) => ({
              ...prev,
              selectedIndex: Math.max(prev.selectedIndex - 1, -1),
            }));
            break;

          case "Enter":
            if (state.selectedIndex >= 0) {
              e.preventDefault();
              const allItems = [...state.suggestions, ...state.results];
              const selected = allItems[state.selectedIndex];

              if (selected) {
                if ("query" in selected) {
                  // É uma sugestão
                  handleInputChange(selected.query);
                } else {
                  // É um resultado
                  router.push(selected.url);
                  setState((prev) => ({ ...prev, isOpen: false }));
                }
              }
            }
            break;

          case "Escape":
            setState((prev) => ({ ...prev, isOpen: false, selectedIndex: -1 }));
            inputRef.current?.blur();
            break;
        }
      },
      [
        state.results,
        state.suggestions,
        state.selectedIndex,
        handleInputChange,
        router,
      ]
    );

    /**
     * Click outside handler
     * Fecha dropdown ao clicar fora
     */
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setState((prev) => ({ ...prev, isOpen: false }));
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /**
     * Classes de tamanho baseadas na prop size
     */
    const sizeClasses = {
      sm: "h-8 text-sm",
      default: "h-10",
      lg: "h-12 text-lg",
    };

    /**
     * Classes de variante
     */
    const variantClasses = {
      default: "border border-input",
      outline: "border-2 border-primary",
      minimal: "border-0 border-b",
    };

    return (
      <div className={cn("relative w-full", className)}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
                size === "sm" ? "w-4 h-4" : "w-5 h-5"
              )}
            />

            <Input
              ref={inputRef}
              type="search"
              placeholder={placeholder}
              value={state.query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() =>
                setState((prev) => ({
                  ...prev,
                  isOpen: true,
                  suggestions: generateSuggestions(prev.query),
                }))
              }
              className={cn(
                "pl-10 pr-10",
                sizeClasses[size],
                variantClasses[variant],
                className
              )}
              autoComplete="off"
              aria-label="Buscar"
              aria-autocomplete="list"
              aria-expanded={state.isOpen}
              aria-controls="search-dropdown"
              aria-describedby={state.error ? "search-error" : undefined}
            />

            {/* Botão de limpar */}
            {state.query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    query: "",
                    results: [],
                    suggestions: [],
                  }));
                  inputRef.current?.focus();
                }}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2",
                  size === "sm" ? "h-6 w-6" : "h-8 w-8"
                )}
              >
                <X className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
                <span className="sr-only">Limpar busca</span>
              </Button>
            )}

            {/* Indicador de loading */}
            {state.isLoading && (
              <Loader2
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground",
                  size === "sm" ? "w-4 h-4" : "w-5 h-5"
                )}
              />
            )}
          </div>

          {/* Mensagem de erro */}
          {state.error && (
            <p id="search-error" className="mt-1 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </form>

        {/* Dropdown de resultados e sugestões */}
        {state.isOpen &&
          (state.suggestions.length > 0 || state.results.length > 0) && (
            <div
              ref={dropdownRef}
              id="search-dropdown"
              role="listbox"
              className={cn(
                "absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden",
                dropdownPosition === "top" ? "bottom-full mb-1" : "top-full"
              )}
            >
              {/* Sugestões */}
              {state.suggestions.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Sugestões
                  </div>
                  {state.suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      role="option"
                      aria-selected={state.selectedIndex === index}
                      onClick={() => handleInputChange(suggestion.query)}
                      className={cn(
                        "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent",
                        state.selectedIndex === index && "bg-accent"
                      )}
                    >
                      {suggestion.icon}
                      <span className="flex-1">{suggestion.query}</span>
                      {suggestion.type === "trending" && (
                        <span className="text-xs text-muted-foreground">
                          Popular
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Resultados de busca */}
              {state.results.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Resultados
                  </div>
                  {state.results.map((result, index) => {
                    const actualIndex = state.suggestions.length + index;
                    return (
                      <a
                        key={result.id}
                        href={result.url}
                        role="option"
                        aria-selected={state.selectedIndex === actualIndex}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(result.url);
                          setState((prev) => ({ ...prev, isOpen: false }));
                        }}
                        className={cn(
                          "block px-3 py-2 hover:bg-accent",
                          state.selectedIndex === actualIndex && "bg-accent"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-medium truncate"
                              dangerouslySetInnerHTML={{
                                __html:
                                  result.highlights?.title || result.title,
                              }}
                            />
                            {result.description && (
                              <div
                                className="text-sm text-muted-foreground line-clamp-1"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    result.highlights?.content ||
                                    result.description,
                                }}
                              />
                            )}
                          </div>
                          {result.date && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(result.date).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}

                  {/* Link para ver todos os resultados */}
                  <a
                    href={`${ROUTES.blog}?q=${encodeURIComponent(state.query)}`}
                    className="block px-3 py-2 text-sm text-primary hover:bg-accent border-t"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(
                        `${ROUTES.blog}?q=${encodeURIComponent(state.query)}`
                      );
                      setState((prev) => ({ ...prev, isOpen: false }));
                    }}
                  >
                    Ver todos os resultados para &quot;{state.query}&quot;
                  </a>
                </div>
              )}
            </div>
          )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

/**
 * Variante minimalista da SearchBar
 * Para uso em headers e sidebars
 *
 * @component
 */
export const SearchBarMinimal = React.memo<
  Pick<SearchBarProps, "placeholder" | "onSearch" | "className">
>(({ placeholder = "Buscar...", onSearch, className }) => {
  return (
    <SearchBar
      placeholder={placeholder}
      size="sm"
      variant="minimal"
      onSearch={onSearch}
      enableRealTimeSearch={false}
      enableHistory={false}
      enableSuggestions={false}
      className={className}
    />
  );
});

SearchBarMinimal.displayName = "SearchBarMinimal";
