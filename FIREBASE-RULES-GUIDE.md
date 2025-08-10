# Configuração das Regras de Segurança do Firebase

## Resumo
Este projeto está configurado com regras de segurança que permitem:
- **Leitura pública**: Qualquer pessoa pode acessar e visualizar os hinos
- **Escrita autenticada**: Apenas usuários logados podem adicionar/editar hinos

## Regras do Firestore (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permite acesso de leitura para todos os usuários
    match /{document=**} {
      allow read: if true;
    }
    
    // Permite acesso de escrita apenas para usuários autenticados na coleção hinos
    match /hinos/{hymnId} {
      allow write: if request.auth != null;
    }
  }
}
```

## Regras do Storage (storage.rules)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Regras para a pasta hinos
    match /hinos/{allPaths=**} {
      // Permite acesso de leitura público para todos os arquivos de áudio
      allow read: if true;
      
      // Permite upload, atualização e exclusão apenas para usuários autenticados
      allow write: if request.auth != null;
    }
    
    // Regra padrão para outros arquivos (mais restritiva)
    match /{allPaths=**} {
      // Permite leitura e escrita apenas para usuários autenticados para outros arquivos
      allow read, write: if request.auth != null;
    }
  }
}
```

## Como Aplicar as Regras

### Via Firebase Console:
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto "app-hinos"
3. Para **Firestore**:
   - Vá em "Firestore Database" > "Regras"
   - Cole o conteúdo de `firestore.rules`
   - Clique em "Publicar"
4. Para **Storage**:
   - Vá em "Storage" > "Regras"
   - Cole o conteúdo de `storage.rules`
   - Clique em "Publicar"

### Via Firebase CLI:
```bash
# Deploy todas as regras
firebase deploy --only firestore:rules,storage

# Ou deploy individual
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Teste das Regras

### Firestore - Teste de Leitura Pública:
```javascript
// Deve funcionar sem autenticação
match /hinos/algumId {
  allow read: if true; ✅
}
```

### Firestore - Teste de Escrita Autenticada:
```javascript
// Deve funcionar apenas com usuário logado
match /hinos/algumId {
  allow write: if request.auth != null; ✅
}
```

### Storage - Teste de Download Público:
```javascript
// Deve funcionar sem autenticação
match /hinos/coral-1-1234567890.mp3 {
  allow read: if true; ✅
}
```

### Storage - Teste de Upload Autenticado:
```javascript
// Deve funcionar apenas com usuário logado
match /hinos/novo-hino.mp3 {
  allow write: if request.auth != null; ✅
}
```

## Vantagens desta Configuração

1. **Acesso Público aos Hinos**: Usuários podem ouvir hinos sem criar conta
2. **Controle Administrativo**: Apenas usuários autenticados podem gerenciar conteúdo
3. **Segurança**: Evita uploads não autorizados ou modificações maliciosas
4. **Flexibilidade**: Permite expansão futura com diferentes níveis de acesso

## Estrutura de Autenticação

- **Usuários Normais**: Acesso apenas de leitura (ouvir hinos)
- **Administradores**: Acesso completo via login em `/config`
- **Sistema**: Utiliza Firebase Auth com email/senha

## Monitoramento

Use o Firebase Console para monitorar:
- Uso das regras de segurança
- Tentativas de acesso negadas
- Volume de uploads e downloads
- Atividade de usuários autenticados