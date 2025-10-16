"use client";

import React from "react";
import "react-quill-new/dist/quill.snow.css";

interface RichTextViewerProps {
  content: string;
  className?: string;
}

// Função alternativa mais agressiva para forçar bullets
function forceCorrectListTypes(html: string): string {
  if (typeof window === "undefined") return html;

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Encontrar TODAS as listas (OL e UL)
  const allLists = temp.querySelectorAll("ol, ul");

  allLists.forEach((list) => {
    // Verificar indicadores de que deveria ser uma lista com bullets
    const shouldBeBullet =
      list.classList.contains("ql-list-bullet") ||
      list.querySelector('li[data-list="bullet"]') !== null ||
      // Se tem classe que sugere bullet
      Array.from(list.classList).some((cls) => cls.includes("bullet"));

    const shouldBeOrdered =
      list.classList.contains("ql-list-ordered") ||
      list.querySelector('li[data-list="ordered"]') !== null ||
      // Se tem classe que sugere ordered
      Array.from(list.classList).some((cls) => cls.includes("ordered"));

    // Se detectamos que deveria ser bullet mas é OL, converter
    if (shouldBeBullet && list.tagName === "OL") {
      const newUL = document.createElement("ul");
      newUL.className = list.className;
      if (!newUL.classList.contains("ql-list-bullet")) {
        newUL.classList.add("ql-list-bullet");
      }

      // Copiar todos os filhos
      while (list.firstChild) {
        newUL.appendChild(list.firstChild);
      }

      list.parentNode?.replaceChild(newUL, list);
    }
    // Se detectamos que deveria ser ordered mas é UL, converter
    else if (shouldBeOrdered && list.tagName === "UL") {
      const newOL = document.createElement("ol");
      newOL.className = list.className;
      if (!newOL.classList.contains("ql-list-ordered")) {
        newOL.classList.add("ql-list-ordered");
      }

      // Copiar todos os filhos
      while (list.firstChild) {
        newOL.appendChild(list.firstChild);
      }

      list.parentNode?.replaceChild(newOL, list);
    }
  });

  return temp.innerHTML;
}

export function RichTextViewerAlternative({
  content,
  className = "",
}: RichTextViewerProps) {
  const [processedContent, setProcessedContent] = React.useState(content);

  React.useEffect(() => {
    const processed = forceCorrectListTypes(content);
    setProcessedContent(processed);
  }, [content]);

  return (
    <>
      <style jsx global>{`
        /* Forçar estilos de lista - ULTRA AGRESSIVO */
        .rich-text-viewer-alt ul,
        .rich-text-viewer-alt .ql-list-bullet {
          list-style: disc !important;
          list-style-type: disc !important;
          list-style-position: outside !important;
        }

        .rich-text-viewer-alt ul li,
        .rich-text-viewer-alt .ql-list-bullet li {
          list-style: inherit !important;
          list-style-type: disc !important;
          display: list-item !important;
        }

        .rich-text-viewer-alt ul li::before,
        .rich-text-viewer-alt .ql-list-bullet li::before {
          content: none !important;
          display: none !important;
        }

        .rich-text-viewer-alt ul li::marker {
          content: "•" !important;
        }

        .rich-text-viewer-alt ol,
        .rich-text-viewer-alt .ql-list-ordered {
          list-style: decimal !important;
          list-style-type: decimal !important;
          list-style-position: outside !important;
        }

        .rich-text-viewer-alt ol li,
        .rich-text-viewer-alt .ql-list-ordered li {
          list-style: inherit !important;
          list-style-type: decimal !important;
          display: list-item !important;
        }

        /* Resetar qualquer counter CSS */
        .rich-text-viewer-alt ul,
        .rich-text-viewer-alt ul li {
          counter-reset: none !important;
          counter-increment: none !important;
        }
      `}</style>

      <div
        className={`rich-text-viewer-alt ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </>
  );
}
