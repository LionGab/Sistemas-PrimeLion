#!/usr/bin/env python3
"""
SEFAZ-MT MCP Server
Servidor MCP para integração com APIs do SEFAZ-MT
Versão: 1.0.0
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import xml.etree.ElementTree as ET
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import base64

# Configuração logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SEFAZMTClient:
    """Cliente para APIs do SEFAZ-MT"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.ambiente = config.get('ambiente', 'homologacao')
        self.timeout = config.get('timeout', 30)
        
        # URLs por ambiente
        self.urls = {
            'homologacao': {
                'nfe_consulta': 'https://homologacao.sefaz.mt.gov.br/nfews/v1/consulta',
                'nfe_emissao': 'https://homologacao.sefaz.mt.gov.br/nfews/v1/emissao',
                'cadastro': 'https://homologacao.sefaz.mt.gov.br/cadastro/v1/consulta'
            },
            'producao': {
                'nfe_consulta': 'https://www.sefaz.mt.gov.br/nfews/v1/consulta',
                'nfe_emissao': 'https://www.sefaz.mt.gov.br/nfews/v1/emissao',
                'cadastro': 'https://www.sefaz.mt.gov.br/cadastro/v1/consulta'
            }
        }
    
    def _validate_chave_nfe(self, chave: str) -> bool:
        """Valida chave de acesso NFe"""
        if len(chave) != 44 or not chave.isdigit():
            return False
        
        # Validação dígito verificador (algoritmo simplificado)
        weights = [2, 3, 4, 5, 6, 7, 8, 9] * 5 + [2, 3, 4, 5]
        sum_result = sum(int(digit) * weight for digit, weight in zip(chave[:43], weights))
        remainder = sum_result % 11
        dv = 0 if remainder < 2 else 11 - remainder
        
        return int(chave[43]) == dv
    
    def _validate_cnpj(self, cnpj: str) -> bool:
        """Valida CNPJ"""
        cnpj = ''.join(filter(str.isdigit, cnpj))
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
    
    async def consultar_nfe(self, chave_nfe: str) -> Dict[str, Any]:
        """Consulta situação de NFe no SEFAZ-MT"""
        try:
            # Validar chave
            if not self._validate_chave_nfe(chave_nfe):
                return {
                    'success': False,
                    'error': 'Chave de NFe inválida',
                    'code': 'INVALID_KEY'
                }
            
            # Preparar requisição
            url = self.urls[self.ambiente]['nfe_consulta']
            headers = {
                'Content-Type': 'application/xml',
                'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF'
            }
            
            # XML de consulta (simplificado)
            xml_consulta = f"""<?xml version="1.0" encoding="UTF-8"?>
            <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
                <soap:Header/>
                <soap:Body>
                    <nfeConsultaNF xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
                        <nfeDadosMsg>
                            <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
                                <tpAmb>{1 if self.ambiente == 'producao' else 2}</tpAmb>
                                <xServ>CONSULTAR</xServ>
                                <chNFe>{chave_nfe}</chNFe>
                            </consSitNFe>
                        </nfeDadosMsg>
                    </nfeConsultaNF>
                </soap:Body>
            </soap:Envelope>"""
            
            # Fazer requisição (simulada para exemplo)
            # Em produção, usar certificado digital A1/A3
            response_data = {
                'success': True,
                'chave': chave_nfe,
                'situacao': 'Autorizada',
                'protocolo': '135240000000001',
                'data_autorizacao': datetime.now().isoformat(),
                'ambiente': self.ambiente
            }
            
            logger.info(f"NFe consultada: {chave_nfe}")
            return response_data
            
        except Exception as e:
            logger.error(f"Erro consulta NFe: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'code': 'CONSULTATION_ERROR'
            }
    
    async def emitir_nfe(self, dados_nfe: Dict[str, Any]) -> Dict[str, Any]:
        """Emite NFe através do SEFAZ-MT"""
        try:
            # Validações básicas
            emitente = dados_nfe.get('emitente', {})
            if not self._validate_cnpj(emitente.get('cnpj', '')):
                return {
                    'success': False,
                    'error': 'CNPJ do emitente inválido',
                    'code': 'INVALID_EMITTER_CNPJ'
                }
            
            destinatario = dados_nfe.get('destinatario', {})
            if not self._validate_cnpj(destinatario.get('cnpj', '')):
                return {
                    'success': False,
                    'error': 'CNPJ do destinatário inválido',
                    'code': 'INVALID_RECIPIENT_CNPJ'
                }
            
            # Validar itens
            itens = dados_nfe.get('itens', [])
            if not itens:
                return {
                    'success': False,
                    'error': 'NFe deve conter pelo menos um item',
                    'code': 'NO_ITEMS'
                }
            
            # Gerar chave NFe (simulada)
            chave_nfe = self._gerar_chave_nfe(dados_nfe)
            
            # Simular emissão (em produção, gerar XML completo e assinar)
            response_data = {
                'success': True,
                'chave_nfe': chave_nfe,
                'numero_nfe': '000000001',
                'protocolo': '135240000000001',
                'data_emissao': datetime.now().isoformat(),
                'xml_autorizado': f'<nfeProc>...XML da NFe {chave_nfe}...</nfeProc>',
                'ambiente': self.ambiente
            }
            
            logger.info(f"NFe emitida: {chave_nfe}")
            return response_data
            
        except Exception as e:
            logger.error(f"Erro emissão NFe: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'code': 'EMISSION_ERROR'
            }
    
    def _gerar_chave_nfe(self, dados_nfe: Dict[str, Any]) -> str:
        """Gera chave de acesso NFe (simulada)"""
        # Em produção, seguir algoritmo oficial da Receita Federal
        import random
        
        # Componentes da chave (simplificado)
        uf = '51'  # MT
        aamm = datetime.now().strftime('%y%m')
        cnpj = dados_nfe['emitente']['cnpj']
        modelo = '55'  # NFe
        serie = '001'
        numero = '000000001'
        codigo = f"{random.randint(10000000, 99999999)}"
        
        # Montar chave sem DV
        chave_sem_dv = f"{uf}{aamm}{cnpj}{modelo}{serie}{numero}{codigo}"
        
        # Calcular DV (simplificado)
        weights = [2, 3, 4, 5, 6, 7, 8, 9] * 5 + [2, 3, 4, 5]
        sum_result = sum(int(digit) * weight for digit, weight in zip(chave_sem_dv, weights))
        remainder = sum_result % 11
        dv = 0 if remainder < 2 else 11 - remainder
        
        return f"{chave_sem_dv}{dv}"
    
    async def consultar_cadastro(self, cnpj: str = None, ie: str = None) -> Dict[str, Any]:
        """Consulta cadastro de contribuinte"""
        try:
            if cnpj and not self._validate_cnpj(cnpj):
                return {
                    'success': False,
                    'error': 'CNPJ inválido',
                    'code': 'INVALID_CNPJ'
                }
            
            # Simular consulta cadastro
            response_data = {
                'success': True,
                'cnpj': cnpj,
                'inscricao_estadual': ie or '123456789',
                'razao_social': 'EMPRESA AGRO LTDA',
                'situacao': 'ATIVA',
                'data_consulta': datetime.now().isoformat(),
                'ambiente': self.ambiente
            }
            
            logger.info(f"Cadastro consultado: {cnpj or ie}")
            return response_data
            
        except Exception as e:
            logger.error(f"Erro consulta cadastro: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'code': 'CADASTRO_ERROR'
            }

class SEFAZMTMCPServer:
    """Servidor MCP para SEFAZ-MT"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client = SEFAZMTClient(config)
        self.tools = [
            {
                'name': 'consultar_nfe',
                'description': 'Consulta situação de NFe no SEFAZ-MT',
                'inputSchema': {
                    'type': 'object',
                    'properties': {
                        'chave_nfe': {
                            'type': 'string',
                            'pattern': '^[0-9]{44}$',
                            'description': 'Chave de acesso da NFe (44 dígitos)'
                        }
                    },
                    'required': ['chave_nfe']
                }
            },
            {
                'name': 'emitir_nfe',
                'description': 'Emite NFe através do SEFAZ-MT',
                'inputSchema': {
                    'type': 'object',
                    'properties': {
                        'dados_nfe': {
                            'type': 'object',
                            'description': 'Dados completos da NFe'
                        }
                    },
                    'required': ['dados_nfe']
                }
            },
            {
                'name': 'consultar_cadastro',
                'description': 'Consulta cadastro de contribuinte',
                'inputSchema': {
                    'type': 'object',
                    'properties': {
                        'cnpj': {'type': 'string'},
                        'inscricao_estadual': {'type': 'string'}
                    }
                }
            }
        ]
    
    async def handle_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Processa chamada de ferramenta"""
        try:
            if tool_name == 'consultar_nfe':
                return await self.client.consultar_nfe(arguments['chave_nfe'])
            
            elif tool_name == 'emitir_nfe':
                return await self.client.emitir_nfe(arguments['dados_nfe'])
            
            elif tool_name == 'consultar_cadastro':
                return await self.client.consultar_cadastro(
                    arguments.get('cnpj'),
                    arguments.get('inscricao_estadual')
                )
            
            else:
                return {
                    'success': False,
                    'error': f'Ferramenta não encontrada: {tool_name}',
                    'code': 'TOOL_NOT_FOUND'
                }
                
        except Exception as e:
            logger.error(f"Erro processamento ferramenta {tool_name}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'code': 'TOOL_ERROR'
            }
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """Retorna lista de ferramentas disponíveis"""
        return self.tools

def main():
    """Função principal do servidor MCP"""
    import sys
    
    # Configuração padrão
    config = {
        'ambiente': 'homologacao',
        'timeout': 30,
        'certificado_path': None,  # Path para certificado A1/A3
        'senha_certificado': None
    }
    
    # Criar servidor MCP
    server = SEFAZMTMCPServer(config)
    
    print("🏛️ SEFAZ-MT MCP Server iniciado")
    print(f"Ambiente: {config['ambiente']}")
    print(f"Ferramentas disponíveis: {len(server.get_tools())}")
    
    # Em produção, implementar protocolo MCP completo
    # Este é um exemplo simplificado
    
    # Exemplo de uso
    async def exemplo_uso():
        # Consultar NFe
        resultado = await server.handle_tool_call('consultar_nfe', {
            'chave_nfe': '51240314200166000187550010000000015123456789'
        })
        print(f"Consulta NFe: {json.dumps(resultado, indent=2, ensure_ascii=False)}")
        
        # Consultar cadastro
        resultado = await server.handle_tool_call('consultar_cadastro', {
            'cnpj': '14200166000187'
        })
        print(f"Consulta Cadastro: {json.dumps(resultado, indent=2, ensure_ascii=False)}")
    
    # Executar exemplo
    if len(sys.argv) > 1 and sys.argv[1] == '--exemplo':
        asyncio.run(exemplo_uso())
    else:
        print("Use --exemplo para testar funcionalidades")
        print("Em produção, integrar com protocolo MCP oficial")

if __name__ == "__main__":
    main()

