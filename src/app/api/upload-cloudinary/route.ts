import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando upload para Cloudinary API");
    console.log(
      "📋 Cloud Name:",
      process.env.CLOUDINARY_CLOUD_NAME ? "CONFIGURADO" : "NÃO CONFIGURADO"
    );

    // Teste rápido para verificar se a API está funcionando
    if (request.headers.get("x-test") === "true") {
      console.log("🧪 Modo de teste ativado");
      return NextResponse.json({
        success: true,
        message: "API funcionando",
        credentials: {
          cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: !!process.env.CLOUDINARY_API_KEY,
          apiSecret: !!process.env.CLOUDINARY_API_SECRET,
        },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ Nenhum arquivo fornecido");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(
      "📁 Arquivo recebido:",
      file.name,
      "Tamanho:",
      file.size,
      "Tipo:",
      file.type
    );

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

    // Converter arquivo para base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64String}`;

    console.log("☁️ Iniciando upload para Cloudinary...");

    // Verificar se as credenciais estão configuradas
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("❌ Credenciais do Cloudinary não configuradas");
      return NextResponse.json(
        {
          error: "Cloudinary credentials not configured",
          details: {
            cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: !!process.env.CLOUDINARY_API_KEY,
            apiSecret: !!process.env.CLOUDINARY_API_SECRET,
          },
        },
        { status: 500 }
      );
    }

    // Upload para Cloudinary com autenticação direta
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "blog-images",
          public_id: `blog-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 15)}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error(
              "❌ Erro detalhado do Cloudinary:",
              JSON.stringify(error, null, 2)
            );
            reject(
              new Error(
                `Cloudinary upload failed: ${error.message || "Unknown error"}`
              )
            );
          } else {
            console.log("✅ Upload Cloudinary bem-sucedido");
            resolve(result);
          }
        }
      );
    });

    return NextResponse.json({
      success: true,
      image: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: (result as any).secure_url,
        path: (result as any).public_id,
      },
    });
  } catch (error) {
    console.error("Erro no upload Cloudinary:", error);
    return NextResponse.json(
      {
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("path");

    if (!publicId) {
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Deletar do Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar do Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
