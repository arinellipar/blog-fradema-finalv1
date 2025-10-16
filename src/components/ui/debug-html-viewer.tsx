"use client";

import React from "react";

interface DebugHtmlViewerProps {
  content: string;
  title?: string;
}

export function DebugHtmlViewer({
  content,
  title = "Debug HTML",
}: DebugHtmlViewerProps) {
  const [showRaw, setShowRaw] = React.useState(false);

  // Analisar o HTML
  const analyzeHTML = () => {
    if (typeof window === "undefined") return null;

    const temp = document.createElement("div");
    temp.innerHTML = content;

    const analysis = {
      ols: temp.querySelectorAll("ol").length,
      uls: temp.querySelectorAll("ul").length,
      lisWithBullet: temp.querySelectorAll('li[data-list="bullet"]').length,
      lisWithOrdered: temp.querySelectorAll('li[data-list="ordered"]').length,
      olsWithBulletClass: temp.querySelectorAll("ol.ql-list-bullet").length,
      ulsWithOrderedClass: temp.querySelectorAll("ul.ql-list-ordered").length,
      totalLis: temp.querySelectorAll("li").length,
    };

    // Detalhes de cada lista
    const lists: any[] = [];
    temp.querySelectorAll("ol, ul").forEach((list, index) => {
      const firstLi = list.querySelector("li");
      lists.push({
        index,
        tag: list.tagName,
        classes: list.className,
        dataList: firstLi?.getAttribute("data-list"),
        childrenCount: list.children.length,
        innerHTML: list.outerHTML.substring(0, 200) + "...",
      });
    });

    return { analysis, lists };
  };

  const result = analyzeHTML();

  return (
    <div className="my-8 p-6 bg-gray-100 border-2 border-gray-300 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>

        {result && (
          <>
            <div className="mb-4 p-4 bg-white rounded border">
              <h4 className="font-semibold mb-2">📊 Análise do HTML:</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  • Total de &lt;ol&gt;:{" "}
                  <span className="font-mono bg-yellow-100 px-1">
                    {result.analysis.ols}
                  </span>
                </li>
                <li>
                  • Total de &lt;ul&gt;:{" "}
                  <span className="font-mono bg-green-100 px-1">
                    {result.analysis.uls}
                  </span>
                </li>
                <li>
                  • &lt;li&gt; com data-list="bullet":{" "}
                  <span className="font-mono bg-blue-100 px-1">
                    {result.analysis.lisWithBullet}
                  </span>
                </li>
                <li>
                  • &lt;li&gt; com data-list="ordered":{" "}
                  <span className="font-mono bg-orange-100 px-1">
                    {result.analysis.lisWithOrdered}
                  </span>
                </li>
                <li>
                  • &lt;ol&gt; com classe ql-list-bullet:{" "}
                  <span className="font-mono bg-red-100 px-1">
                    {result.analysis.olsWithBulletClass}
                  </span>
                </li>
                <li>
                  • &lt;ul&gt; com classe ql-list-ordered:{" "}
                  <span className="font-mono bg-purple-100 px-1">
                    {result.analysis.ulsWithOrderedClass}
                  </span>
                </li>
                <li>
                  • Total de &lt;li&gt;:{" "}
                  <span className="font-mono bg-gray-100 px-1">
                    {result.analysis.totalLis}
                  </span>
                </li>
              </ul>
            </div>

            {result.lists.length > 0 && (
              <div className="mb-4 p-4 bg-white rounded border">
                <h4 className="font-semibold mb-2">📋 Detalhes das Listas:</h4>
                <div className="space-y-2">
                  {result.lists.map((list) => (
                    <div
                      key={list.index}
                      className="p-2 bg-gray-50 rounded text-xs"
                    >
                      <div className="font-semibold">Lista {list.index}:</div>
                      <div>
                        Tag:{" "}
                        <span
                          className={`font-mono ${
                            list.tag === "OL" ? "bg-yellow-100" : "bg-green-100"
                          } px-1`}
                        >
                          {list.tag}
                        </span>
                      </div>
                      <div>
                        Classes:{" "}
                        <span className="font-mono bg-gray-200 px-1">
                          {list.classes || "nenhuma"}
                        </span>
                      </div>
                      <div>
                        data-list do primeiro li:{" "}
                        <span className="font-mono bg-blue-100 px-1">
                          {list.dataList || "nenhum"}
                        </span>
                      </div>
                      <div>Número de itens: {list.childrenCount}</div>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-blue-600">
                          Ver HTML
                        </summary>
                        <pre className="mt-1 p-2 bg-white overflow-x-auto text-xs">
                          {list.innerHTML}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showRaw ? "Esconder" : "Mostrar"} HTML Bruto
        </button>
      </div>

      {showRaw && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">HTML Bruto:</h4>
          <pre className="p-4 bg-black text-green-400 rounded overflow-x-auto text-xs">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
