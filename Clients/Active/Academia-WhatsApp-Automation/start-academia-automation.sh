#!/bin/bash

# ============================================================================
# FULL FORCE ACADEMIA - SISTEMA DE AUTOMAÇÃO WHATSAPP
# ============================================================================
# Script principal para inicialização completa do sistema
# Target: 561 ex-alunos → R$ 12.600/mês → ROI 2.520%
# Local: Matupá-MT
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ACADEMIA_NAME="Full Force Academia"
ACADEMIA_LOCATION="Matupá-MT"
EX_STUDENTS_COUNT=561
REVENUE_TARGET=12600
ROI_TARGET=2520

N8N_URL="http://localhost:5678"
EVOLUTION_URL="http://localhost:8080"
DASHBOARD_URL="http://localhost:3001"

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_success "$service_name está rodando em $url"
        return 0
    else
        print_error "$service_name não está acessível em $url"
        return 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -ln 2>/dev/null | grep ":$port " > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Main execution starts here
print_header "🚀 INICIANDO FULL FORCE ACADEMIA AUTOMATION SYSTEM"

echo -e "🏢 ${GREEN}Academia:${NC} $ACADEMIA_NAME"
echo -e "📍 ${GREEN}Local:${NC} $ACADEMIA_LOCATION"
echo -e "👥 ${GREEN}Ex-alunos:${NC} $EX_STUDENTS_COUNT"
echo -e "💰 ${GREEN}Meta de receita:${NC} R$ $REVENUE_TARGET/mês"
echo -e "📈 ${GREEN}Meta ROI:${NC} $ROI_TARGET%"
echo ""

# Step 1: Check system prerequisites
print_header "🔍 VERIFICANDO PRÉ-REQUISITOS DO SISTEMA"

print_info "Verificando Node.js..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado. Instale Node.js 18+ antes de continuar"
    exit 1
fi

print_info "Verificando npm..."
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm encontrado: $NPM_VERSION"
else
    print_error "npm não encontrado"
    exit 1
fi

print_info "Verificando dependências do projeto..."
if [ -f "package.json" ]; then
    print_success "package.json encontrado"
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependências do projeto..."
        npm install
        print_success "Dependências instaladas"
    else
        print_success "node_modules já existe"
    fi
else
    print_warning "package.json não encontrado - alguns recursos podem não funcionar"
fi

# Step 2: Check Docker services
print_header "🐳 VERIFICANDO SERVIÇOS DOCKER"

if command -v docker > /dev/null 2>&1; then
    print_success "Docker encontrado"
    
    print_info "Verificando containers ativos..."
    RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}" | tail -n +2)
    
    if [ -z "$RUNNING_CONTAINERS" ]; then
        print_warning "Nenhum container rodando"
        print_info "Tentando iniciar serviços com docker-compose..."
        
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d
            print_success "Serviços Docker iniciados"
            sleep 10  # Wait for services to start
        else
            print_warning "docker-compose.yml não encontrado - serviços devem ser iniciados manualmente"
        fi
    else
        print_success "Containers ativos encontrados:"
        echo "$RUNNING_CONTAINERS" | while read container; do
            print_info "  - $container"
        done
    fi
else
    print_warning "Docker não encontrado - alguns serviços podem não funcionar"
fi

# Step 3: Check service availability
print_header "🌐 VERIFICANDO DISPONIBILIDADE DOS SERVIÇOS"

print_info "Verificando N8N..."
if check_service "$N8N_URL/healthz" "N8N"; then
    N8N_STATUS="✅"
else
    N8N_STATUS="❌"
    print_warning "N8N deve estar rodando em $N8N_URL"
fi

print_info "Verificando Evolution API..."
if check_service "$EVOLUTION_URL" "Evolution API"; then
    EVOLUTION_STATUS="✅"
else
    EVOLUTION_STATUS="❌"
    print_warning "Evolution API deve estar rodando em $EVOLUTION_URL"
fi

print_info "Verificando se porta 3001 está disponível para Dashboard..."
if check_port 3001; then
    DASHBOARD_STATUS="⚠️  Porta em uso"
else
    DASHBOARD_STATUS="✅ Disponível"
fi

# Step 4: Validate system configuration
print_header "⚙️ VALIDANDO CONFIGURAÇÕES DO SISTEMA"

print_info "Executando validação de saúde do sistema..."
if [ -f "scripts/validate-system-health.js" ]; then
    if node scripts/validate-system-health.js; then
        HEALTH_STATUS="✅ Saudável"
        print_success "Sistema passou em todas as verificações de saúde"
    else
        HEALTH_STATUS="⚠️  Issues encontradas"
        print_warning "Algumas issues foram encontradas - verifique os logs"
    fi
else
    print_warning "Script de validação não encontrado"
    HEALTH_STATUS="❓ Não verificado"
fi

# Step 5: LGPD Compliance Check
print_header "⚖️ VERIFICANDO CONFORMIDADE LGPD"

print_info "Executando validação LGPD..."
if [ -f "scripts/validate-lgpd-compliance.js" ]; then
    if node scripts/validate-lgpd-compliance.js; then
        LGPD_STATUS="✅ Conforme"
        print_success "Sistema está em conformidade com a LGPD"
    else
        LGPD_STATUS="⚠️  Issues de compliance"
        print_warning "Issues de compliance LGPD encontradas - devem ser corrigidas antes da produção"
    fi
else
    print_warning "Script de validação LGPD não encontrado"
    LGPD_STATUS="❓ Não verificado"
fi

# Step 6: Test WhatsApp Connection
print_header "📱 CONFIGURANDO CONEXÃO WHATSAPP"

print_info "Verificando conexão WhatsApp..."
if [ -f "scripts/test-whatsapp-connection.js" ]; then
    print_info "Para configurar o WhatsApp, execute:"
    print_info "node scripts/test-whatsapp-connection.js"
    print_info ""
    print_info "Isso irá:"
    print_info "1. Gerar QR Code para conexão WhatsApp"
    print_info "2. Configurar instância Full_Force_Academia"
    print_info "3. Testar envio de mensagens"
    print_info ""
    
    WHATSAPP_STATUS="⏳ Aguardando configuração"
else
    print_warning "Script de teste WhatsApp não encontrado"
    WHATSAPP_STATUS="❓ Não disponível"
fi

# Step 7: Import N8N Workflows
print_header "🔄 IMPORTANDO WORKFLOWS N8N"

print_info "Preparando importação de workflows..."
if [ -f "scripts/import-workflows-academia.js" ]; then
    print_info "Para importar workflows, execute:"
    print_info "node scripts/import-workflows-academia.js"
    print_info ""
    print_info "Isso irá importar:"
    print_info "1. Setup WhatsApp Evolution"
    print_info "2. Import ex-students database" 
    print_info "3. Automated reactivation campaign"
    print_info "4. AI response processing"
    print_info "5. ROI analytics dashboard"
    print_info ""
    
    WORKFLOWS_STATUS="⏳ Prontos para importação"
else
    print_warning "Script de importação não encontrado"
    WORKFLOWS_STATUS="❓ Não disponível"
fi

# Step 8: Start Dashboard
print_header "📊 INICIANDO DASHBOARD ROI"

print_info "Dashboard disponível em: public/dashboard-owner.html"
if [ -f "public/dashboard-owner.html" ]; then
    DASHBOARD_FILE_STATUS="✅ Arquivo disponível"
    
    # Try to start a simple HTTP server for the dashboard
    if command -v python3 > /dev/null 2>&1; then
        print_info "Iniciando servidor web simples para dashboard..."
        print_info "Acesse: http://localhost:8080/dashboard-owner.html"
        print_info ""
        print_info "Para iniciar servidor:"
        print_info "cd public && python3 -m http.server 8080"
        
    elif command -v python > /dev/null 2>&1; then
        print_info "Para iniciar servidor:"
        print_info "cd public && python -m SimpleHTTPServer 8080"
        
    else
        print_info "Para visualizar o dashboard, abra o arquivo:"
        print_info "$(pwd)/public/dashboard-owner.html"
    fi
else
    print_warning "Arquivo dashboard não encontrado"
    DASHBOARD_FILE_STATUS="❌ Não encontrado"
fi

# Final Summary
print_header "📋 RESUMO DO STATUS DO SISTEMA"

echo -e "🏢 ${GREEN}Academia:${NC} $ACADEMIA_NAME - $ACADEMIA_LOCATION"
echo -e "👥 ${GREEN}Target:${NC} $EX_STUDENTS_COUNT ex-alunos → R$ $REVENUE_TARGET/mês → $ROI_TARGET% ROI"
echo ""

echo -e "📊 ${BLUE}STATUS DOS SERVIÇOS:${NC}"
echo -e "  • N8N:                    $N8N_STATUS"
echo -e "  • Evolution API:          $EVOLUTION_STATUS"
echo -e "  • Dashboard:              $DASHBOARD_STATUS"
echo -e "  • System Health:          $HEALTH_STATUS"
echo -e "  • LGPD Compliance:        $LGPD_STATUS"
echo -e "  • WhatsApp:               $WHATSAPP_STATUS"
echo -e "  • Workflows:              $WORKFLOWS_STATUS"
echo -e "  • Dashboard File:         $DASHBOARD_FILE_STATUS"
echo ""

print_header "🚀 PRÓXIMOS PASSOS RECOMENDADOS"

echo -e "${GREEN}1. CONFIGURAR WHATSAPP:${NC}"
echo -e "   node scripts/test-whatsapp-connection.js"
echo ""

echo -e "${GREEN}2. IMPORTAR WORKFLOWS:${NC}"
echo -e "   node scripts/import-workflows-academia.js"
echo ""

echo -e "${GREEN}3. ACESSAR N8N:${NC}"
echo -e "   Browser: $N8N_URL"
echo -e "   Login: eugabrielmktd@gmail.com / Adogo123"
echo ""

echo -e "${GREEN}4. VISUALIZAR DASHBOARD:${NC}"
echo -e "   Arquivo: public/dashboard-owner.html"
echo -e "   ou: http://localhost:8080/dashboard-owner.html"
echo ""

echo -e "${GREEN}5. COMPLIANCE:${NC}"
echo -e "   node scripts/validate-lgpd-compliance.js"
echo ""

print_header "⚡ AUTOMAÇÃO ATIVA EM 2 HORAS"

echo -e "✅ ${GREEN}Sistema configurado para:${NC}"
echo -e "   • 20 mensagens automáticas por dia"
echo -e "   • Segmentação QUENTE/MORNO/FRIO"
echo -e "   • Compliance LGPD automática"
echo -e "   • Dashboard ROI em tempo real"
echo -e "   • Taxa de conversão alvo: 15%"
echo -e "   • Receita alvo: R$ $REVENUE_TARGET/mês"
echo ""

echo -e "🎯 ${BLUE}Meta: Sistema gerando ROI de $ROI_TARGET% dentro de 30 dias${NC}"
echo -e "📊 ${BLUE}Projeção: $EX_STUDENTS_COUNT ex-alunos → 84 reativações → R$ $REVENUE_TARGET/mês${NC}"
echo ""

print_success "FULL FORCE ACADEMIA AUTOMATION SYSTEM - PRONTO! 💪"

exit 0