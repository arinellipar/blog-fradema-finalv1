"use client";

import React from "react";
import "react-quill-new/dist/quill.snow.css";

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export function RichTextViewer({
  content,
  className = "",
}: RichTextViewerProps) {
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
          list-style-type: disc;
        }

        .rich-text-viewer ol {
          list-style-type: decimal;
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
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
