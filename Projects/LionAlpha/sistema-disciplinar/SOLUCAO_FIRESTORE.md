# 🔥 Solução: Erro "Verifique as regras do Firestore"

## 🚨 Problema
As páginas mostram: "Erro ao carregar alunos. Verifique as regras do Firestore."

## ✅ Solução Rápida

### 1. Aplicar Regras no Console Firebase

1. **Acesse:** [console.firebase.google.com](https://console.firebase.google.com/)
2. **Selecione** seu projeto: `sistema-disciplinar`
3. **Navegue:** Firestore Database → Rules
4. **Substitua** as regras existentes por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. **Clique** em "Publish" 
6. **Aguarde** uns segundos para aplicar

### 2. Verificar Autenticação

- Certifique-se de estar **logado** no sistema
- Se não conseguir logar, verifique as configurações de Authentication no Firebase

### 3. Testar

1. Faça logout e login novamente
2. Teste uma página (ex: Gestão de Alunos)
3. Deve carregar os dados importados

## 🔍 Verificação de Status

Se ainda tiver problemas:

1. **F12** (Console do navegador)
2. Procure por erros relacionados a "permission-denied"
3. Verifique se `firebase.auth().currentUser` retorna um usuário

## 📁 Arquivos de Regras

- `firestore-dev.rules` - Regras simples para desenvolvimento
- `firestore.rules` - Regras mais específicas para produção

## 🎯 Resultado Esperado

Após aplicar as regras:
- ✅ Gestão de Alunos mostra lista de alunos importados  
- ✅ Dashboard mostra estatísticas corretas
- ✅ Medidas Disciplinares lista registros importados
- ✅ Relatórios e Análises funcionam normalmente