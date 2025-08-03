# Configuração do AWS S3

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=blog-images

# CloudFront (opcional - para CDN)
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# Database Configuration (Prisma)
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# Email Configuration (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

## Configuração do AWS S3

### 1. Criar Bucket S3

1. **Acesse o AWS Console**:
   - Vá para [aws.amazon.com](https://aws.amazon.com)
   - Acesse o S3

2. **Criar novo bucket**:
   - Nome: `blog-images-akiko` (ou o nome que preferir)
   - Região: `us-east-1` (ou a região mais próxima)
   - Configurações:
     - ✅ Bloquear todo acesso público (desmarcar)
     - ✅ Versionamento (opcional)
     - ✅ Criptografia (recomendado)

3. **Configurar políticas de bucket**:
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

### 2. Criar Usuário IAM

1. **Acesse IAM no AWS Console**
2. **Criar novo usuário**:
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
            "Resource": "arn:aws:s3:::blog-images/*"
        }
    ]
}
```

4. **Gerar credenciais**:
   - Access Key ID
   - Secret Access Key

### 3. Configurar CloudFront (Opcional)

Para melhor performance e cache:

1. **Criar distribuição CloudFront**:
   - Origin Domain: `blog-images-akiko.s3.amazonaws.com`
   - Viewer Protocol Policy: `Redirect HTTP to HTTPS`
   - Cache Policy: `CachingOptimized`

2. **Configurar CORS no bucket**:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Estrutura de Storage

As imagens e arquivos são organizados assim:

```
blog-images/
├── images/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── 1703123456789-abc123.jpg
│   │   │   └── 1703123456790-def456.png
│   │   └── 02/
│   └── 2025/
└── attachments/
    ├── 2024/
    │   ├── 01/
    │   │   ├── 1703123456789-doc123.pdf
    │   │   └── 1703123456790-file456.docx
    │   └── 02/
    └── 2025/
```

## Funcionalidades Disponíveis

- **Upload de imagens**: Para posts do blog (`/api/upload/image`)
- **Upload de arquivos**: Para comentários (`/api/upload`)
- **Deleção de arquivos**: Via DELETE requests
- **URLs públicas**: Acesso direto via S3 ou CloudFront

## Segurança

### Políticas Recomendadas

1. **Bucket Policy** (para acesso público de leitura):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::blog-images/*"
        }
    ]
}
```

2. **CORS Policy**:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
        "ExposeHeaders": []
    }
]
```

## Desenvolvimento

Para desenvolvimento local:

1. **Instalar dependências**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

2. **Configurar variáveis de ambiente**
3. **Testar upload**:
```bash
curl -X POST -F "file=@test.jpg" http://localhost:3000/api/upload/image
```

## Produção

Para produção, certifique-se de:

1. ✅ Configurar todas as variáveis de ambiente
2. ✅ Configurar políticas de segurança adequadas
3. ✅ Configurar CloudFront para melhor performance
4. ✅ Configurar CORS adequadamente
5. ✅ Configurar domínios permitidos
6. ✅ Configurar backup automático do bucket
7. ✅ Configurar monitoramento e alertas

## Custos Estimados

- **S3 Storage**: ~$0.023/GB/mês
- **S3 Requests**: ~$0.0004/1000 requests
- **CloudFront**: ~$0.085/GB (primeiros 10TB)
- **Data Transfer**: ~$0.09/GB (S3 → CloudFront)

## Troubleshooting

### Erros Comuns

1. **"Access Denied"**:
   - Verificar IAM permissions
   - Verificar bucket policy

2. **"NoSuchBucket"**:
   - Verificar nome do bucket
   - Verificar região

3. **"InvalidAccessKeyId"**:
   - Verificar AWS_ACCESS_KEY_ID
   - Verificar AWS_SECRET_ACCESS_KEY

4. **"SignatureDoesNotMatch"**:
   - Verificar região
   - Verificar formato das credenciais