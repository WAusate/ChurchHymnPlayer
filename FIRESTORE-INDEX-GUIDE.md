# Guia de Criação do Índice Composto no Firestore

## Problema Identificado
A consulta no Firebase SDK está falhando com erro "The query requires an index".

## Consulta que Requer Índice
No arquivo `client/src/lib/firebaseSDK.ts`, a função `getHymnsByOrganSDK` executa:

```javascript
const q = query(
  hymnsRef,
  where('orgao', '==', organName),    // Campo: orgao, Operação: ==
  orderBy('numero', 'asc')            // Campo: numero, Ordem: asc
);
```

## Índice Composto Necessário

**Coleção:** `hinos`
**Campos:**
1. `orgao` - Ascending
2. `numero` - Ascending

## Como Criar o Índice

### Método 1: Via Firebase Console (Recomendado)
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto "app-hinos"
3. Vá em **Firestore Database** → **Indexes** → **Composite indexes**
4. Clique em **Create index**
5. Configure:
   - **Collection ID:** `hinos`
   - **Field 1:** `orgao` (Ascending)
   - **Field 2:** `numero` (Ascending)
   - **Query scopes:** Collection
6. Clique em **Create index**

### Método 2: Via Link do Console de Erro
Quando o erro aparecer no console do navegador, procure por um link que diz:
"Create index: https://console.firebase.google.com/v1/r/project/..."

Clique neste link para criar automaticamente o índice correto.

### Método 3: Via Firebase CLI
```bash
# Deploy o arquivo de configuração de índices
firebase deploy --only firestore:indexes
```

## Status do Índice
Após criar o índice:
1. **Building** - O índice está sendo construído (pode levar alguns minutos)
2. **Ready** - O índice está pronto para uso

⚠️ **Importante:** Aguarde o status mudar para "Ready" antes de testar.

## Teste Após Criação
Depois que o índice estiver **Ready**:

1. **Build da aplicação:**
   ```bash
   npm run build
   ```

2. **Deploy (se necessário):**
   ```bash
   firebase deploy
   ```

3. **Testes:**
   - ✅ Listar hinos de um órgão sem estar logado
   - ✅ Tocar áudio de hino sem estar logado  
   - ✅ Clicar na engrenagem deve redirecionar para login
   - ✅ Login deve funcionar e dar acesso ao /config

## Estrutura da Consulta
```
Collection: hinos
└── Query: 
    ├── WHERE orgao == "Coral" (exemplo)
    └── ORDER BY numero ASC
```

## Verificação
Para verificar se o índice foi criado corretamente:
1. Vá no Firebase Console → Firestore → Indexes
2. Procure pelo índice da coleção `hinos`
3. Confirme que tem os campos `orgao` e `numero`
4. Status deve estar "Ready"

## Próximos Passos
1. ✅ Criar o índice no Firebase Console
2. ⏳ Aguardar status "Ready" 
3. ✅ Testar funcionalidade de leitura pública
4. ✅ Verificar sistema de autenticação
5. ✅ Confirmar que escrita requer login