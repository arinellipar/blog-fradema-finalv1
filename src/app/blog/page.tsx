// src/app/blog/page.tsx - Página dedicada do blog (redirecionamento para home com scroll)

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BlogPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a home e faz scroll para a seção do blog
    router.replace("/#blog");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p>Redirecionando para o blog...</p>
      </div>
    </div>
  );
}