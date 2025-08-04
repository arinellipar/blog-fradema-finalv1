"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🚀 Iniciando upload de teste:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      console.log("📦 FormData criado, enviando para API...");

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Resposta da API:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na resposta da API:", errorData);
        throw new Error(errorData.error || "Erro no upload");
      }

      const result = await response.json();
      console.log("✅ Resultado do upload:", result);
      setResult(result);
    } catch (error) {
      console.error("❌ Erro no upload:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Upload</h1>

      <div className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Selecione uma imagem:
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {uploading && (
          <div className="text-blue-600">⏳ Enviando arquivo...</div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            ❌ Erro: {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold text-green-800 mb-2">
              ✅ Upload Concluído!
            </h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            {result.image?.url && (
              <div className="mt-4">
                <img
                  src={result.image.url}
                  alt="Preview"
                  className="max-w-xs border rounded"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
