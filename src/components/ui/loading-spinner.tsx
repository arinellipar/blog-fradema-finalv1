// src/components/ui/loading-spinner.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses = {
  primary: "border-primary-600 border-t-transparent",
  secondary: "border-secondary-600 border-t-transparent",
  white: "border-white border-t-transparent",
  gray: "border-gray-400 border-t-transparent",
};

export default function LoadingSpinner({
  size = "md",
  color = "primary",
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2",
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Componente de loading para páginas inteiras
export function PageLoadingSpinner({
  text = "Carregando...",
}: {
  text?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="relative">
          {/* Círculo externo girando */}
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>

          {/* Círculo interno girando em direção oposta */}
          <div className="w-8 h-8 border-2 border-purple-200 rounded-full animate-spin absolute top-4 left-4">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
        </div>

        <p className="mt-4 text-lg font-medium text-gray-700">{text}</p>
        <p className="mt-2 text-sm text-gray-500">Aguarde um momento...</p>
      </div>
    </div>
  );
}

// Componente de loading para seções específicas
export function SectionLoadingSpinner({
  text = "Carregando...",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        {/* Círculo girando com gradiente */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-spin">
          <div className="w-12 h-12 rounded-full bg-white m-0.5"></div>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600">{text}</p>
    </div>
  );
}
