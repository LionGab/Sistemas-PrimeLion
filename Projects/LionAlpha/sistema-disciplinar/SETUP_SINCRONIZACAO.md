# 🔄 Configuração da Sincronização em Tempo Real

## Como funciona?

O sistema agora sincroniza automaticamente dados entre diferentes usuários/locais usando o GitHub como servidor. Quando um usuário registra um aluno, falta ou medida disciplinar, a informação é automaticamente compartilhada com todos os outros usuários.

## 📋 Passo a Passo para Configurar

### 1. Criar Token GitHub (Uma vez só)

1. Acesse https://github.com/settings/tokens
2. Clique em "Generate new token" → "Classic"
3. Dê um nome: "Sistema Disciplinar - [Seu Nome]"
4. Marque as permissões:
   - `repo` (todas as opções)
   - `user:email`
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você só verá ele uma vez!)

### 2. Configurar no Sistema

1. Abra o sistema disciplinar
2. Vá em **Configurações** (ícone da engrenagem)
3. Na seção "GitHub Sync", insira:
   - **Token**: Cole o token copiado
   - **Email**: Seu email (exemplo: joao@escola.edu.br)
   - **Nome**: Seu nome (exemplo: João Silva)
4. Clique em "Configurar GitHub"
5. Se aparecer "✅ Configurado com sucesso", está funcionando!

### 3. Testar Sincronização

1. Cadastre um novo aluno ou registre uma falta
2. Em outro computador/navegador, abra o sistema
3. Aguarde até 30 segundos
4. Os dados devem aparecer automaticamente!

## ⚙️ Como Funciona Tecnicamente

- **Polling**: O sistema verifica mudanças no GitHub a cada 30 segundos
- **Commits Automáticos**: Quando você salva algo, é enviado automaticamente para o GitHub
- **Notificações**: Você será notificado quando outros usuários fizerem alterações
- **Resolução de Conflitos**: O sistema prioriza sempre a versão mais recente

## 🔧 Configurações Avançadas

No console do navegador, você pode usar:

```javascript
// Ver status da sincronização
statusSincronizacao()

// Forçar sincronização agora
sincronizarAgora()

// Configurar intervalo personalizado (em milissegundos)
realTimeSync.configure({ pollInterval: 60000 }) // 1 minuto
```

## 📱 Indicadores Visuais

- **🔄**: Sincronizando dados
- **✅**: Sincronização bem-sucedida
- **❌**: Erro na sincronização
- **👥**: Dados atualizados por outro usuário

## ❓ Problemas Comuns

### "Token inválido"
- Verifique se copiou o token completo
- Confirme se as permissões `repo` estão marcadas

### "Não sincroniza"
- Verifique sua conexão com internet
- Confirme se o token não expirou
- Tente reconfigurar nas Configurações

### "Dados duplicados"
- O sistema evita duplicatas automaticamente
- Se acontecer, recarregue a página

## 🔐 Segurança

- O token é armazenado apenas localmente no seu navegador
- Nunca compartilhe seu token GitHub
- Se comprometer o token, gere um novo no GitHub

---

**💡 Dica**: Cada pessoa que vai usar o sistema precisa configurar seu próprio token GitHub. Assim, sempre saberemos quem fez cada alteração!