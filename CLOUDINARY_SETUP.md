# Configuração do Cloudinary para Upload de Imagens

## 🚀 **Por que Cloudinary?**

- ✅ **Gratuito** (até 25GB/mês)
- ✅ **Sem problemas de autenticação** no Vercel
- ✅ **CDN automático** para imagens
- ✅ **Transformações automáticas** (redimensionamento, otimização)
- ✅ **Fácil de configurar**

## 📋 **Passo a Passo**

### **1. Criar conta no Cloudinary**

1. Acesse [cloudinary.com](https://cloudinary.com)
2. Clique em **"Sign Up"**
3. Crie uma conta gratuita
4. Faça login no dashboard

### **2. Obter credenciais**

No dashboard do Cloudinary, você encontrará:
- **Cloud Name**
- **API Key**
- **API Secret**

### **3. Configurar variáveis de ambiente no Vercel**

No painel do Vercel, adicione estas variáveis:

| Nome | Valor |
|------|-------|
| `CLOUDINARY_CLOUD_NAME` | Seu cloud name |
| `CLOUDINARY_API_KEY` | Sua API key |
| `CLOUDINARY_API_SECRET` | Seu API secret |

### **4. Deploy**

Faça o deploy do projeto. A nova API `/api/upload-cloudinary` estará disponível.

## 🧪 **Teste**

```bash
curl -X POST -F "file=@test.jpg" https://seu-dominio.vercel.app/api/upload-cloudinary
```

**Resposta esperada:**
```json
{
  "success": true,
  "image": {
    "name": "test.jpg",
    "size": 12345,
    "type": "image/jpeg",
    "url": "https://res.cloudinary.com/seu-cloud-name/image/upload/v1234567890/blog-images/blog-1234567890-abc123.jpg",
    "path": "blog-images/blog-1234567890-abc123"
  }
}
```

## 🔧 **Vantagens do Cloudinary**

1. **URLs públicas**: As imagens são automaticamente públicas
2. **CDN global**: Carregamento rápido em qualquer lugar
3. **Transformações**: Pode redimensionar automaticamente
4. **Otimização**: Comprime imagens automaticamente
5. **Sem configuração complexa**: Funciona imediatamente

## 📊 **Limites gratuitos**

- **25GB** de armazenamento
- **25GB** de transferência por mês
- **25GB** de transformações por mês

**Perfeito para blogs e sites pequenos/médios!**

## 🎯 **Próximos passos**

1. **Crie a conta no Cloudinary**
2. **Configure as variáveis no Vercel**
3. **Faça o deploy**
4. **Teste o upload**

**O upload funcionará imediatamente sem problemas de autenticação!** 