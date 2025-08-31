#!/usr/bin/env node

/**
 * Script para testar a configuração do Cloudinary
 * Uso: node scripts/test-cloudinary.js
 */

const fs = require("fs");
const path = require("path");

// Carregar variáveis de ambiente manualmente
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          envVars[key.trim()] = value.slice(1, -1);
        } else {
          envVars[key.trim()] = value;
        }
      }
    });

    Object.assign(process.env, envVars);
  }
}

loadEnv();

async function testCloudinary() {
  console.log("🧪 Testando configuração do Cloudinary...\n");

  // Verificar credenciais
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log("📋 Credenciais:");
  console.log(
    `   Cloud Name: ${cloudName ? "✅ Configurado" : "❌ Não configurado"}`
  );
  console.log(
    `   API Key: ${apiKey ? "✅ Configurado" : "❌ Não configurado"}`
  );
  console.log(
    `   API Secret: ${apiSecret ? "✅ Configurado" : "❌ Não configurado"}\n`
  );

  if (!cloudName || !apiKey || !apiSecret) {
    console.log("❌ Algumas credenciais não estão configuradas!");
    console.log("📝 Configure-as no arquivo .env");
    return;
  }

  // Testar upload simples
  try {
    console.log("☁️ Testando upload para Cloudinary...");

    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Criar uma imagem base64 simples para teste
    const testImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        testImage,
        {
          folder: "blog-test",
          public_id: `test-${Date.now()}`,
          overwrite: true,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    console.log("✅ Upload de teste bem-sucedido!");
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Public ID: ${result.public_id}`);
  } catch (error) {
    console.log("❌ Erro no upload de teste:");
    console.log(`   ${error.message}`);

    if (error.message.includes("Unknown API key")) {
      console.log("\n🔧 Possíveis soluções:");
      console.log("1. Verifique se a API Key está correta");
      console.log("2. Verifique se a conta Cloudinary está ativa");
      console.log("3. Verifique se há restrições de IP na conta");
    } else if (error.message.includes("Invalid cloud_name")) {
      console.log("\n🔧 Possíveis soluções:");
      console.log("1. Verifique se o Cloud Name está correto");
      console.log("2. Acesse cloudinary.com para confirmar o cloud name");
    }
  }
}

testCloudinary().catch(console.error);
