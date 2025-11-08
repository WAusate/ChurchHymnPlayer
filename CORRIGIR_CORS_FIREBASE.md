# Como Corrigir o Erro CORS no Firebase Storage

## 🔴 Problema Identificado

O Firebase Storage está bloqueando requisições do seu domínio de produção. Erro:
```
Access to fetch at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://app-hinos.web.app' has been blocked by CORS policy
```

## ✅ Solução: Configurar CORS no Firebase Storage

### Opção 1: Via Google Cloud Console (Mais Fácil)

1. Acesse: https://console.cloud.google.com/storage/browser
2. Faça login com a conta do Firebase
3. Clique no bucket **app-hinos.appspot.com**
4. Vá em **Permissions** (Permissões)
5. Clique em **Add Principal** (Adicionar Principal)
6. No campo **New principals**, digite: `allUsers`
7. No campo **Role**, selecione: `Storage Object Viewer`
8. Clique em **Save**

### Opção 2: Via gsutil (Linha de Comando)

1. **Instale o Google Cloud SDK:**
   ```bash
   # No Windows:
   # Baixe de: https://cloud.google.com/sdk/docs/install
   
   # No Mac:
   brew install google-cloud-sdk
   
   # No Linux:
   curl https://sdk.cloud.google.com | bash
   ```

2. **Configure a autenticação:**
   ```bash
   gcloud auth login
   gcloud config set project app-hinos
   ```

3. **Aplique as regras CORS:**
   ```bash
   gsutil cors set cors.json gs://app-hinos.appspot.com
   ```

4. **Verifique se foi aplicado:**
   ```bash
   gsutil cors get gs://app-hinos.appspot.com
   ```

### Opção 3: Tornar os Arquivos Públicos (Mais Rápido)

1. Acesse o Firebase Console: https://console.firebase.google.com/
2. Vá em **Storage**
3. Clique nos 3 pontinhos ao lado da pasta **hinos/**
4. Selecione **Edit access** (Editar acesso)
5. Marque **Public** (Público)
6. Confirme

## 🔍 Verificar se Funcionou

Após aplicar uma das soluções acima:

1. Aguarde 2-3 minutos para as mudanças propagarem
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Acesse seu site novamente
4. Tente tocar um hino

## 📋 Regras de Segurança Recomendadas

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hinos/{document=**} {
      allow read: if true;  // Qualquer um pode ler hinos
      allow write: if request.auth != null;  // Só usuários autenticados podem adicionar
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /hinos/{allPaths=**} {
      allow read: if true;  // Qualquer um pode ouvir os áudios
      allow write: if request.auth != null;  // Só usuários autenticados podem fazer upload
    }
  }
}
```

## ⚠️ Importante

- As regras CORS precisam ser aplicadas ao **bucket do Storage**, não ao projeto
- O bucket geralmente é: `seu-projeto-id.appspot.com`
- Pode levar alguns minutos para as mudanças surtirem efeito

## 🆘 Se ainda não funcionar

Verifique no console do navegador (F12) se há outros erros além do CORS.
