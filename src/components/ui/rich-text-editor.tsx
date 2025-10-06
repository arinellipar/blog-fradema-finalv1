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
      <style jsx global>{`
        .rich-text-editor .quill {
          border-radius: 0.5rem;
          border: 2px solid #e5e7eb;
          background: white;
        }

        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border: none;
          border-bottom: 2px solid #e5e7eb;
          background: linear-gradient(to right, #eff6ff, #eef2ff);
          padding: 12px;
        }

        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border: none;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.75;
          min-height: 400px;
        }

        .rich-text-editor .ql-editor {
          min-height: 400px;
          padding: 1.5rem;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          font-size: 1rem;
        }

        /* Estilização dos botões da toolbar */
        .rich-text-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .rich-text-editor .ql-toolbar button:hover {
          background: white;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }

        .rich-text-editor .ql-toolbar button.ql-active {
          background: #3b82f6;
          color: white;
        }

        .rich-text-editor .ql-toolbar .ql-picker {
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .rich-text-editor .ql-toolbar .ql-picker:hover {
          background: white;
        }

        /* Estilização do conteúdo */
        .rich-text-editor .ql-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .rich-text-editor .ql-editor p {
          margin-bottom: 1rem;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }

        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #4b5563;
          font-style: italic;
        }

        .rich-text-editor .ql-editor pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .rich-text-editor .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>

      <ReactQuill
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
