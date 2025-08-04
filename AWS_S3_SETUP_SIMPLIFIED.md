# Configuração AWS S3 - Guia Simplificado

## ✅ **Status Atual**

O sistema agora funciona com **fallback automático**:
- ✅ **AWS S3 configurado**: Usa S3 para upload
- ✅ **AWS S3 não configurado**: Usa upload local automaticamente
- ✅ **Upload de imagens funcionando**
- ✅ **Upload de arquivos funcionando**

## 🚀 **Como Funciona**

### **Modo Automático**
1. **Tenta usar AWS S3** primeiro
2. **Se falhar**, usa upload local automaticamente
3. **Não precisa** de configuração para funcionar

### **Logs no Console**
```
🚀 Iniciando upload de imagem...
📁 Arquivo recebido: { name: "test.jpg", size: 11, type: "image/jpeg" }
⚠️ S3 não disponível, usando fallback local
📁 Usando upload local
✅ Upload local concluído
```

## 🔧 **Configuração AWS S3 (Opcional)**

Se quiser usar AWS S3, siga estes passos:

### **1. Criar Bucket S3**
- Nome: `blog-images-akiko`
- Região: `sa-east-1` (São Paulo)
- Configurar como público

### **2. Criar Usuário IAM**
- Nome: `blog-upload-user`
- Política simplificada:

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

### **3. Configurar Variáveis de Ambiente**
Criar arquivo `.env.local`:

```env
AWS_ACCESS_KEY_ID=AKIA... (sua access key)
AWS_SECRET_ACCESS_KEY=... (sua secret key)
AWS_REGION=sa-east-1
AWS_S3_BUCKET_NAME=blog-images-akiko
```

## 🧪 **Testes**

### **Teste 1: Upload Local (Sem AWS)**
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
    "url": "/uploads/1754348735430-cs5kiifyuq.jpg",
    "path": "1754348735430-cs5kiifyuq.jpg"
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
    "url": "https://blog-images-akiko.s3.sa-east-1.amazonaws.com/images/2024/01/1754348735430-cs5kiifyuq.jpg",
    "path": "images/2024/01/1754348735430-cs5kiifyuq.jpg"
  }
}
```

## 📁 **Estrutura de Arquivos**

### **Upload Local**
```
public/uploads/
├── 1754348735430-cs5kiifyuq.jpg
├── 1754348735431-abc123.png
└── 1754348735432-def456.pdf
```

### **Upload S3**
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

## 🎯 **Vantagens da Solução**

1. **✅ Funciona imediatamente** - Sem configuração necessária
2. **✅ Fallback automático** - S3 → Local
3. **✅ Compatibilidade total** - Mesma API para ambos
4. **✅ Logs detalhados** - Fácil debug
5. **✅ URLs funcionais** - Imagens acessíveis

## 🔄 **Migração Gradual**

1. **Desenvolvimento**: Upload local
2. **Teste**: Configurar AWS S3
3. **Produção**: AWS S3 + CloudFront

## 📊 **Comparação**

| Aspecto | Upload Local | AWS S3 |
|---------|-------------|---------|
| **Configuração** | ✅ Zero | ⚙️ Necessária |
| **Performance** | 🟡 Média | ✅ Alta |
| **Escalabilidade** | 🟡 Limitada | ✅ Ilimitada |
| **Custo** | ✅ Grátis | 💰 Pago |
| **Disponibilidade** | ✅ 100% | ✅ 99.9% |

## 🚀 **Próximos Passos**

1. **Testar upload** no frontend
2. **Configurar AWS S3** (opcional)
3. **Configurar CloudFront** (opcional)
4. **Monitorar uso** e performance

## 📞 **Suporte**

- **Problemas**: Verificar logs do servidor
- **Configuração**: Seguir guia AWS S3
- **Performance**: Considerar CloudFront
- **Custos**: Monitorar uso do S3