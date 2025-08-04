# Troubleshooting - Upload em Produção

## 🔍 **Diagnóstico de Problemas**

### **1. Teste Básico de Ambiente**

Acesse: `https://seu-dominio.com/api/test-production`

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Teste de produção concluído",
  "data": {
    "environment": "production",
    "currentDir": "/app",
    "uploadDir": "/app/public/uploads",
    "nodeVersion": "18.x.x",
    "platform": "linux"
  },
  "fileCreated": true,
  "fileSize": 45
}
```

### **2. Teste de Upload**

```bash
curl -X POST -F "file=@test.jpg" https://seu-dominio.com/api/test-production
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Upload de teste concluído",
  "file": {
    "name": "test.jpg",
    "size": 11,
    "savedAs": "test-1754349322431.txt",
    "path": "/app/public/uploads/test-1754349322431.txt"
  }
}
```

## 🚨 **Problemas Comuns e Soluções**

### **Problema 1: Permissões de Diretório**

**Sintoma**: Erro "EACCES" ou "Permission denied"

**Solução**:
```bash
# No servidor de produção
mkdir -p public/uploads
chmod 755 public/uploads
chown www-data:www-data public/uploads  # Se usar nginx/apache
```

### **Problema 2: Espaço em Disco**

**Sintoma**: Erro "ENOSPC" ou "No space left on device"

**Solução**:
```bash
# Verificar espaço
df -h

# Limpar arquivos antigos
find public/uploads -name "*.jpg" -mtime +30 -delete
```

### **Problema 3: Configuração do Next.js**

**Sintoma**: Arquivos não são servidos estaticamente

**Solução**: Verificar `next.config.ts`:
```typescript
// Configuração para servir arquivos estáticos
async rewrites() {
  return [
    {
      source: "/uploads/:path*",
      destination: "/uploads/:path*",
    },
  ];
},
```

### **Problema 4: Variáveis de Ambiente**

**Sintoma**: Erro de configuração

**Solução**: Verificar `.env.production`:
```env
NODE_ENV=production
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=your-secret
```

## 🔧 **Configuração para Diferentes Plataformas**

### **Vercel**

1. **Configurar variáveis de ambiente**:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

2. **Limitar tamanho de upload**:
   - Vercel tem limite de 4MB por padrão
   - Configurar `maxDuration` se necessário

### **Netlify**

1. **Configurar redirecionamentos**:
```toml
[[redirects]]
  from = "/uploads/*"
  to = "/uploads/:splat"
  status = 200
```

2. **Configurar funções serverless**:
   - Usar Netlify Functions para upload

### **Railway/Render**

1. **Configurar volume persistente**:
   - Criar volume para `public/uploads`
   - Configurar backup automático

2. **Configurar variáveis de ambiente**:
   - Todas as variáveis necessárias

## 📊 **Monitoramento**

### **1. Logs de Produção**

```bash
# Ver logs em tempo real
tail -f logs/application.log

# Filtrar logs de upload
grep "upload" logs/application.log
```

### **2. Métricas de Upload**

```javascript
// Adicionar métricas
console.log("📊 Métricas de upload:", {
  timestamp: new Date().toISOString(),
  fileSize: file.size,
  fileType: file.type,
  uploadTime: Date.now() - startTime,
});
```

### **3. Alertas**

```javascript
// Alertar quando upload falhar
if (error) {
  console.error("🚨 Upload falhou:", {
    error: error.message,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get("user-agent"),
  });
}
```

## 🛠️ **Scripts de Manutenção**

### **1. Limpeza Automática**

```bash
#!/bin/bash
# cleanup-uploads.sh

UPLOAD_DIR="public/uploads"
MAX_AGE_DAYS=30

echo "🧹 Limpando uploads antigos..."

find $UPLOAD_DIR -name "*.jpg" -mtime +$MAX_AGE_DAYS -delete
find $UPLOAD_DIR -name "*.png" -mtime +$MAX_AGE_DAYS -delete
find $UPLOAD_DIR -name "*.gif" -mtime +$MAX_AGE_DAYS -delete

echo "✅ Limpeza concluída"
```

### **2. Backup Automático**

```bash
#!/bin/bash
# backup-uploads.sh

BACKUP_DIR="backups/uploads"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Fazendo backup dos uploads..."

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" public/uploads/

echo "✅ Backup concluído: uploads_$DATE.tar.gz"
```

### **3. Verificação de Saúde**

```bash
#!/bin/bash
# health-check.sh

echo "🏥 Verificando saúde do sistema..."

# Verificar espaço em disco
DISK_USAGE=$(df -h public/uploads | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "⚠️ Espaço em disco crítico: ${DISK_USAGE}%"
fi

# Verificar permissões
if [ ! -w public/uploads ]; then
  echo "❌ Sem permissão de escrita em public/uploads"
fi

# Verificar conectividade da API
curl -f https://seu-dominio.com/api/test-production > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ API funcionando"
else
  echo "❌ API não responde"
fi
```

## 🚀 **Deploy Checklist**

- [ ] **Permissões**: `chmod 755 public/uploads`
- [ ] **Espaço**: Verificar espaço em disco
- [ ] **Variáveis**: Configurar `.env.production`
- [ ] **Logs**: Configurar logging
- [ ] **Backup**: Configurar backup automático
- [ ] **Monitoramento**: Configurar alertas
- [ ] **Teste**: Testar upload após deploy

## 📞 **Suporte**

### **Logs Úteis**
```bash
# Ver logs de erro
grep "ERROR" logs/application.log

# Ver logs de upload
grep "upload" logs/application.log

# Ver logs de permissão
grep "EACCES\|Permission" logs/application.log
```

### **Comandos de Debug**
```bash
# Verificar espaço
df -h

# Verificar permissões
ls -la public/uploads/

# Testar API
curl -X GET https://seu-dominio.com/api/test-production

# Testar upload
curl -X POST -F "file=@test.jpg" https://seu-dominio.com/api/upload/image
```