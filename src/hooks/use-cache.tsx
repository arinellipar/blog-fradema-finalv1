"use client";

import * as React from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  maxSize?: number; // Tamanho máximo do cache
}

class SimpleCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl: number): void {
    const now = Date.now();
    const expiresAt = now + ttl;

    // Se o cache está cheio, remover o item mais antigo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();

    // Verificar se expirou
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    const now = Date.now();

    // Verificar se expirou
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Limpar itens expirados
  cleanup(): void {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache global
const globalCache = new SimpleCache(200);

// Limpar cache expirado a cada 5 minutos
if (typeof window !== "undefined") {
  setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 minutos por padrão

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(
    async (force = false) => {
      // Verificar cache primeiro (se não for forçado)
      if (!force && globalCache.has(key)) {
        const cachedData = globalCache.get(key);
        if (cachedData !== null) {
          setData(cachedData);
          return cachedData;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();

        // Armazenar no cache
        globalCache.set(key, result, ttl);
        setData(result);

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Erro desconhecido");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [key, fetcher, ttl]
  );

  // Buscar dados na montagem do componente
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para invalidar cache
  const invalidate = React.useCallback(() => {
    globalCache.clear();
  }, []);

  // Função para refresh forçado
  const refresh = React.useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    isStale: data === null && !loading,
  };
}

// Hook específico para posts
export function useCachedPosts() {
  return useCache(
    "posts",
    async () => {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("Erro ao buscar posts");
      }
      return response.json();
    },
    { ttl: 5 * 60 * 1000 } // 5 minutos
  );
}

// Hook específico para categorias
export function useCachedCategories() {
  return useCache(
    "categories",
    async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
      }
      return response.json();
    },
    { ttl: 10 * 60 * 1000 } // 10 minutos
  );
}
