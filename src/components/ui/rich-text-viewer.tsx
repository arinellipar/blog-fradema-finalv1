"use client";

import React from "react";
import "react-quill-new/dist/quill.snow.css";
import { fixQuillListsOnRender } from "@/lib/fix-quill-lists";

interface RichTextViewerProps {
  content: string;
  className?: string;
}

// Função para processar e corrigir listas no HTML
function processListsInHTML(html: string): string {
  // Criar um elemento temporário para manipular o DOM
  if (typeof window === "undefined") return html;

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // DEBUG: Ver o HTML original
  console.log("🔍 [DEBUG] HTML Original completo:", html);

  // Procurar TODAS as listas OL que deveriam ser UL
  const allOLs = Array.from(temp.querySelectorAll("ol"));
  const allULs = Array.from(temp.querySelectorAll("ul"));

  console.log(
    `📊 [DEBUG] Encontradas ${allOLs.length} listas OL e ${allULs.length} listas UL`
  );

  // Verificar se há OL com classe de bullet
  allOLs.forEach((ol, index) => {
    const hasBulletClass = ol.classList.contains("ql-list-bullet");
    const firstLi = ol.querySelector("li");
    const hasBulletData = firstLi?.getAttribute("data-list") === "bullet";

    console.log(
      `📝 OL[${index}]: classes="${ol.className}", hasBulletClass=${hasBulletClass}, hasBulletData=${hasBulletData}`
    );

    // Se tem classe ou data-list de bullet, converter para UL
    if (hasBulletClass || hasBulletData) {
      console.log(`🔄 Convertendo OL[${index}] para UL`);
      const newUL = document.createElement("ul");
      newUL.className = ol.className;

      // Copiar todos os filhos
      while (ol.firstChild) {
        newUL.appendChild(ol.firstChild);
      }

      // Substituir
      ol.parentNode?.replaceChild(newUL, ol);
    }
  });

  // Encontrar todos os elementos <li> com data-list
  const listItems = Array.from(temp.querySelectorAll("li[data-list]"));

  if (listItems.length === 0) {
    console.log("⚠️ Nenhum item de lista com data-list encontrado");
    const result = temp.innerHTML;
    console.log("🔍 [DEBUG] HTML Final:", result);
    return result;
  }

  console.log(`📋 Encontrados ${listItems.length} itens de lista`);

  // Agrupar itens consecutivos do mesmo tipo
  const groups: { type: string; items: Element[]; parent: Element | null }[] =
    [];
  let currentGroup: {
    type: string;
    items: Element[];
    parent: Element | null;
  } | null = null;

  listItems.forEach((li, index) => {
    const listType = li.getAttribute("data-list") || "";
    const parent = li.parentElement;

    console.log(`Item ${index}: tipo=${listType}, pai=${parent?.tagName}`);

    // Verificar se devemos iniciar um novo grupo
    if (
      !currentGroup ||
      currentGroup.type !== listType ||
      currentGroup.parent !== parent
    ) {
      currentGroup = { type: listType, items: [], parent };
      groups.push(currentGroup);
    }

    currentGroup.items.push(li);
  });

  console.log(`📦 Criados ${groups.length} grupos de listas`);

  // Processar cada grupo em ordem reversa para evitar problemas de DOM
  groups.reverse().forEach((group, groupIndex) => {
    if (group.items.length === 0) return;

    const shouldBeUL = group.type === "bullet";
    const shouldBeOL = group.type === "ordered";
    const correctTag = shouldBeUL ? "UL" : "OL";

    console.log(
      `Grupo ${groupIndex}: tipo=${group.type}, deve ser ${correctTag}, ${group.items.length} itens`
    );

    const firstItem = group.items[0];
    const parent = firstItem.parentElement;

    if (!parent) {
      console.log(`⚠️ Grupo ${groupIndex}: sem pai`);
      return;
    }

    // Se o pai não for a tag correta, criar uma nova lista
    if (parent.tagName !== correctTag) {
      console.log(
        `🔄 Grupo ${groupIndex}: convertendo ${parent.tagName} para ${correctTag}`
      );

      const newList = document.createElement(correctTag.toLowerCase());

      // Copiar classes do pai original
      if (parent.className) {
        newList.className = parent.className;
      }

      // Adicionar classe específica
      newList.classList.add(shouldBeUL ? "ql-list-bullet" : "ql-list-ordered");

      // Inserir a nova lista antes do primeiro item
      parent.parentNode?.insertBefore(newList, parent);

      // Mover todos os itens do grupo para a nova lista
      group.items.forEach((item) => {
        newList.appendChild(item.cloneNode(true));
      });

      // Remover os itens originais do pai antigo
      group.items.forEach((item) => {
        if (item.parentElement === parent) {
          item.remove();
        }
      });

      // Se o pai antigo ficou vazio, remover
      if (parent.children.length === 0) {
        parent.remove();
      }
    } else {
      console.log(
        `✅ Grupo ${groupIndex}: já está na tag correta (${correctTag})`
      );
    }
  });

  const result = temp.innerHTML;
  console.log("✅ Processamento concluído");
  console.log("🔍 [DEBUG] HTML Final processado:", result);

  // Verificação final
  const finalOLs = temp.querySelectorAll("ol");
  const finalULs = temp.querySelectorAll("ul");
  console.log(
    `📊 [FINAL] ${finalOLs.length} listas OL e ${finalULs.length} listas UL após processamento`
  );

  return result;
}

export function RichTextViewer({
  content,
  className = "",
}: RichTextViewerProps) {
  // Processar o conteúdo para garantir listas corretas
  const [processedContent, setProcessedContent] = React.useState(content);

  React.useEffect(() => {
    // Usar a função utilitária mais robusta
    const processed = fixQuillListsOnRender(content);
    setProcessedContent(processed);
  }, [content]);

  return (
    <>
      <style jsx global>{`
        /* Estilização do conteúdo renderizado do Quill */
        .rich-text-viewer h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1e293b;
        }

        .rich-text-viewer h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #334155;
        }

        .rich-text-viewer h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: #475569;
        }

        .rich-text-viewer p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }

        .rich-text-viewer ul,
        .rich-text-viewer ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .rich-text-viewer ul {
          list-style-type: disc !important;
          counter-reset: none !important;
        }

        .rich-text-viewer ul li {
          counter-increment: none !important;
        }

        .rich-text-viewer ul li::before {
          content: none !important;
          display: none !important;
        }

        .rich-text-viewer ol {
          list-style-type: decimal !important;
        }

        /* Suporte para classes do Quill */
        .rich-text-viewer li[data-list="bullet"],
        .rich-text-viewer .ql-list-bullet,
        .rich-text-viewer .ql-list-bullet li {
          list-style-type: disc !important;
        }

        .rich-text-viewer li[data-list="ordered"],
        .rich-text-viewer .ql-list-ordered,
        .rich-text-viewer .ql-list-ordered li {
          list-style-type: decimal !important;
        }

        /* Garantir que ul dentro do viewer sempre use disc */
        .rich-text-viewer ul,
        .rich-text-viewer ul li {
          list-style-type: disc !important;
        }

        /* Garantir que ol dentro do viewer sempre use decimal */
        .rich-text-viewer ol,
        .rich-text-viewer ol li {
          list-style-type: decimal !important;
        }

        .rich-text-viewer li {
          margin-bottom: 0.5rem;
        }

        .rich-text-viewer blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #4b5563;
          font-style: italic;
        }

        .rich-text-viewer pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
          font-family: "Courier New", monospace;
        }

        .rich-text-viewer code {
          background: #f1f5f9;
          color: #dc2626;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: "Courier New", monospace;
        }

        .rich-text-viewer pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        .rich-text-viewer a {
          color: #3b82f6;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .rich-text-viewer a:hover {
          color: #2563eb;
        }

        .rich-text-viewer img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .rich-text-viewer strong {
          font-weight: 700;
          color: #1e293b;
        }

        .rich-text-viewer em {
          font-style: italic;
        }

        .rich-text-viewer u {
          text-decoration: underline;
        }

        .rich-text-viewer s {
          text-decoration: line-through;
        }

        .rich-text-viewer .ql-align-center {
          text-align: center;
        }

        .rich-text-viewer .ql-align-right {
          text-align: right;
        }

        .rich-text-viewer .ql-align-justify {
          text-align: justify;
        }

        .rich-text-viewer .ql-indent-1 {
          padding-left: 3em;
        }

        .rich-text-viewer .ql-indent-2 {
          padding-left: 6em;
        }

        .rich-text-viewer .ql-indent-3 {
          padding-left: 9em;
        }

        /* Tamanhos do Quill */
        .rich-text-viewer .ql-size-small {
          font-size: 0.75em;
        }

        .rich-text-viewer .ql-size-large {
          font-size: 1.5em;
        }

        .rich-text-viewer .ql-size-huge {
          font-size: 2.5em;
        }

        /* Video embeds */
        .rich-text-viewer iframe {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>

      <div
        className={`rich-text-viewer text-slate-700 text-lg ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </>
  );
}
