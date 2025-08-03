# Configuração do Primeiro Administrador

## Problema Resolvido

O sistema agora está configurado para que o **primeiro usuário registrado via interface** seja automaticamente criado como **ADMIN**, independentemente de usuários criados via seed.

## Como Funciona

1. **Usuários de Seed**: São criados com `registrationSource: "seed"`
2. **Usuários Reais**: São criados com `registrationSource: "web"` (ou outro valor)
3. **Lógica de ADMIN**: O primeiro usuário com `registrationSource` diferente de "seed" será criado como ADMIN

## Scripts Disponíveis

### Limpar Usuários de Seed
```bash
npm run db:clear-seed
```
Remove todos os usuários criados via seed, permitindo que o próximo usuário registrado seja ADMIN.

### Testar Criação de ADMIN
```bash
npm run db:test-admin
```
Verifica se o próximo usuário registrado será criado como ADMIN.

### Recriar Dados de Seed
```bash
npm run db:seed
```
Recria todos os dados de exemplo (categorias, tags, posts, usuários de teste).

## Fluxo Recomendado para Produção

1. **Desenvolvimento/Teste**:
   ```bash
   npm run db:seed        # Criar dados de exemplo
   npm run db:clear-seed  # Remover usuários de seed
   # Registrar primeiro usuário real (será ADMIN)
   ```

2. **Produção**:
   ```bash
   # Não executar seed em produção
   # Registrar primeiro usuário (será ADMIN automaticamente)
   ```

## Verificação

Para verificar se um usuário foi criado como ADMIN:

1. Acesse o dashboard: `/dashboard`
2. Verifique o console do navegador para logs de registro
3. Use o script de teste: `npm run db:test-admin`

## Logs de Registro

O sistema registra logs detalhados durante o processo de registro:

```
[REGISTER] Usuários não-seed: 0, será ADMIN
[AUTH:abc123] Registration successful for user: user_id (150ms)
```

## Estrutura do Banco

- **UserMetadata.registrationSource**: Identifica a origem do registro
  - `"seed"`: Usuários criados via seed
  - `"web"`: Usuários registrados via interface
  - `"api"`: Usuários criados via API
  - `"admin"`: Usuários criados por administradores