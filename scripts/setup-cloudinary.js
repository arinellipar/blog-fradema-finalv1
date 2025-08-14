#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente do Cloudinary
 * Uso: node scripts/setup-cloudinary.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupCloudinary() {
  console.log("🚀 Configuração do Cloudinary\n");
  console.log("Para obter suas credenciais:");
  console.log("1. Acesse: https://cloudinary.com");
  console.log("2. Faça login no dashboard");
  console.log('3. Copie as credenciais da seção "Account Details"\n');

  const cloudName = await question("Cloud Name: ");
  const apiKey = await question("API Key: ");
  const apiSecret = await question("API Secret: ");

  if (!cloudName || !apiKey || !apiSecret) {
    console.log("❌ Todas as credenciais são obrigatórias!");
    rl.close();
    return;
  }

  const envContent = `# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=${cloudName}
CLOUDINARY_API_KEY=${apiKey}
CLOUDINARY_API_SECRET=${apiSecret}
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${cloudName}
`;

  const envPath = path.join(process.cwd(), ".env.local");

  try {
    // Verificar se .env.local já existe
    let existingContent = "";
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, "utf8");
    }

    // Remover configurações do Cloudinary existentes
    const lines = existingContent
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("CLOUDINARY_") && !line.startsWith("# Cloudinary")
      );

    // Adicionar novas configurações
    const newContent = lines.join("\n") + "\n" + envContent;

    fs.writeFileSync(envPath, newContent.trim() + "\n");

    console.log("✅ Configuração salva em .env.local");
    console.log("\n📋 Próximos passos:");
    console.log("1. Configure o upload preset no Cloudinary:");
    console.log("   - Dashboard → Settings → Upload → Upload presets");
    console.log("   - Add upload preset: blog-images (unsigned, public)");
    console.log("2. Reinicie o servidor: npm run dev");
    console.log(
      "3. Teste o upload em: http://localhost:3000/dashboard/novo-post"
    );
  } catch (error) {
    console.error("❌ Erro ao salvar configuração:", error.message);
  }

  rl.close();
}

setupCloudinary().catch(console.error);
