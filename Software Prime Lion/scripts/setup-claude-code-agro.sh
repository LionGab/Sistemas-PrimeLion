#!/bin/bash

# Setup Claude Code para ERPs Agronegócio
# Versão: 1.0
# Data: 2025-08-31

set -e

echo "🌾 Configurando Claude Code para ERPs Agronegócio..."
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se Claude Code está instalado
check_claude_code() {
    log "Verificando instalação Claude Code..."
    if ! command -v claude &> /dev/null; then
        error "Claude Code não encontrado. Instale primeiro: https://claude.ai/code"
    fi
    log "Claude Code encontrado: $(claude --version)"
}

# Criar estrutura de diretórios
create_directory_structure() {
    log "Criando estrutura de diretórios..."
    
    mkdir -p ~/.claude/agro-erp/{
        settings,
        agents,
        hooks,
        mcps,
        schemas,
        scripts,
        templates,
        docs
    }
    
    log "Estrutura criada em ~/.claude/agro-erp/"
}

# Configurar settings básicos
setup_basic_settings() {
    log "Configurando settings básicos..."
    
    cat > ~/.claude/agro-erp/settings/base.json << 'EOF'
{
  "permissions": {
    "defaultMode": "normal",
    "allowedTools": ["*"],
    "restrictedPaths": []
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write.*fiscal.*",
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/agro-erp/scripts/validate-fiscal-data.py",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Database.*",
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/agro-erp/scripts/audit-database-changes.py",
            "timeout": 60
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python ~/.claude/agro-erp/scripts/load-agro-context.py",
            "timeout": 15
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/agro-erp/scripts/setup-agro-environment.sh",
            "timeout": 45
          }
        ]
      }
    ]
  },
  "mcps": {
    "sefaz-mt": {
      "enabled": true,
      "config": {
        "environment": "homologacao",
        "timeout": 30000
      }
    },
    "banking-br": {
      "enabled": true,
      "config": {
        "protocols": ["pix", "cnab240", "cnab400"],
        "timeout": 15000
      }
    },
    "cooperativa-local": {
      "enabled": false,
      "config": {
        "edi_format": "edifact",
        "timeout": 20000
      }
    }
  }
}
EOF
    
    log "Settings básicos configurados"
}

# Criar subagentes especializados
create_specialized_agents() {
    log "Criando subagentes especializados para agronegócio..."
    
    # Agente Compliance Fiscal
    cat > ~/.claude/agro-erp/agents/agro-fiscal-compliance.yaml << 'EOF'
---
name: agro-fiscal-compliance
description: Especialista em compliance fiscal para agronegócio brasileiro
tools: [sefaz-mt, banking-br, database]
---

Você é um especialista em compliance fiscal para o agronegócio brasileiro, com conhecimento profundo de:

## Regulamentações Fiscais
- SPED Fiscal, Contábil, ECD, ECF
- NFe, NFCe, CTe, MDFe, NFS-e
- FUNRURAL, INCRA, ITR
- Regulamentações específicas MT: NFP-e, SEFAZ-MT
- LGPD aplicada ao agronegócio

## Processos Agronegócio
- Ciclos produtivos (soja, milho, algodão)
- Gestão por talhões e safras
- Contratos de commodities
- Beneficiamento e armazenagem
- Logística e transporte rural

## Integrações Críticas
- SEFAZ-MT: Consultas, validações, emissões
- Bancos: PIX, CNAB, conciliação
- Cooperativas: EDI, recebimento, liquidação
- INDEA-MT: GTA, certificados fitossanitários

## Workflow de Validação
1. Analisar dados fiscais de entrada
2. Validar conformidade regulamentações
3. Verificar integridade integrações
4. Gerar alertas não-conformidades
5. Sugerir correções automáticas
6. Documentar validações realizadas

Sempre priorize conformidade 100% e sugira melhorias proativas.
EOF

    # Agente Integração APIs
    cat > ~/.claude/agro-erp/agents/agro-api-integrator.yaml << 'EOF'
---
name: agro-api-integrator
description: Especialista em integrações APIs para agronegócio
tools: [http-client, database, file-system]
---

Você é um especialista em integrações de APIs para o agronegócio, focado em:

## APIs Governamentais
- SEFAZ (todos os estados, especialmente MT)
- Receita Federal (CNPJ, CPF, SPED)
- INCRA (SNIR, SIGEF)
- INDEA (GTA, certificados)
- MAPA (AGROFIT, sementes)

## APIs Financeiras
- Bancos: BB, Bradesco, Sicredi, Sicoob
- PIX: SPI, DICT, cobrança
- CNAB: 240, 400, retornos
- Open Finance: consentimentos, dados

## APIs Cooperativas
- Sistemas próprios cooperativas
- EDI EDIFACT para commodities
- Classificação e recebimento
- Liquidação financeira

## APIs Terceiros
- Meteorologia: INMET, Weather APIs
- Satélite: Planet, Sentinel, MODIS
- Cotações: B3, CME, CBOT
- Logística: transportadoras, rastreamento

## Padrões de Integração
- REST APIs com autenticação OAuth2/JWT
- SOAP para sistemas legados
- WebSockets para real-time
- Message queues para processamento assíncrono
- Retry policies e circuit breakers
- Logging e monitoring completo

Sempre implemente integrações robustas, com tratamento de erros e fallbacks.
EOF

    # Agente Modernização Legacy
    cat > ~/.claude/agro-erp/agents/agro-legacy-modernizer.yaml << 'EOF'
---
name: agro-legacy-modernizer
description: Especialista em modernização de sistemas ERP legados do agronegócio
tools: [code-analyzer, database, refactoring-tools]
---

Você é um especialista em modernização de sistemas ERP legados do agronegócio, com foco em:

## Análise de Sistemas Legados
- Mapeamento arquitetura existente
- Identificação dependências críticas
- Análise qualidade código
- Documentação processos de negócio
- Avaliação riscos migração

## Estratégias de Modernização
- Strangler Fig Pattern para migração gradual
- API Gateway para integração híbrida
- Microserviços para módulos específicos
- Event-driven architecture
- Database modernization incremental

## Tecnologias Alvo
- Cloud-native: Kubernetes, Docker
- APIs modernas: GraphQL, REST
- Databases: PostgreSQL, MongoDB
- Message brokers: RabbitMQ, Kafka
- Monitoring: Prometheus, Grafana

## Processos Agro Específicos
- Migração dados safras históricas
- Preservação compliance fiscal
- Integração sistemas campo (offline)
- Manutenção integrações cooperativas
- Continuidade operacional crítica

## Metodologia
1. Assessment completo sistema atual
2. Planejamento migração por módulos
3. Implementação incremental com rollback
4. Testes paralelos produção/novo
5. Cutover controlado por funcionalidade
6. Monitoring pós-migração

Sempre priorize continuidade operacional e zero perda de dados.
EOF

    log "Subagentes especializados criados"
}

# Criar scripts de validação
create_validation_scripts() {
    log "Criando scripts de validação..."
    
    # Script validação fiscal
    cat > ~/.claude/agro-erp/scripts/validate-fiscal-data.py << 'EOF'
#!/usr/bin/env python3
"""
Script de validação de dados fiscais para agronegócio
Executa validações automáticas antes de operações fiscais críticas
"""

import sys
import json
import re
from datetime import datetime
from typing import Dict, List, Any

def validate_cnpj(cnpj: str) -> bool:
    """Valida CNPJ usando algoritmo oficial"""
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    if len(cnpj) != 14:
        return False
    
    # Algoritmo validação CNPJ
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9]
    
    def calc_digit(cnpj_digits, weights):
        sum_result = sum(int(digit) * weight for digit, weight in zip(cnpj_digits, weights))
        remainder = sum_result % 11
        return 0 if remainder < 2 else 11 - remainder
    
    first_digit = calc_digit(cnpj[:12], weights1)
    second_digit = calc_digit(cnpj[:13], weights2)
    
    return cnpj[12:14] == f"{first_digit}{second_digit}"

def validate_nfe_data(data: Dict[str, Any]) -> List[str]:
    """Valida dados para emissão NFe"""
    errors = []
    
    # Validações obrigatórias NFe
    required_fields = [
        'cnpj_emitente', 'cnpj_destinatario', 'valor_total',
        'cfop', 'natureza_operacao', 'items'
    ]
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"Campo obrigatório ausente: {field}")
    
    # Validar CNPJs
    if 'cnpj_emitente' in data and not validate_cnpj(data['cnpj_emitente']):
        errors.append("CNPJ emitente inválido")
    
    if 'cnpj_destinatario' in data and not validate_cnpj(data['cnpj_destinatario']):
        errors.append("CNPJ destinatário inválido")
    
    # Validar CFOP agronegócio
    cfop_agro_valid = ['5101', '5102', '5103', '5104', '5105', '5106', '5109', '5110']
    if 'cfop' in data and data['cfop'] not in cfop_agro_valid:
        errors.append(f"CFOP {data['cfop']} não é válido para agronegócio")
    
    # Validar itens
    if 'items' in data:
        for i, item in enumerate(data['items']):
            if 'ncm' not in item:
                errors.append(f"Item {i+1}: NCM obrigatório")
            if 'valor_unitario' not in item or item['valor_unitario'] <= 0:
                errors.append(f"Item {i+1}: Valor unitário inválido")
    
    return errors

def validate_funrural_data(data: Dict[str, Any]) -> List[str]:
    """Valida dados para cálculo FUNRURAL"""
    errors = []
    
    # Validações FUNRURAL
    if 'tipo_produtor' not in data:
        errors.append("Tipo de produtor não informado")
    elif data['tipo_produtor'] not in ['PF', 'PJ']:
        errors.append("Tipo de produtor deve ser PF ou PJ")
    
    if 'valor_comercializacao' not in data or data['valor_comercializacao'] <= 0:
        errors.append("Valor de comercialização inválido")
    
    # Verificar produtos com isenção
    produtos_isencao = ['sementes_certificadas', 'mudas_certificadas']
    if 'produto' in data and data['produto'] in produtos_isencao:
        if 'certificado_mapa' not in data:
            errors.append("Produto com isenção requer certificado MAPA")
    
    return errors

def main():
    """Função principal de validação"""
    try:
        # Ler dados do stdin (enviados pelo Claude Code)
        input_data = json.loads(sys.stdin.read())
        
        validation_errors = []
        
        # Determinar tipo de validação baseado no contexto
        if 'nfe' in input_data:
            validation_errors.extend(validate_nfe_data(input_data['nfe']))
        
        if 'funrural' in input_data:
            validation_errors.extend(validate_funrural_data(input_data['funrural']))
        
        # Resultado da validação
        result = {
            'timestamp': datetime.now().isoformat(),
            'valid': len(validation_errors) == 0,
            'errors': validation_errors,
            'warnings': []
        }
        
        # Output para Claude Code
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Exit code baseado na validação
        sys.exit(0 if result['valid'] else 1)
        
    except Exception as e:
        error_result = {
            'timestamp': datetime.now().isoformat(),
            'valid': False,
            'errors': [f"Erro interno validação: {str(e)}"],
            'warnings': []
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    chmod +x ~/.claude/agro-erp/scripts/validate-fiscal-data.py
    
    # Script auditoria database
    cat > ~/.claude/agro-erp/scripts/audit-database-changes.py << 'EOF'
#!/usr/bin/env python3
"""
Script de auditoria para mudanças no database
Registra todas as operações críticas para compliance
"""

import sys
import json
import hashlib
from datetime import datetime
from typing import Dict, Any

def hash_data(data: Any) -> str:
    """Gera hash dos dados para auditoria"""
    data_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(data_str.encode()).hexdigest()

def audit_database_operation(operation_data: Dict[str, Any]) -> Dict[str, Any]:
    """Audita operação no database"""
    
    audit_record = {
        'timestamp': datetime.now().isoformat(),
        'operation_type': operation_data.get('type', 'unknown'),
        'table': operation_data.get('table', 'unknown'),
        'user': operation_data.get('user', 'system'),
        'data_hash': hash_data(operation_data.get('data', {})),
        'compliance_flags': []
    }
    
    # Verificar operações críticas para compliance
    critical_tables = [
        'nfe_emitidas', 'nfe_recebidas', 'sped_registros',
        'funrural_calculos', 'talhoes', 'safras', 'contratos'
    ]
    
    if audit_record['table'] in critical_tables:
        audit_record['compliance_flags'].append('CRITICAL_DATA')
    
    # Verificar operações fiscais
    if 'fiscal' in audit_record['table'] or 'nfe' in audit_record['table']:
        audit_record['compliance_flags'].append('FISCAL_OPERATION')
    
    # Verificar operações financeiras
    if any(keyword in audit_record['table'] for keyword in ['pagamento', 'recebimento', 'conciliacao']):
        audit_record['compliance_flags'].append('FINANCIAL_OPERATION')
    
    return audit_record

def main():
    """Função principal de auditoria"""
    try:
        # Ler dados da operação
        input_data = json.loads(sys.stdin.read())
        
        # Gerar registro de auditoria
        audit_record = audit_database_operation(input_data)
        
        # Salvar em log de auditoria (em produção, usar database dedicado)
        audit_log_path = "~/.claude/agro-erp/logs/database_audit.jsonl"
        with open(audit_log_path, "a") as f:
            f.write(json.dumps(audit_record, ensure_ascii=False) + "\n")
        
        # Output para Claude Code
        result = {
            'audit_id': audit_record['timestamp'],
            'status': 'recorded',
            'compliance_flags': audit_record['compliance_flags']
        }
        
        print(json.dumps(result, indent=2, ensure_ascii=False))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'message': f"Erro auditoria: {str(e)}"
        }
        print(json.dumps(error_result, indent=2, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

    chmod +x ~/.claude/agro-erp/scripts/audit-database-changes.py
    
    log "Scripts de validação criados"
}

# Criar schemas MCP
create_mcp_schemas() {
    log "Criando schemas MCP..."
    
    # Schema SEFAZ-MT MCP
    cat > ~/.claude/agro-erp/schemas/sefaz-mt-mcp.json << 'EOF'
{
  "name": "sefaz-mt",
  "version": "1.0.0",
  "description": "MCP Server para integração com SEFAZ-MT",
  "tools": [
    {
      "name": "consultar_nfe",
      "description": "Consulta situação de NFe no SEFAZ-MT",
      "inputSchema": {
        "type": "object",
        "properties": {
          "chave_nfe": {
            "type": "string",
            "pattern": "^[0-9]{44}$",
            "description": "Chave de acesso da NFe (44 dígitos)"
          },
          "ambiente": {
            "type": "string",
            "enum": ["producao", "homologacao"],
            "default": "homologacao"
          }
        },
        "required": ["chave_nfe"]
      }
    },
    {
      "name": "emitir_nfe",
      "description": "Emite NFe através do SEFAZ-MT",
      "inputSchema": {
        "type": "object",
        "properties": {
          "dados_nfe": {
            "type": "object",
            "properties": {
              "emitente": {"$ref": "#/definitions/empresa"},
              "destinatario": {"$ref": "#/definitions/empresa"},
              "itens": {
                "type": "array",
                "items": {"$ref": "#/definitions/item_nfe"}
              },
              "totais": {"$ref": "#/definitions/totais_nfe"}
            },
            "required": ["emitente", "destinatario", "itens", "totais"]
          }
        },
        "required": ["dados_nfe"]
      }
    },
    {
      "name": "consultar_cadastro",
      "description": "Consulta cadastro de contribuinte no SEFAZ-MT",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cnpj": {
            "type": "string",
            "pattern": "^[0-9]{14}$"
          },
          "inscricao_estadual": {
            "type": "string"
          }
        }
      }
    }
  ],
  "definitions": {
    "empresa": {
      "type": "object",
      "properties": {
        "cnpj": {"type": "string", "pattern": "^[0-9]{14}$"},
        "inscricao_estadual": {"type": "string"},
        "razao_social": {"type": "string"},
        "endereco": {"$ref": "#/definitions/endereco"}
      },
      "required": ["cnpj", "razao_social"]
    },
    "endereco": {
      "type": "object",
      "properties": {
        "logradouro": {"type": "string"},
        "numero": {"type": "string"},
        "bairro": {"type": "string"},
        "municipio": {"type": "string"},
        "uf": {"type": "string", "pattern": "^[A-Z]{2}$"},
        "cep": {"type": "string", "pattern": "^[0-9]{8}$"}
      },
      "required": ["logradouro", "municipio", "uf", "cep"]
    },
    "item_nfe": {
      "type": "object",
      "properties": {
        "codigo": {"type": "string"},
        "descricao": {"type": "string"},
        "ncm": {"type": "string", "pattern": "^[0-9]{8}$"},
        "cfop": {"type": "string", "pattern": "^[0-9]{4}$"},
        "quantidade": {"type": "number", "minimum": 0},
        "valor_unitario": {"type": "number", "minimum": 0},
        "valor_total": {"type": "number", "minimum": 0}
      },
      "required": ["descricao", "ncm", "cfop", "quantidade", "valor_unitario"]
    },
    "totais_nfe": {
      "type": "object",
      "properties": {
        "valor_produtos": {"type": "number", "minimum": 0},
        "valor_frete": {"type": "number", "minimum": 0},
        "valor_seguro": {"type": "number", "minimum": 0},
        "valor_desconto": {"type": "number", "minimum": 0},
        "valor_total": {"type": "number", "minimum": 0},
        "icms_total": {"type": "number", "minimum": 0},
        "ipi_total": {"type": "number", "minimum": 0}
      },
      "required": ["valor_produtos", "valor_total"]
    }
  }
}
EOF

    # Schema Banking MCP
    cat > ~/.claude/agro-erp/schemas/banking-br-mcp.json << 'EOF'
{
  "name": "banking-br",
  "version": "1.0.0", 
  "description": "MCP Server para integrações bancárias brasileiras",
  "tools": [
    {
      "name": "processar_pix",
      "description": "Processa transação PIX",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tipo": {
            "type": "string",
            "enum": ["cobranca", "transferencia", "consulta"]
          },
          "valor": {"type": "number", "minimum": 0.01},
          "chave_pix": {"type": "string"},
          "descricao": {"type": "string", "maxLength": 140}
        },
        "required": ["tipo", "chave_pix"]
      }
    },
    {
      "name": "gerar_cnab240",
      "description": "Gera arquivo CNAB 240 para remessa bancária",
      "inputSchema": {
        "type": "object",
        "properties": {
          "banco": {"type": "string", "pattern": "^[0-9]{3}$"},
          "agencia": {"type": "string"},
          "conta": {"type": "string"},
          "pagamentos": {
            "type": "array",
            "items": {"$ref": "#/definitions/pagamento_cnab"}
          }
        },
        "required": ["banco", "agencia", "conta", "pagamentos"]
      }
    },
    {
      "name": "processar_retorno_cnab",
      "description": "Processa arquivo de retorno CNAB",
      "inputSchema": {
        "type": "object",
        "properties": {
          "arquivo_retorno": {"type": "string"},
          "formato": {
            "type": "string",
            "enum": ["cnab240", "cnab400"]
          }
        },
        "required": ["arquivo_retorno", "formato"]
      }
    },
    {
      "name": "conciliar_extrato",
      "description": "Concilia extrato bancário com lançamentos",
      "inputSchema": {
        "type": "object",
        "properties": {
          "extrato": {
            "type": "array",
            "items": {"$ref": "#/definitions/lancamento_bancario"}
          },
          "periodo": {
            "type": "object",
            "properties": {
              "data_inicio": {"type": "string", "format": "date"},
              "data_fim": {"type": "string", "format": "date"}
            },
            "required": ["data_inicio", "data_fim"]
          }
        },
        "required": ["extrato", "periodo"]
      }
    }
  ],
  "definitions": {
    "pagamento_cnab": {
      "type": "object",
      "properties": {
        "favorecido": {"type": "string"},
        "cpf_cnpj": {"type": "string"},
        "banco": {"type": "string", "pattern": "^[0-9]{3}$"},
        "agencia": {"type": "string"},
        "conta": {"type": "string"},
        "valor": {"type": "number", "minimum": 0.01},
        "data_pagamento": {"type": "string", "format": "date"},
        "finalidade": {"type": "string"}
      },
      "required": ["favorecido", "cpf_cnpj", "valor", "data_pagamento"]
    },
    "lancamento_bancario": {
      "type": "object",
      "properties": {
        "data": {"type": "string", "format": "date"},
        "historico": {"type": "string"},
        "documento": {"type": "string"},
        "valor": {"type": "number"},
        "tipo": {
          "type": "string",
          "enum": ["debito", "credito"]
        },
        "saldo": {"type": "number"}
      },
      "required": ["data", "historico", "valor", "tipo"]
    }
  }
}
EOF

    log "Schemas MCP criados"
}

# Criar templates de projeto
create_project_templates() {
    log "Criando templates de projeto..."
    
    # Template módulo ERP básico
    cat > ~/.claude/agro-erp/templates/modulo-erp-basico.md << 'EOF'
# Template: Módulo ERP Básico para Agronegócio

## Prompt Inicial
```
Desenvolver módulo ERP para agronegócio com as seguintes características:

**Funcionalidade**: [DESCREVER FUNCIONALIDADE PRINCIPAL]
**Escopo**: [DEFINIR ESCOPO ESPECÍFICO]
**Integrações**: [LISTAR INTEGRAÇÕES NECESSÁRIAS]
**Compliance**: [REQUISITOS FISCAIS/REGULATÓRIOS]

**Stack Tecnológica**:
- Backend: Node.js + TypeScript + Fastify
- Database: PostgreSQL + Prisma ORM
- Frontend: Next.js + React + Tailwind CSS
- APIs: GraphQL + REST
- Testes: Jest + Cypress
- Deploy: Docker + Kubernetes

**Requisitos Específicos Agro**:
- Suporte offline para operações de campo
- Integração SEFAZ-MT para compliance fiscal
- Gestão por talhões/safras/ciclos produtivos
- Rastreabilidade completa da cadeia
- Relatórios gerenciais específicos

**Arquitetura**:
- Microserviços com API Gateway
- Event-driven para integrações
- CQRS para operações complexas
- Cache Redis para performance
- Message queue para processamento assíncrono

Implemente seguindo as melhores práticas de desenvolvimento e inclua:
1. Estrutura completa do projeto
2. Modelos de dados (Prisma schema)
3. APIs REST e GraphQL
4. Interface web responsiva
5. Testes automatizados
6. Documentação técnica
7. Scripts de deploy
8. Configuração CI/CD
```

## Estrutura de Diretórios Esperada
```
projeto-modulo-agro/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── database/
│   │   └── tests/
│   ├── prisma/
│   ├── docker/
│   └── docs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   ├── public/
│   └── tests/
├── shared/
│   ├── types/
│   └── schemas/
├── deployment/
│   ├── kubernetes/
│   ├── docker-compose/
│   └── scripts/
└── docs/
    ├── api/
    ├── user/
    └── technical/
```

## Checklist de Validação
- [ ] Estrutura de projeto completa
- [ ] Database schema com relacionamentos
- [ ] APIs funcionais (REST + GraphQL)
- [ ] Interface web responsiva
- [ ] Testes unitários e integração
- [ ] Documentação API (OpenAPI/Swagger)
- [ ] Scripts deploy automatizado
- [ ] Configuração CI/CD
- [ ] Compliance fiscal implementado
- [ ] Suporte offline básico
EOF

    # Template integração API
    cat > ~/.claude/agro-erp/templates/integracao-api.md << 'EOF'
# Template: Integração API Externa

## Prompt Inicial
```
Implementar integração robusta com API externa para ERP agronegócio:

**API Alvo**: [NOME DA API - ex: SEFAZ-MT, Banco do Brasil, Cooperativa]
**Funcionalidades**: [LISTAR ENDPOINTS NECESSÁRIOS]
**Autenticação**: [TIPO - OAuth2, JWT, API Key, Certificado Digital]
**Formato**: [REST, SOAP, GraphQL, EDI]

**Requisitos Técnicos**:
- Retry policy com backoff exponencial
- Circuit breaker para falhas
- Rate limiting respeitando limites API
- Cache inteligente para reduzir chamadas
- Logging completo para auditoria
- Monitoring e alertas
- Fallback para indisponibilidade

**Requisitos Agronegócio**:
- Suporte operação offline (quando aplicável)
- Validação dados antes envio
- Conformidade regulamentações específicas
- Rastreabilidade completa transações
- Relatórios de status integrações

**Implementar**:
1. Cliente API com todas as funcionalidades
2. Modelos de dados (request/response)
3. Validações e transformações
4. Testes unitários e integração
5. Documentação técnica
6. Scripts configuração
7. Monitoring e alertas
8. Exemplos de uso
```

## Estrutura Esperada
```
integracao-[api-name]/
├── src/
│   ├── client/
│   │   ├── [api-name]-client.ts
│   │   ├── auth/
│   │   ├── endpoints/
│   │   └── types/
│   ├── services/
│   │   ├── [api-name]-service.ts
│   │   ├── cache/
│   │   ├── retry/
│   │   └── validation/
│   ├── models/
│   │   ├── request/
│   │   ├── response/
│   │   └── mappings/
│   └── utils/
│       ├── logger.ts
│       ├── monitoring.ts
│       └── helpers.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── mocks/
├── docs/
│   ├── api-reference.md
│   ├── setup-guide.md
│   └── troubleshooting.md
└── config/
    ├── environments/
    └── schemas/
```

## Checklist de Validação
- [ ] Cliente API completo e funcional
- [ ] Autenticação implementada corretamente
- [ ] Retry policy e circuit breaker
- [ ] Cache e rate limiting
- [ ] Logging e monitoring
- [ ] Testes abrangentes (>90% cobertura)
- [ ] Documentação completa
- [ ] Tratamento de erros robusto
- [ ] Validação dados entrada/saída
- [ ] Configuração por ambiente
EOF

    log "Templates de projeto criados"
}

# Função principal
main() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║    🌾 CLAUDE CODE SETUP PARA ERPs AGRONEGÓCIO 🌾           ║
    ║                                                              ║
    ║    Configuração completa para desenvolvimento acelerado      ║
    ║    de sistemas ERP para o agronegócio brasileiro            ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    check_claude_code
    create_directory_structure
    setup_basic_settings
    create_specialized_agents
    create_validation_scripts
    create_mcp_schemas
    create_project_templates
    
    echo ""
    log "✅ Setup concluído com sucesso!"
    echo ""
    echo -e "${GREEN}Próximos passos:${NC}"
    echo "1. Configurar MCPs específicos: cd ~/.claude/agro-erp/mcps/"
    echo "2. Testar subagentes: claude --agent agro-fiscal-compliance"
    echo "3. Usar templates: cat ~/.claude/agro-erp/templates/modulo-erp-basico.md"
    echo "4. Verificar logs: tail -f ~/.claude/agro-erp/logs/database_audit.jsonl"
    echo ""
    echo -e "${YELLOW}Documentação completa em: ~/.claude/agro-erp/docs/${NC}"
    echo ""
}

# Executar setup
main "$@"

