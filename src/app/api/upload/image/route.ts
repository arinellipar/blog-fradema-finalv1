// src/app/api/upload/image/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAvailable } from "@/lib/supabase";

/**
 * Upload de imagem para o Supabase Storage
 * Suporta JPG, PNG, WebP, GIF
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se o Supabase está disponível
    if (!isSupabaseAvailable()) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Path no storage: images/{year}/{month}/{filename}
    const date = new Date();
    const storagePath = `images/${date.getFullYear()}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${fileName}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from("blog-images")
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      image: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: storagePath,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Deletar imagem do Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar se o Supabase está disponível
    if (!isSupabaseAvailable()) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Remover do Supabase Storage
    const { error } = await supabase.storage
      .from("blog-images")
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
