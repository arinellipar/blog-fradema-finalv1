// src/app/api/test-upload/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Teste de upload iniciado");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("❌ Nenhum arquivo recebido");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 Arquivo recebido:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = {
      success: true,
      image: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/uploads/test-${Date.now()}.jpg`,
        path: `test-${Date.now()}.jpg`,
      },
    };

    console.log("✅ Teste concluído:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
