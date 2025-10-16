/**
 * Função utilitária para corrigir listas do Quill
 * O Quill às vezes salva listas com bullets como OL ao invés de UL
 */

export function fixQuillListsBeforeSave(html: string): string {
  if (!html) return "";

  let processed = html;

  // Método 1: Substituição direta por regex
  // Procurar por OL com classe ql-list-bullet
  processed = processed.replace(
    /<ol\s+class="[^"]*ql-list-bullet[^"]*"[^>]*>/gi,
    (match) => match.replace(/^<ol/, "<ul")
  );

  // Procurar por fechamento de OL que deveria ser UL
  const tempDiv = `<div>${processed}</div>`;
  const olPattern = /<ol([^>]*)>([\s\S]*?)<\/ol>/gi;

  processed = processed.replace(olPattern, (match, attrs, content) => {
    // Verificar se tem indicadores de bullet
    const hasBulletClass = attrs.includes("ql-list-bullet");
    const hasBulletData = content.includes('data-list="bullet"');

    if (hasBulletClass || hasBulletData) {
      console.log("🔄 [fixQuillLists] Convertendo OL para UL");
      return `<ul${attrs}>${content}</ul>`;
    }

    return match;
  });

  // Método 2: Procurar por padrões específicos do Quill
  // Quill às vezes usa <li data-list="bullet"> dentro de <ol>
  if (processed.includes('data-list="bullet"')) {
    // Usar uma abordagem mais agressiva
    const lines = processed.split("\n");
    const fixedLines: string[] = [];
    let insideBulletList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Detectar início de lista com bullet
      if (line.includes("<li") && line.includes('data-list="bullet"')) {
        insideBulletList = true;

        // Verificar a linha anterior para ver se é OL
        if (i > 0 && fixedLines[fixedLines.length - 1].includes("<ol")) {
          // Substituir OL por UL na linha anterior
          fixedLines[fixedLines.length - 1] = fixedLines[
            fixedLines.length - 1
          ].replace(/<ol/g, "<ul");
        }
      }

      // Detectar fim de lista
      if (insideBulletList && line.includes("</ol>")) {
        line = line.replace(/<\/ol>/g, "</ul>");
        insideBulletList = false;
      }

      fixedLines.push(line);
    }

    processed = fixedLines.join("\n");
  }

  // Método 3: Análise mais específica para classes do Quill
  // Substituir qualquer <ol class="ql-list-bullet"> por <ul class="ql-list-bullet">
  processed = processed.replace(
    /<ol\s+class="ql-list-bullet">/gi,
    '<ul class="ql-list-bullet">'
  );

  // Substituir fechamentos correspondentes
  processed = processed.replace(
    /<ol\s+class="ql-list-bullet">([\s\S]*?)<\/ol>/gi,
    '<ul class="ql-list-bullet">$1</ul>'
  );

  // Log para debug
  if (html !== processed) {
    console.log("✅ [fixQuillLists] Listas corrigidas no HTML");
    console.log("Original tinha OL:", (html.match(/<ol/gi) || []).length);
    console.log("Processado tem OL:", (processed.match(/<ol/gi) || []).length);
    console.log("Original tinha UL:", (html.match(/<ul/gi) || []).length);
    console.log("Processado tem UL:", (processed.match(/<ul/gi) || []).length);
  }

  return processed;
}

export function fixQuillListsOnRender(html: string): string {
  if (typeof window === "undefined") return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  // Encontrar todas as listas
  const allLists = container.querySelectorAll("ol, ul");
  let hasChanges = false;

  allLists.forEach((list) => {
    const isBulletList =
      list.classList.contains("ql-list-bullet") ||
      list.querySelector('li[data-list="bullet"]') !== null;

    const isOrderedList =
      list.classList.contains("ql-list-ordered") ||
      list.querySelector('li[data-list="ordered"]') !== null;

    // Se é OL mas deveria ser UL
    if (list.tagName === "OL" && isBulletList && !isOrderedList) {
      console.log("🔄 [fixQuillListsOnRender] Convertendo OL para UL");
      const newUL = document.createElement("ul");

      // Copiar todos os atributos
      Array.from(list.attributes).forEach((attr) => {
        newUL.setAttribute(attr.name, attr.value);
      });

      // Garantir que tem a classe correta
      if (!newUL.classList.contains("ql-list-bullet")) {
        newUL.classList.add("ql-list-bullet");
      }

      // Mover todos os filhos
      while (list.firstChild) {
        newUL.appendChild(list.firstChild);
      }

      // Substituir
      list.parentNode?.replaceChild(newUL, list);
      hasChanges = true;
    }
    // Se é UL mas deveria ser OL
    else if (list.tagName === "UL" && isOrderedList && !isBulletList) {
      console.log("🔄 [fixQuillListsOnRender] Convertendo UL para OL");
      const newOL = document.createElement("ol");

      // Copiar todos os atributos
      Array.from(list.attributes).forEach((attr) => {
        newOL.setAttribute(attr.name, attr.value);
      });

      // Garantir que tem a classe correta
      if (!newOL.classList.contains("ql-list-ordered")) {
        newOL.classList.add("ql-list-ordered");
      }

      // Mover todos os filhos
      while (list.firstChild) {
        newOL.appendChild(list.firstChild);
      }

      // Substituir
      list.parentNode?.replaceChild(newOL, list);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    console.log("✅ [fixQuillListsOnRender] Listas corrigidas no DOM");
  }

  return container.innerHTML;
}
