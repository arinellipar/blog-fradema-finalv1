// src/app/blog/page.tsx

import * as React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BlogPostList } from "@/app/blog/blog-post-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog - Fradema Consultoria Tributária",
  description:
    "Artigos especializados em consultoria tributária e fiscal para manter você sempre atualizado",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Blog Fradema
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Artigos especializados em consultoria tributária e fiscal para
              manter você sempre atualizado com as últimas mudanças na
              legislação
            </p>
          </div>

          {/* Main Blog Content */}
          <BlogPostList />
        </div>
      </div>
    </div>
  );
}
