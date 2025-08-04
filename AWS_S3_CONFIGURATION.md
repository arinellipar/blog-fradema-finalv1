# Configuração AWS S3 - Guia Completo

## ✅ **Status Atual**

O upload está funcionando com **upload local**:
- ✅ API funcionando: `/api/upload/image`
- ✅ Arquivos salvos em: `public/uploads/`
- ✅ URLs funcionais: `/uploads/filename.jpg`
- ✅ Frontend funcionando

## 🔧 **Configuração AWS S3 (Opcional)**

### **Passo 1: Criar Bucket S3**

1. **Acesse AWS Console**:
   - Vá para [aws.amazon.com](https://aws.amazon.com)
   - Faça login na sua conta
   - Acesse S3

2. **Criar bucket**:
   - Nome: `blog-images-akiko`
   - Região: `sa-east-1` (São Paulo)
   - Configurações:
     - ✅ Bloquear todo acesso público (desmarcar)
     - ✅ Versionamento (opcional)

3. **Configurar bucket policy**:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::blog-images-akiko/*"
        }
    ]
}
```

### **Passo 2: Criar Usuário IAM**

1. **Acesse IAM no AWS Console**
2. **Criar usuário**:
   - Nome: `blog-upload-user`
   - Acesso programático

3. **Anexar política**:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::blog-images-akiko/*"
            ]
        }
    ]
}
```

4. **Gerar credenciais**:
   - Access Key ID
   - Secret Access Key

### **Passo 3: Configurar Variáveis de Ambiente**

Criar arquivo `.env.local`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA... (sua access key)
AWS_SECRET_ACCESS_KEY=... (sua secret key)
AWS_REGION=sa-east-1
AWS_S3_BUCKET_NAME=blog-images-akiko

# Outras configurações...
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

### **Passo 4: Ativar AWS S3**

Após configurar as variáveis, modificar a API para usar S3:

```typescript
// src/app/api/upload/image/route.ts
// Descomentar as linhas do AWS S3
```

## 🧪 **Testes**

### **Teste 1: Upload Local (Atual)**
```bash
curl -X POST -F "file=@test.jpg" http://localhost:3000/api/upload/image
```

**Resposta esperada**:
```json
{
  "success": true,
  "image": {
    "name": "test.jpg",
    "size": 11,
    "type": "image/jpeg",
    "url": "/uploads/1754349322431-zc53ril4q6i.jpg",
    "path": "1754349322431-zc53ril4q6i.jpg"
  }
}
```

### **Teste 2: Upload com AWS S3**
Após configurar AWS S3:
```bash
curl -X POST -F "file=@test.jpg" http://localhost:3000/api/upload/image
```

**Resposta esperada**:
```json
{
  "success": true,
  "image": {
    "name": "test.jpg",
    "size": 11,
    "type": "image/jpeg",
    "url": "https://blog-images-akiko.s3.sa-east-1.amazonaws.com/images/2024/01/1754349322431-zc53ril4q6i.jpg",
    "path": "images/2024/01/1754349322431-zc53ril4q6i.jpg"
  }
}
```

## 📁 **Estrutura de Arquivos**

### **Upload Local (Atual)**
```
public/uploads/
├── 1754349322431-zc53ril4q6i.jpg
├── 1754348735430-cs5kiifyuq.jpg
└── 1754349001087-v9yh2pd2z3.jpg
```

### **Upload S3 (Futuro)**
```
blog-images-akiko/
├── images/
│   ├── 2024/
│   │   ├── 01/
│   │   └── 02/
│   └── 2025/
└── attachments/
    ├── 2024/
    └── 2025/
```

## 🎯 **Vantagens de Cada Modo**

### **Upload Local**
- ✅ **Configuração zero**
- ✅ **Funciona imediatamente**
- ✅ **Sem custos**
- ✅ **Controle total**

### **Upload AWS S3**
- ✅ **Escalabilidade infinita**
- ✅ **Alta disponibilidade**
- ✅ **CDN global**
- ✅ **Backup automático**

## 🚀 **Próximos Passos**

1. **Testar upload no frontend**: `/dashboard/novo-post`
2. **Configurar AWS S3** (opcional): Para produção
3. **Configurar CloudFront** (opcional): Para melhor performance
4. **Monitorar uso**: Verificar custos e performance

## 📊 **Comparação de Custos**

| Aspecto | Upload Local | AWS S3 |
|---------|-------------|---------|
| **Configuração** | ✅ Zero | ⚙️ Necessária |
| **Custo** | ✅ Grátis | 💰 ~$0.023/GB/mês |
| **Escalabilidade** | 🟡 Limitada | ✅ Ilimitada |
| **Disponibilidade** | ✅ 100% | ✅ 99.9% |
| **Performance** | 🟡 Média | ✅ Alta |

## 🔄 **Migração Gradual**

1. **Desenvolvimento**: Upload local (atual)
2. **Teste**: Configurar AWS S3
3. **Produção**: AWS S3 + CloudFront

## 📞 **Suporte**

- **Problemas**: Verificar logs do servidor
- **Configuração**: Seguir este guia
- **Performance**: Considerar CloudFront
- **Custos**: Monitorar uso do S3