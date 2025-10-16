"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Importar React Quill dinamicamente para evitar problemas de SSR
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Carregando editor...</p>
      </div>
    </div>
  ),
});

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva seu conteúdo aqui...",
  className = "",
}: RichTextEditorProps) {
  const quillRef = React.useRef<any>(null);

  // Detectar URLs e convertê-las em links automaticamente
  React.useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // Handler para detectar URLs ao digitar
      quill.on("text-change", (delta: any, oldDelta: any, source: string) => {
        if (source === "user") {
          const text = quill.getText();
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          let match;

          while ((match = urlRegex.exec(text)) !== null) {
            const url = match[0];
            const index = match.index;

            // Verificar se já não é um link
            const format = quill.getFormat(index, url.length);
            if (!format.link) {
              quill.formatText(index, url.length, "link", url, "silent");
            }
          }
        }
      });
    }
  }, []);
  // Configuração da toolbar
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image"],
        ["blockquote", "code-block"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
        matchers: [
          // Matcher customizado para preservar listas com bullet points ao colar
          [
            Node.ELEMENT_NODE,
            (node: any, delta: any) => {
              // Se for uma lista UL (não ordenada), garantir que seja bullet
              if (node.tagName === "UL") {
                delta.ops = delta.ops.map((op: any) => {
                  if (op.attributes && op.attributes.list) {
                    return {
                      ...op,
                      attributes: { ...op.attributes, list: "bullet" },
                    };
                  }
                  return op;
                });
              }
              // Se for uma lista OL (ordenada), garantir que seja ordered
              if (node.tagName === "OL") {
                delta.ops = delta.ops.map((op: any) => {
                  if (op.attributes && op.attributes.list) {
                    return {
                      ...op,
                      attributes: { ...op.attributes, list: "ordered" },
                    };
                  }
                  return op;
                });
              }
              // Detectar e preservar links ao colar
              if (node.tagName === "A" && node.href) {
                const ops = delta.ops || [];
                return {
                  ops: ops.map((op: any) => ({
                    ...op,
                    attributes: { ...op.attributes, link: node.href },
                  })),
                };
              }
              return delta;
            },
          ],
        ],
      },
    }),
    []
  );

  const formats = [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "indent",
    "align",
    "link",
    "image",
    "blockquote",
    "code-block",
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
