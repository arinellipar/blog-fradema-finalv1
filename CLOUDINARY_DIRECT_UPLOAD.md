# Upload Direto para Cloudinary (Frontend)

## 🚀 **Solução para contornar bloqueio do Vercel**

Como o Vercel está bloqueando as APIs, implementamos upload direto do frontend para o Cloudinary.

## 📋 **Configuração Necessária**

### **1. Criar Upload Preset no Cloudinary**

1. **Acesse o Dashboard do Cloudinary**
2. **Vá em "Settings"** → **"Upload"**
3. **Role até "Upload presets"**
4. **Clique em "Add upload preset"**
5. **Configure:**
   - **Name**: `blog-images`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `blog-images`
   - **Access Mode**: `public`

### **2. Configurar Variável de Ambiente**

No Vercel, adicione:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
```

### **3. Deploy**

Faça o deploy do projeto.

## 🧪 **Teste**

1. **Acesse**: `https://seu-dominio.vercel.app/dashboard/novo-post`
2. **Tente fazer upload de uma imagem**
3. **Verifique no console** se aparece:
   ```
   ✅ Upload Cloudinary concluído: {secure_url: "...", public_id: "..."}
   ```

## 🔧 **Como Funciona**

1. **Frontend** → **Cloudinary API** (sem passar pelo Vercel)
2. **Sem autenticação** necessária (preset público)
3. **URL pública** retornada imediatamente
4. **Sem bloqueios** do Vercel

## ⚠️ **Limitações**

- **Sem delete**: Arquivos permanecerão no Cloudinary
- **Sem validação server-side**: Validação apenas no frontend
- **Sem controle de acesso**: Qualquer um pode usar o preset

## 🎯 **Próximos Passos**

1. **Configure o upload preset** no Cloudinary
2. **Adicione a variável** no Vercel
3. **Faça o deploy**
4. **Teste o upload**

**Esta solução deve funcionar imediatamente!**