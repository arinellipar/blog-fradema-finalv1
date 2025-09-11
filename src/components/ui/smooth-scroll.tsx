// src/components/ui/smooth-scroll.tsx - Componente para scroll suave

"use client";

import { useEffect } from "react";

export function SmoothScrollHandler() {
  useEffect(() => {
    // Função para scroll suave
    const smoothScroll = (targetId: string) => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    // Handler para links com hash
    const handleHashLinks = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash && target.hash.startsWith("#")) {
        e.preventDefault();
        const targetId = target.hash.slice(1);
        smoothScroll(targetId);

        // Atualiza a URL sem recarregar a página
        window.history.pushState({}, "", target.hash);
      }
    };

    // Adiciona event listeners
    document.addEventListener("click", handleHashLinks);

    // Verifica se há um hash na URL ao carregar a página
    if (window.location.hash) {
      setTimeout(() => {
        const targetId = window.location.hash.slice(1);
        smoothScroll(targetId);
      }, 100);
    }

    // Cleanup
    return () => {
      document.removeEventListener("click", handleHashLinks);
    };
  }, []);

  return null;
}
