# Claude Code - Hooks Reference

## Fonte
- URL: https://docs.anthropic.com/en/docs/claude-code/hooks
- Tipo: Documentação oficial Anthropic
- Status: ✅ Processado

## Configuração
Hooks são configurados nos arquivos de settings:
- `~/.claude/settings.json` - User settings
- `.claude/settings.json` - Project settings
- `.claude/settings.local.json` - Local project settings (não commitado)
- Enterprise managed policy settings

## Estrutura dos Hooks
```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

## Eventos de Hook Disponíveis

### 1. PreToolUse
- **Quando**: Após Claude criar parâmetros da ferramenta, antes de processar
- **Uso**: Validação, modificação de parâmetros

### 2. PostToolUse
- **Quando**: Imediatamente após ferramenta completar com sucesso
- **Uso**: Processamento de resultados, logging, validação

### 3. Notification
- **Quando**: Claude Code envia notificações
- **Uso**: Integração com sistemas externos, alertas

### 4. UserPromptSubmit
- **Quando**: Usuário submete prompt, antes do Claude processar
- **Uso**: Adicionar contexto, validar prompts, bloquear tipos específicos

### 5. Stop
- **Quando**: Agente principal Claude Code termina resposta
- **Uso**: Cleanup, logging, continuação condicional

### 6. SubagentStop
- **Quando**: Subagente (Task tool call) termina resposta
- **Uso**: Coordenação entre subagentes

### 7. PreCompact
- **Quando**: Antes de operação de compactação
- **Uso**: Backup, preparação de contexto

### 8. SessionStart
- **Quando**: Nova sessão ou retomada de sessão
- **Uso**: Carregar contexto de desenvolvimento, issues, mudanças recentes

### 9. SessionEnd
- **Quando**: Sessão termina
- **Uso**: Cleanup, logging de estatísticas, salvar estado

## Matchers (Padrões)
- **Strings simples**: `"Write"` - match exato com ferramenta Write
- **Regex**: `"Edit|Write"` ou `"Notebook.*"`
- **Wildcard**: `"*"` - match com todas as ferramentas
- **String vazia**: `""` - deixar matcher em branco

## Tipos de Hook
- **command**: Atualmente o único tipo suportado
- **timeout**: (Opcional) Tempo limite em segundos

## Input/Output dos Hooks

### Input (via stdin)
Hooks recebem JSON com informações da sessão e dados específicos do evento:
- Session information
- Event-specific data
- Tool input/response (para PostToolUse)
- User prompt (para UserPromptSubmit)
- Transcript data (para Stop/SubagentStop)

### Output
Duas formas de retornar output:

#### 1. Exit Code Simples
- **0**: Sucesso, continuar
- **Não-zero**: Erro, bloquear operação
- **stdout/stderr**: Mensagens para usuário

#### 2. JSON Estruturado
```json
{
  "block": false,
  "message": "Mensagem para Claude e usuário",
  "user_message": "Mensagem apenas para usuário",
  "continue": false,
  "context": "Contexto adicional para Claude"
}
```

## Controle de Decisão por Evento

### PostToolUse
- Pode fornecer feedback para Claude após execução de ferramenta
- Controlar se deve continuar ou bloquear

### UserPromptSubmit
- Controlar se prompt do usuário deve ser processado
- Adicionar contexto antes do processamento

### Stop/SubagentStop
- Controlar se Claude deve continuar
- `stop_hook_active` previne loops infinitos

### SessionStart
- Carregar contexto no início da sessão
- Não pode bloquear início da sessão

## Integração com MCP
- Hooks funcionam com ferramentas MCP
- Ferramentas MCP aparecem com padrão de nomenclatura especial
- Permite automação de workflows MCP

## Considerações de Segurança
⚠️ **USAR POR SUA CONTA E RISCO**: Hooks executam comandos shell arbitrários automaticamente

### Melhores Práticas de Segurança
- Validar todos os inputs
- Usar caminhos absolutos
- Limitar permissões de execução
- Auditar comandos executados
- Testar em ambiente isolado

## Aplicações para ERPs Agro

### Hooks Específicos para Compliance
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write.*fiscal.*",
        "hooks": [
          {
            "type": "command",
            "command": "validate-sped-compliance.sh"
          }
        ]
      }
    ]
  }
}
```

### Automação de Integrações
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command", 
            "command": "load-cooperativa-context.py"
          }
        ]
      }
    ]
  }
}
```

### Validação de Dados Agro
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "validate-talhao-data.py"
          }
        ]
      }
    ]
  }
}
```

## Limitações Identificadas
- Apenas tipo "command" suportado atualmente
- Execução síncrona pode impactar performance
- Debugging limitado para hooks complexos
- Falta de templates para casos de uso específicos

