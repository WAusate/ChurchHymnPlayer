# Firebase Deploy - Instruções para Autenticação

## Problema Atual
O Firebase CLI precisa de autenticação interativa que não funciona no ambiente Replit.

## Solução 1: Deploy Manual via Firebase Console

### Passos:
1. **Fazer build local**: ✅ Executado
2. **Baixar arquivos**: Baixe o conteúdo da pasta `client/dist/` 
3. **Upload manual**: Acesse [Firebase Console](https://console.firebase.google.com)
4. **Hosting**: Vá para Hosting → Fazer novo deploy → Arrastar arquivos

### Arquivos para Upload:
- `client/dist/index.html` - Página principal
- `client/dist/assets/` - Arquivos estáticos (CSS, JS)
- Todos os arquivos da pasta `client/dist/`

## Solução 2: Token de Autenticação

Se tiver acesso a um terminal local com Firebase CLI instalado:

```bash
# Gerar token
firebase login:ci

# Usar token para deploy
firebase deploy --token "SEU_TOKEN_AQUI"
```

## Solução 3: GitHub Actions (Recomendado)

Criar workflow do GitHub Actions para deploy automático:

```yaml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_APP_HINOS }}'
          projectId: app-hinos
```

## Status Atual
- ✅ Build criado com sucesso
- ✅ Arquivos estáticos prontos em `client/dist/`
- ✅ Configuração do Firebase completa
- ⏳ Aguardando autenticação para deploy

## Próximos Passos
1. Testar deploy manual via console
2. Verificar se CORS foi resolvido
3. Testar upload de hinos em produção