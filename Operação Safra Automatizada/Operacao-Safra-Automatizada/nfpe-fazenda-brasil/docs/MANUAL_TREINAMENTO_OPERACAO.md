# MANUAL DE TREINAMENTO - OPERAÇÃO NFP-e
## Fazenda Brasil - Campo Verde/MT

**Data**: 01/09/2024  
**Versão**: 1.0  
**Público**: Equipe Fazenda Brasil  
**Instrutor**: Lion Consultoria - Claude Code Specialist

---

## 🎯 OBJETIVO DO TREINAMENTO

Capacitar a equipe da Fazenda Brasil para **operação autônoma** do sistema de automação NFP-e, garantindo:

- ✅ **100% Compliance** com SEFAZ-MT
- ✅ **Zero multas** por não conformidade
- ✅ **95% redução** tempo de processamento
- ✅ **Operação 24/7** independente

**Meta**: Equipe operando 100% autonomamente em **7 dias**

---

## 👥 PERFIS DE USUÁRIO

### **Administrador Fiscal** (Maria - Contadora)
- **Acesso**: Total ao sistema
- **Responsabilidades**: Configurações, auditoria, relatórios fiscais
- **Horário**: 8h-17h + plantão safra
- **Login**: `maria.fiscal@fazenda-brasil.agro`

### **Operador NFP-e** (João - Auxiliar Fiscal) 
- **Acesso**: Emissão, consulta, monitoramento
- **Responsabilidades**: Operação diária, primeira linha suporte
- **Horário**: 7h-19h (período crítico)
- **Login**: `joao.operador@fazenda-brasil.agro`

### **Gestor** (Carlos - Administrador)
- **Acesso**: Dashboard executivo, relatórios
- **Responsabilidades**: Acompanhamento KPIs, decisões estratégicas
- **Horário**: Acesso sob demanda
- **Login**: `carlos.gestor@fazenda-brasil.agro`

---

## 🚀 MÓDULO 1: PRIMEIROS PASSOS

### **1.1 Acessando o Sistema**

```url
URL Sistema: https://nfpe.fazenda-brasil.agro
URL API: https://api.fazenda-brasil.agro
URL Docs: https://docs.fazenda-brasil.agro
```

#### **Login Passo a Passo**
1. Abrir navegador (Chrome/Edge recomendado)
2. Acessar: `https://nfpe.fazenda-brasil.agro`
3. Inserir **email** e **senha**
4. Clicar **"Entrar"**
5. Verificar **nome do usuário** no canto superior direito

> **⚠️ IMPORTANTE**: Sempre usar HTTPS (cadeado verde no navegador)

#### **Primeiro Acesso**
- **Senha temporária**: Alterar obrigatoriamente
- **Configurações perfil**: Completar dados pessoais
- **Tour guiado**: Seguir tutorial interativo (10 minutos)

### **1.2 Dashboard Principal**

![Dashboard](./images/dashboard-principal.png)

#### **Widgets Principais**
1. **NFP-e Hoje**: Total emitidas nas últimas 24h
2. **Status SEFAZ**: Conectividade com SEFAZ-MT
3. **Pendências**: NFP-e aguardando processamento
4. **Alertas**: Problemas que precisam atenção

#### **Semáforo de Status**
- 🟢 **Verde**: Sistema funcionando normalmente
- 🟡 **Amarelo**: Atenção necessária (não crítico)
- 🔴 **Vermelho**: Problema crítico - acionar suporte

### **1.3 Menu de Navegação**

| Menu | Função | Usuário |
|------|---------|---------|
| 📊 **Dashboard** | Visão geral e KPIs | Todos |
| 📄 **NFP-e** | Emissão e consulta notas | Admin + Operador |
| 🔄 **TOTVS** | Sincronização dados | Admin + Operador |
| 📈 **Relatórios** | Análises e estatísticas | Admin + Gestor |
| ⚙️ **Configurações** | Parâmetros sistema | Admin apenas |
| ❓ **Ajuda** | Suporte e documentação | Todos |

---

## 📄 MÓDULO 2: OPERAÇÃO NFP-e

### **2.1 Fluxo Automático (95% dos Casos)**

#### **Como Funciona**
1. **TOTVS** gera movimentação de venda
2. **Sistema** detecta automaticamente (5 min)
3. **NFP-e** é gerada e assinada
4. **SEFAZ-MT** recebe e processa
5. **Notificação** enviada por email
6. **Dashboard** atualizado em tempo real

> **⏰ Tempo Total**: 3-8 minutos (vs. 4 horas manual)

#### **Acompanhamento Diário**
- **9:00**: Verificar NFP-e processadas na madrugada
- **12:00**: Revisar pendências meio-dia
- **17:00**: Conferir fechamento do dia
- **Emergência**: Monitorar durante operações críticas

### **2.2 Emissão Manual (5% dos Casos)**

#### **Quando Usar**
- Movimentação não sincronizou do TOTVS
- Dados precisam correção antes envio
- Operação especial (devolução, complementar)
- Teste ou treinamento

#### **Passo a Passo**
1. Menu **"NFP-e"** → **"Nova NFP-e"**
2. Selecionar **Fazenda** (já pré-selecionada)
3. Preencher **dados destinatário**:
   ```
   Tipo: CNPJ ou CPF
   Documento: Apenas números
   Nome: Nome completo/Razão social
   IE: Se CNPJ, obrigatório
   Endereço: Dados completos
   ```
4. Adicionar **produtos**:
   ```
   Código: Buscar na lista TOTVS
   Descrição: Automático
   NCM: Automático (verificar)
   Quantidade: Conferir unidade
   Valor: Por KG, SC, etc.
   ```
5. Revisar **totais** calculados
6. Clicar **"Gerar NFP-e"**
7. Aguardar **autorização SEFAZ** (3-8 min)

#### **Validações Automáticas**
- ✅ CNPJ/CPF válido
- ✅ IE válida para MT
- ✅ NCM correto produto
- ✅ Cálculo impostos automático
- ✅ Chave de acesso única

### **2.3 Status NFP-e**

| Status | Descrição | Ação |
|--------|-----------|------|
| **PENDENTE** | Aguardando processamento | ⏳ Aguardar |
| **PROCESSANDO** | Sendo assinada/transmitida | ⏳ Aguardar |
| **AUTORIZADA** | ✅ Aprovada SEFAZ-MT | 🎉 Concluída |
| **REJEITADA** | ❌ Dados incorretos | 🔧 Corrigir |
| **ERRO** | ⚠️ Problema técnico | 📞 Suporte |
| **CANCELADA** | Cancelada por solicitação | ℹ️ Histórico |

### **2.4 Consultas e Relatórios**

#### **Consultar NFP-e Específica**
1. Menu **"NFP-e"** → **"Consultar"**
2. Buscar por:
   - Número NFP-e
   - Chave de acesso
   - Data emissão
   - Destinatário
3. Visualizar **detalhes completos**
4. **Download XML** autorizada

#### **Relatório Diário**
```
📊 Relatório NFP-e - 01/09/2024

✅ Autorizadas: 45 (R$ 450.000,00)
⏳ Pendentes: 2
❌ Rejeitadas: 1
📈 Taxa sucesso: 95,7%
⏱️ Tempo médio: 4,2 min

🔝 Top Produtos:
1. Soja grãos - 30.000 KG
2. Milho grãos - 15.000 KG
3. Algodão caroço - 5.000 KG
```

---

## 🔄 MÓDULO 3: INTEGRAÇÃO TOTVS

### **3.1 Sincronização Automática**

#### **Como Funciona**
- **A cada 5 minutos**: Sistema consulta TOTVS
- **Movimentações novas**: Detectadas automaticamente
- **NFP-e gerada**: Para vendas elegíveis
- **Status atualizado**: No TOTVS após autorização

#### **Verificar Sincronização**
1. Menu **"TOTVS"** → **"Status"**
2. Verificar **conectividade**: 🟢 Online
3. Última **sincronização**: <5 min atrás
4. **Movimentações pendentes**: Lista atualizada

### **3.2 Sincronizar Produtos**

#### **Quando Fazer**
- Novos produtos cadastrados no TOTVS
- Mudança NCM ou tributação
- Início safra (novos códigos)
- Semanalmente (manutenção)

#### **Passo a Passo**
1. Menu **"TOTVS"** → **"Sincronizar Produtos"**
2. Clicar **"Iniciar Sincronização"**
3. Aguardar **conclusão** (2-5 min)
4. Revisar **produtos atualizados**
5. Verificar **erros** se houver

### **3.3 Troubleshooting TOTVS**

#### **Problema: "TOTVS Desconectado"**
```
Sintoma: Status 🔴 Offline
Causa: Rede, credenciais ou manutenção TOTVS
Solução:
1. Verificar internet fazenda
2. Contatar TI TOTVS se persistir
3. Usar emissão manual temporariamente
```

#### **Problema: "Movimentação não sincronizou"**
```
Sintoma: Venda no TOTVS mas não gerou NFP-e
Causa: Dados incompletos ou TES incorreta
Solução:
1. Verificar dados destinatário completos
2. Confirmar TES gera NFP-e
3. Sincronizar manualmente se necessário
```

---

## ⚠️ MÓDULO 4: SITUAÇÕES ESPECIAIS

### **4.1 Cancelamento NFP-e**

#### **Quando Cancelar**
- Erro dados destinatário
- Produto incorreto
- Valor errado
- Solicitação cliente

#### **⏰ PRAZO**: Até 24h após autorização

#### **Passo a Passo**
1. Localizar **NFP-e autorizada**
2. Clicar **"Cancelar"**
3. Inserir **justificativa** (mín. 15 caracteres):
   ```
   Exemplo: "Cancelamento devido erro na digitacao 
   dos dados do destinatario conforme solicitado"
   ```
4. Confirmar **cancelamento**
5. Aguardar **registro SEFAZ** (2-5 min)
6. Verificar status **"CANCELADA"**

> **⚠️ ATENÇÃO**: Cancelamento é **irreversível**!

### **4.2 Carta de Correção**

#### **Quando Usar**
- Erro menor que não invalida NFP-e
- Endereço incompleto
- Informação complementar
- **NÃO altera**: valores, produtos, impostos

#### **Passo a Passo**
1. Localizar **NFP-e autorizada**
2. Clicar **"Carta Correção"**
3. Descrever **correção**:
   ```
   Exemplo: "Correcao endereco destinatario: 
   incluir numero 123 no endereco"
   ```
4. Confirmar **carta correção**
5. Aguardar **processamento SEFAZ**

### **4.3 Contingência (Emergência)**

#### **Quando Usar**
- SEFAZ-MT indisponível >30 min
- Problema certificado digital
- Sistema principal offline
- **Situação excepcional**

#### **Processo Manual Backup**
1. **Parar operações** automáticas
2. **Ativar modo manual** emergência
3. **Gerar NFP-e** offline se possível
4. **Documentar** todas operações
5. **Regularizar** quando sistema voltar

> **📞 ACIONAR SUPORTE**: Immediately!

---

## 🔍 MÓDULO 5: MONITORAMENTO E ALERTAS

### **5.1 Dashboard de Alertas**

#### **Tipos de Alertas**
| Tipo | Cor | Ação | SLA |
|------|-----|------|-----|
| **Crítico** | 🔴 | Ação imediata | 15 min |
| **Alerta** | 🟡 | Revisar em 1h | 1 hora |
| **Info** | 🔵 | Acompanhar | 4 horas |

#### **Alertas Críticos** 🔴
- **SEFAZ indisponível** → Verificar site SEFAZ
- **Certificado expirando** → Renovar urgente
- **NFP-e rejeitadas** → Corrigir dados
- **Sistema offline** → Acionar suporte

#### **Alertas Atenção** 🟡
- **Muitas pendentes** → Investigar causa
- **Performance lenta** → Monitorar
- **Backup falhou** → Verificar espaço

### **5.2 Relatórios Gerenciais**

#### **Relatório Semanal**
```
📊 Relatório Semanal - Semana 35/2024
====================================

📈 Performance:
- NFP-e emitidas: 312
- Taxa autorização: 98,4%
- Tempo médio: 3,8 min
- Economia vs manual: 18,5 horas

💰 Valores:
- Faturamento total: R$ 2.847.500,00
- ICMS recolhido: R$ 341.700,00
- Tributos total: R$ 512.340,00

🎯 Top Destinos:
1. Cooperfibra - R$ 1.200.000
2. Amaggi - R$ 890.000
3. Bunge - R$ 757.500
```

#### **Relatório Mensal**
- Performance vs meta
- Análise tendências
- Projeções próximo mês
- Recomendações melhorias

### **5.3 KPIs Principais**

| KPI | Meta | Como Calcular |
|-----|------|---------------|
| **Taxa Sucesso** | >95% | Autorizadas ÷ Total × 100 |
| **Tempo Médio** | <5 min | Σ(Tempo Proc) ÷ Qtd |
| **Uptime Sistema** | >99% | Horas Online ÷ Total |
| **Compliance Score** | 100% | Zero multas/autuações |

---

## 🛠️ MÓDULO 6: PROBLEMAS COMUNS

### **6.1 Problemas Técnicos**

#### **"Sistema não carrega"**
```
✓ 1. Verificar internet fazenda
✓ 2. Limpar cache navegador (Ctrl+F5)
✓ 3. Tentar navegador diferente
✓ 4. Verificar se HTTPS (cadeado)
✓ 5. Se persistir: acionar suporte
```

#### **"Erro ao fazer login"**
```
✓ 1. Verificar email/senha
✓ 2. Caps Lock desligado
✓ 3. Resetar senha se necessário
✓ 4. Verificar conta não bloqueada
✓ 5. Contatar administrador
```

#### **"NFP-e não autoriza"**
```
✓ 1. Verificar status SEFAZ (Dashboard)
✓ 2. Conferir dados obrigatórios
✓ 3. Validar CNPJ/CPF destinatário
✓ 4. Verificar NCM produto
✓ 5. Se rejeitada: ler mensagem erro
```

### **6.2 Problemas SEFAZ**

#### **Códigos Comuns**

| Código | Mensagem | Solução |
|--------|----------|---------|
| **204** | Rejeição: dados incorretos | Corrigir dados apontados |
| **217** | NFP-e não consta base | Aguardar ou retransmitir |
| **108** | Serviço paralisado | Aguardar restabelecimento |
| **110** | Uso denegado | Verificar CNPJ/IE emissor |

#### **"SEFAZ indisponível"**
```
Sintomas: Status 🔴, timeouts, erros 503
Causa: Manutenção ou instabilidade SEFAZ
Solução:
1. Verificar site oficial SEFAZ-MT
2. Aguardar normalização (até 2h)
3. Sistema reagenda automático
4. Monitorar dashboard alertas
```

### **6.3 Problemas Fiscais**

#### **"Destinatário sem IE"**
```
Problema: CNPJ sem Inscrição Estadual
Solução:
1. Solicitar IE válida ao cliente
2. Ou marcar como consumidor final
3. Verificar tipo operação (B2B vs B2C)
```

#### **"NCM incorreto"**
```
Problema: Produto com NCM errado
Solução:
1. Consultar tabela NCM oficial
2. Atualizar cadastro TOTVS
3. Sincronizar produtos sistema
4. Reemitir NFP-e se necessário
```

---

## 📚 MÓDULO 7: BOAS PRÁTICAS

### **7.1 Rotina Diária Recomendada**

#### **Manhã (8:00-9:00)**
- [ ] Verificar dashboard geral
- [ ] Revisar NFP-e noite anterior
- [ ] Conferir alertas pendentes
- [ ] Verificar conectividade SEFAZ/TOTVS
- [ ] Processar pendências manuais

#### **Meio-dia (12:00-13:00)**
- [ ] Revisar operações manhã
- [ ] Verificar sincronização TOTVS
- [ ] Processar correções/cancelamentos
- [ ] Acompanhar performance sistema

#### **Final do dia (17:00-18:00)**
- [ ] Conferir fechamento diário
- [ ] Processar últimas operações
- [ ] Verificar backup automático
- [ ] Preparar relatório se solicitado
- [ ] Documentar problemas/soluções

### **7.2 Manutenção Semanal**

#### **Segunda-feira**
- [ ] Sincronizar produtos TOTVS
- [ ] Gerar relatório semana anterior
- [ ] Verificar certificado digital (validade)
- [ ] Revisar configurações sistema

#### **Sexta-feira**  
- [ ] Backup manual adicional
- [ ] Limpar logs antigos
- [ ] Verificar performance semana
- [ ] Planejar próxima semana

### **7.3 Período Safra (Intensivo)**

#### **Monitoramento Reforçado**
- **Frequência**: A cada 2 horas
- **Alertas**: Críticos em 5 min
- **Backup**: 3x por dia
- **Equipe**: Plantão estendido

#### **Contingência Ativa**
- Processo manual documentado
- Contatos emergência atualizados
- Suporte 24/7 ativo
- Comunicação fazenda/cooperativas

---

## 🆘 MÓDULO 8: CONTATOS E SUPORTE

### **Níveis de Suporte**

#### **Nível 1 - Suporte Fazenda** (Primeiro contato)
- **João (Operador)**: (65) 99999-9999
- **Maria (Fiscal)**: (65) 98888-8888
- **Horário**: 7h-19h
- **SLA**: 30 min

#### **Nível 2 - Lion Consultoria** (Técnico especializado)
- **Hotline**: (65) 97777-7777
- **Email**: suporte@lion-consultoria.com
- **WhatsApp**: (65) 96666-6666
- **Horário**: 24/7 (safra) / 8h-18h (normal)
- **SLA**: 2 horas crítico / 4 horas normal

#### **Nível 3 - Fornecedores** (Escalação máxima)
- **TOTVS**: 0800-TOTVS (8486)
- **SEFAZ-MT**: (65) 3648-6000
- **Certificadora**: Conforme fornecedor
- **SLA**: Conforme contrato

### **Informações Emergência**

#### **Template Chamado Suporte**
```
CHAMADO NFP-e - URGENTE

Cliente: Fazenda Brasil
Usuário: [Nome + cargo]
Data/Hora: [dd/mm/aaaa hh:mm]

Problema: [Descrição clara]
Impacto: [Crítico/Alto/Médio/Baixo]
Sistema: [Funciona/Não funciona]

Telas erro: [Print anexo]
Passos reproduzir:
1. [Ação 1]
2. [Ação 2]
3. [Erro ocorreu]

Urgente porque: [Justificativa]
Contato retorno: [Telefone/WhatsApp]
```

### **Sites Úteis**

| Site | URL | Uso |
|------|-----|-----|
| **SEFAZ-MT** | sefaz.mt.gov.br | Status oficial, comunicados |
| **Portal NFP-e** | nfpe.fazenda-brasil.agro | Sistema principal |
| **Documentação** | docs.fazenda-brasil.agro | Manuais, tutoriais |
| **TOTVS** | suporte.totvs.com | Suporte Protheus |
| **Receita Federal** | receita.fazenda.gov.br | Validação CNPJ/CPF |

---

## ✅ CERTIFICAÇÃO OPERADORES

### **Teste Prático**

#### **Cenário 1: NFP-e Normal**
- Criar NFP-e soja 10.000 KG para Cooperfibra
- Verificar autorização SEFAZ
- Gerar relatório operação
- **Tempo máximo**: 15 minutos

#### **Cenário 2: Problema e Correção**
- Identificar NFP-e rejeitada
- Analisar erro retornado
- Corrigir dados incorretos  
- Retransmitir com sucesso
- **Tempo máximo**: 20 minutos

#### **Cenário 3: Cancelamento**
- Cancelar NFP-e autorizada
- Justificar adequadamente
- Verificar status final
- **Tempo máximo**: 10 minutos

### **Prova Teórica** (10 questões)

1. Qual prazo máximo cancelar NFP-e? **R: 24 horas**
2. Código SEFAZ para "Autorizada"? **R: 100**
3. O que fazer se SEFAZ offline? **R: Aguardar, sistema reagenda**
4. NCM para soja grãos? **R: 12019000**
5. Onde verificar conectividade TOTVS? **R: Menu TOTVS > Status**
6. SLA suporte crítico safra? **R: 2 horas**
7. Frequência backup automático? **R: 6 horas**
8. Como limpar cache navegador? **R: Ctrl+F5**
9. Valor mínimo caracteres justificativa cancelamento? **R: 15**
10. Status quando NFP-e sendo processada? **R: PROCESSANDO**

### **Certificado de Conclusão**

```
🏆 CERTIFICADO NFP-e FAZENDA BRASIL

Certificamos que [NOME] concluiu com sucesso 
o treinamento de operação do Sistema de 
Automação NFP-e, estando apto(a) para:

✅ Operar sistema autonomamente
✅ Resolver problemas básicos
✅ Executar procedimentos emergência
✅ Garantir compliance SEFAZ-MT

Válido por: 12 meses
Renovação: Reciclagem anual obrigatória

Data: ___/___/______
Instrutor: Lion Consultoria
Participante: ________________
```

---

## 📖 MATERIAL COMPLEMENTAR

### **Glossário Técnico**

| Termo | Definição |
|-------|-----------|
| **NFP-e** | Nota Fiscal do Produtor Eletrônica |
| **SEFAZ-MT** | Secretaria Fazenda Mato Grosso |
| **TOTVS** | Sistema ERP integrado |
| **Chave Acesso** | Identificador único NFP-e (44 dígitos) |
| **NCM** | Nomenclatura Comum Mercosul |
| **CFOP** | Código Fiscal Operações Prestações |
| **IE** | Inscrição Estadual |
| **CST** | Código Situação Tributária |
| **XML** | Formato arquivo NFP-e |

### **Atalhos Teclado**

| Atalho | Função |
|--------|--------|
| **Ctrl+F5** | Atualizar página (limpar cache) |
| **Ctrl+T** | Nova aba navegador |
| **Ctrl+W** | Fechar aba atual |
| **F11** | Tela cheia |
| **Ctrl+P** | Imprimir relatório |
| **Ctrl+S** | Salvar documento |

### **Checklist Impressão**

#### **Início do Dia**
- [ ] Sistema online
- [ ] SEFAZ conectado  
- [ ] TOTVS sincronizado
- [ ] Alertas verificados
- [ ] Email verificado

#### **Durante Operação**
- [ ] Dados conferidos
- [ ] Impostos calculados
- [ ] Destinatário validado
- [ ] XML gerado
- [ ] SEFAZ autorizado

#### **Final do Dia**
- [ ] Relatório gerado
- [ ] Problemas documentados
- [ ] Backup verificado
- [ ] Sistema estável
- [ ] Equipe informada

---

**🎓 PARABÉNS!**

Você completou o treinamento NFP-e Fazenda Brasil!

**Próximos passos**:
1. ✅ Praticar no sistema treinamento
2. ✅ Fazer certificação prática
3. ✅ Iniciar operação assistida
4. ✅ Operação autônoma após 7 dias

**Lembre-se**: Suporte sempre disponível! 📞

---

**🌾 Fazenda Brasil - NFP-e Automatizada**  
**Treinamento Completo • Operação Autônoma • Compliance 100%**