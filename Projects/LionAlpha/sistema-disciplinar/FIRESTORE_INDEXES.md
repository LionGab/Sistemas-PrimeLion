# 📊 ÍNDICES FIRESTORE NECESSÁRIOS

Este documento lista todos os índices compostos que devem ser criados no Firebase Console para otimizar as consultas do Sistema Disciplinar.

## 🔥 COMO CRIAR OS ÍNDICES

### Método 1: Firebase Console (Recomendado)
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Indexes** → **Composite**
4. Clique em **Create Index**
5. Configure conforme as especificações abaixo

### Método 2: Firebase CLI
```bash
# Deploy via firestore.indexes.json (futuro)
firebase deploy --only firestore:indexes
```

---

## 📋 ÍNDICES POR COLEÇÃO

### Coleção: `alunos`

#### Índice 1: Busca por turma + ordenação alfabética
- **Campo 1**: `turma` (Ascending)
- **Campo 2**: `nome` (Ascending)
- **Uso**: Lista de alunos por turma ordenados por nome
- **Query exemplo**: 
  ```javascript
  db.collection('alunos')
    .where('turma', '==', '6A')
    .orderBy('nome')
  ```

#### Índice 2: Busca por turma + data criação
- **Campo 1**: `turma` (Ascending)
- **Campo 2**: `createdAt` (Descending)
- **Uso**: Alunos recém-adicionados por turma
- **Query exemplo**:
  ```javascript
  db.collection('alunos')
    .where('turma', '==', '6A')
    .orderBy('createdAt', 'desc')
  ```

#### Índice 3: Status ativo + turma
- **Campo 1**: `active` (Ascending)
- **Campo 2**: `turma` (Ascending)
- **Campo 3**: `nome` (Ascending)
- **Uso**: Lista apenas alunos ativos por turma
- **Query exemplo**:
  ```javascript
  db.collection('alunos')
    .where('active', '==', true)
    .where('turma', '==', '6A')
    .orderBy('nome')
  ```

---

### Coleção: `medidas`

#### Índice 1: Medidas por aluno + data
- **Campo 1**: `studentId` (Ascending)
- **Campo 2**: `createdAt` (Descending)
- **Uso**: Histórico de medidas disciplinares de um aluno
- **Query exemplo**:
  ```javascript
  db.collection('medidas')
    .where('studentId', '==', 'aluno123')
    .orderBy('createdAt', 'desc')
  ```

#### Índice 2: Medidas por tipo + data
- **Campo 1**: `type` (Ascending)
- **Campo 2**: `createdAt` (Descending)
- **Uso**: Relatórios por tipo de medida disciplinar
- **Query exemplo**:
  ```javascript
  db.collection('medidas')
    .where('type', '==', 'advertencia')
    .orderBy('createdAt', 'desc')
  ```

#### Índice 3: Medidas por turma + data
- **Campo 1**: `turma` (Ascending)
- **Campo 2**: `createdAt` (Descending)
- **Uso**: Relatórios disciplinares por turma
- **Query exemplo**:
  ```javascript
  db.collection('medidas')
    .where('turma', '==', '6A')
    .orderBy('createdAt', 'desc')
  ```

#### Índice 4: Medidas por período
- **Campo 1**: `createdAt` (Ascending)
- **Campo 2**: `type` (Ascending)
- **Uso**: Relatórios mensais/trimestrais
- **Query exemplo**:
  ```javascript
  db.collection('medidas')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .orderBy('createdAt')
    .orderBy('type')
  ```

---

### Coleção: `frequencia`

#### Índice 1: Frequência por turma + data
- **Campo 1**: `turma` (Ascending)
- **Campo 2**: `date` (Descending)
- **Uso**: Relatórios de frequência por turma
- **Query exemplo**:
  ```javascript
  db.collection('frequencia')
    .where('turma', '==', '6A')
    .orderBy('date', 'desc')
  ```

#### Índice 2: Frequência por aluno + data
- **Campo 1**: `studentId` (Ascending)
- **Campo 2**: `date` (Descending)
- **Uso**: Histórico individual de frequência
- **Query exemplo**:
  ```javascript
  db.collection('frequencia')
    .where('studentId', '==', 'aluno123')
    .orderBy('date', 'desc')
  ```

#### Índice 3: Frequência por período + turma
- **Campo 1**: `date` (Ascending)
- **Campo 2**: `turma` (Ascending)
- **Uso**: Relatórios periódicos de frequência
- **Query exemplo**:
  ```javascript
  db.collection('frequencia')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .where('turma', '==', '6A')
    .orderBy('date')
  ```

#### Índice 4: Faltas por período
- **Campo 1**: `status` (Ascending)
- **Campo 2**: `date` (Descending)
- **Campo 3**: `turma` (Ascending)
- **Uso**: Relatórios específicos de faltas
- **Query exemplo**:
  ```javascript
  db.collection('frequencia')
    .where('status', '==', 'F')
    .where('turma', '==', '6A')
    .orderBy('date', 'desc')
  ```

---

### Coleção: `configuracoes` (Admin)

#### Índice 1: Configs por categoria
- **Campo 1**: `category` (Ascending)
- **Campo 2**: `updatedAt` (Descending)
- **Uso**: Configurações do sistema organizadas
- **Query exemplo**:
  ```javascript
  db.collection('configuracoes')
    .where('category', '==', 'escola')
    .orderBy('updatedAt', 'desc')
  ```

---

## 🎯 ÍNDICES ESPECÍFICOS POR FUNCIONALIDADE

### Dashboard Principal
```javascript
// Estatísticas gerais - sem índice específico necessário
// Usa queries simples de contagem
```

### Relatórios de Frequência
```javascript
// Combina índices de frequencia:
// - turma + date (para período)
// - studentId + date (para aluno específico)
```

### Gestão Disciplinar
```javascript
// Usa índices de medidas:
// - studentId + createdAt (histórico individual)
// - type + createdAt (por tipo de medida)
// - turma + createdAt (por turma)
```

### Consulta de Alunos
```javascript
// Usa índices de alunos:
// - turma + nome (lista por turma)
// - active + turma + nome (apenas ativos)
```

---

## 🚀 SCRIPT PARA VERIFICAR ÍNDICES

```javascript
// Adicionar ao console do navegador para testar queries
const testIndexes = async () => {
  console.log('🧪 Testando performance das queries...');
  
  try {
    // Teste 1: Alunos por turma
    const start1 = performance.now();
    const alunos = await db.collection('alunos')
      .where('turma', '==', '6A')
      .orderBy('nome')
      .limit(10)
      .get();
    console.log(`✅ Alunos por turma: ${performance.now() - start1}ms`);
    
    // Teste 2: Medidas por aluno
    const start2 = performance.now();
    const medidas = await db.collection('medidas')
      .where('studentId', '==', '2639458')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    console.log(`✅ Medidas por aluno: ${performance.now() - start2}ms`);
    
    // Teste 3: Frequência por turma
    const start3 = performance.now();
    const frequencia = await db.collection('frequencia')
      .where('turma', '==', '6A')
      .orderBy('date', 'desc')
      .limit(20)
      .get();
    console.log(`✅ Frequência por turma: ${performance.now() - start3}ms`);
    
  } catch (error) {
    console.error('❌ Erro ao testar queries:', error);
    console.log('💡 Verifique se os índices foram criados corretamente');
  }
};

// Executar teste
testIndexes();
```

---

## ⚠️ NOTAS IMPORTANTES

### Performance
- **Queries < 100ms**: Objetivo para boa UX
- **Índices vs Storage**: Cada índice ocupa espaço adicional
- **Write cost**: Índices aumentam custo de escrita

### Monitoramento
- **Firebase Console**: Uso → Performance para monitorar
- **Query insights**: Identifica queries lentas automaticamente
- **Missing indexes**: Firebase sugere índices ausentes

### Manutenção
- **Revisar trimestralmente**: Remover índices não utilizados
- **Novas funcionalidades**: Criar índices para novas queries
- **Testes locais**: Usar Firestore Emulator para desenvolvimento

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Antes do Deploy de Produção
- [ ] Todos os índices listados foram criados no Firebase Console
- [ ] Script de teste executado sem erros
- [ ] Queries principais testadas (< 200ms)
- [ ] Firestore rules deployadas e testadas

### Pós-Deploy
- [ ] Monitorar performance via Firebase Console
- [ ] Verificar custos de query (especialmente reads)
- [ ] Confirmar que não há missing indexes warnings

### Manutenção Contínua
- [ ] Revisar uso de índices mensalmente
- [ ] Otimizar queries com base nos insights do Firebase
- [ ] Documentar novos índices quando adicionar funcionalidades

---

**📅 Última atualização**: Agosto 2025  
**🔍 Revisão recomendada**: Trimestral