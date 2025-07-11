# Configuração do Firebase para Deploy

## Status Atual
✅ Arquivos de configuração criados:
- `firebase.json` - Configuração do Firebase Hosting
- `storage.rules` - Regras de segurança do Storage
- `firestore.rules` - Regras de segurança do Firestore
- `.firebaserc` - Configuração do projeto
- `cors.json` - Configuração de CORS

## Problema Identificado
O erro de upload está ocorrendo devido a **CORS (Cross-Origin Resource Sharing)**. O domínio do Replit não está autorizado a fazer uploads para o Firebase Storage.

### Logs do Erro:
```
Upload network error: {"isTrusted":true}
XHR error details: 0 ""
Upload failed due to network error: 0
```

## Solução: Configurar CORS

### Método 1: Via Google Cloud SDK (Recomendado)

1. **Instalar Google Cloud SDK** (já feito):
   ```bash
   # Já instalado no ambiente
   which gsutil  # Confirma instalação
   ```

2. **Configurar CORS**:
   ```bash
   gsutil cors set cors.json gs://app-hinos.appspot.com
   ```

3. **Verificar configuração**:
   ```bash
   gsutil cors get gs://app-hinos.appspot.com
   ```

### Método 2: Via Console do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com)
2. Vá para Storage → Rules
3. Atualize as regras para incluir domínios permitidos

### Método 3: Usando Firebase CLI

```bash
firebase deploy --only storage
```

## Como Fazer o Deploy

1. **Build da aplicação**:
   ```bash
   npm run build
   ```

2. **Deploy completo**:
   ```bash
   npx firebase deploy
   ```

3. **Deploy apenas hosting**:
   ```bash
   npx firebase deploy --only hosting
   ```

## URLs após Deploy
- **Hosting**: https://app-hinos.web.app
- **Alt URL**: https://app-hinos.firebaseapp.com

## Testando o Upload

Após configurar o CORS, o upload deve funcionar corretamente. Se ainda houver problemas:

1. Verifique as regras de segurança
2. Confirme que o usuário está autenticado
3. Verifique se o bucket está correto: `app-hinos.appspot.com`

## Arquivos Necessários para Deploy

Todos os arquivos já estão criados e configurados:
- ✅ `firebase.json`
- ✅ `storage.rules`
- ✅ `firestore.rules`
- ✅ `.firebaserc`
- ✅ `cors.json`

## Próximos Passos

1. Configurar CORS usando `gsutil cors set cors.json gs://app-hinos.appspot.com`
2. Fazer deploy: `npx firebase deploy`
3. Testar upload no ambiente deployed
4. Configurar domínio customizado (se necessário)

## Comandos Úteis

```bash
# Verificar projetos
npx firebase projects:list

# Selecionar projeto
npx firebase use app-hinos

# Servir localmente
npx firebase serve

# Ver logs
npx firebase functions:log

# Deploy específico
npx firebase deploy --only hosting,storage,firestore
```