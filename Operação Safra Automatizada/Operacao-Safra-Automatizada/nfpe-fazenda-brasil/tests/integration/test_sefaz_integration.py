"""
Testes de integração com SEFAZ-MT
Validação em ambiente de homologação
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import patch

from src.services.sefaz_client import SEFAZClient
from src.core.config import get_settings


class TestSEFAZIntegration:
    """Testes de integração com SEFAZ-MT"""
    
    def setup_method(self):
        """Setup para cada teste"""
        self.client = SEFAZClient()
        self.settings = get_settings()
        
        # Certifica que está em ambiente de homologação
        assert self.settings.SEFAZ_ENVIRONMENT == "homologacao", \
            "Testes devem rodar apenas em homologação"
    
    @pytest.mark.asyncio
    async def test_verificar_status_servico(self):
        """Testa consulta de status do serviço SEFAZ"""
        retorno = await self.client.verificar_status_servico()
        
        # Validações básicas
        assert retorno is not None
        assert hasattr(retorno, 'codigo')
        assert hasattr(retorno, 'mensagem')
        assert hasattr(retorno, 'sucesso')
        
        # Em homologação, código 107 indica serviço em operação
        if retorno.sucesso:
            assert retorno.codigo == "107"
            assert "operacao" in retorno.mensagem.lower()
        
        print(f"Status SEFAZ: {retorno.codigo} - {retorno.mensagem}")
    
    def test_montar_xml_consulta_status(self):
        """Testa montagem do XML de consulta status"""
        xml = self.client._montar_xml_consulta_status()
        
        # Validações do XML
        assert xml is not None
        assert "consStatServ" in xml
        assert "versao=\"4.00\"" in xml
        assert "<tpAmb>2</tpAmb>" in xml  # Homologação
        assert "<cUF>51</cUF>" in xml    # Mato Grosso
        assert "<xServ>STATUS</xServ>" in xml
    
    def test_montar_xml_consulta_recibo(self):
        """Testa montagem do XML de consulta recibo"""
        numero_recibo = "123456789012345"
        xml = self.client._montar_xml_consulta_recibo(numero_recibo)
        
        # Validações
        assert xml is not None
        assert "consReciNFe" in xml
        assert "versao=\"4.00\"" in xml
        assert f"<nRec>{numero_recibo}</nRec>" in xml
        assert "<tpAmb>2</tpAmb>" in xml
    
    def test_montar_xml_consulta_situacao(self):
        """Testa montagem do XML de consulta situação NFe"""
        chave_teste = "51240912345678000190550010000000118000000019"
        xml = self.client._montar_xml_consulta_situacao(chave_teste)
        
        # Validações
        assert xml is not None
        assert "consSitNFe" in xml
        assert "versao=\"4.00\"" in xml
        assert f"<chNFe>{chave_teste}</chNFe>" in xml
        assert "<tpAmb>2</tpAmb>" in xml
        assert "<xServ>CONSULTAR</xServ>" in xml
    
    def test_gerar_chave_acesso_cancelamento(self):
        """Testa geração de ID para cancelamento"""
        chave_nfe = "51240912345678000190550010000000118000000019"
        protocolo = "151240000000123"
        justificativa = "Cancelamento por erro na digitacao dos dados do destinatario"
        
        xml = self.client._montar_xml_cancelamento(
            chave_nfe, protocolo, justificativa
        )
        
        # Validações
        assert xml is not None
        assert "evento" in xml
        assert "versao=\"1.00\"" in xml
        assert f"Id=\"ID110111{chave_nfe}01\"" in xml
        assert "<cOrgao>51</cOrgao>" in xml  # MT
        assert f"<chNFe>{chave_nfe}</chNFe>" in xml
        assert "<tpEvento>110111</tpEvento>" in xml  # Cancelamento
        assert "<nSeqEvento>1</nSeqEvento>" in xml
        assert f"<nProt>{protocolo}</nProt>" in xml
        assert f"<xJust>{justificativa}</xJust>" in xml
    
    def test_processar_retorno_status_sucesso(self):
        """Testa processamento de retorno de status com sucesso"""
        xml_retorno = """<?xml version="1.0" encoding="UTF-8"?>
        <consStatServResp xmlns="http://www.portalfiscal.inf.br/nfe">
            <versao>4.00</versao>
            <tpAmb>2</tpAmb>
            <verAplic>SVRS202401011000</verAplic>
            <cStat>107</cStat>
            <xMotivo>Servico em Operacao</xMotivo>
            <cUF>51</cUF>
            <dhRecbto>2024-09-01T12:00:00-03:00</dhRecbto>
            <tMed>1</tMed>
        </consStatServResp>"""
        
        retorno = self.client._processar_retorno_status(xml_retorno)
        
        assert retorno.sucesso is True
        assert retorno.codigo == "107"
        assert "operacao" in retorno.mensagem.lower()
    
    def test_processar_retorno_status_erro(self):
        """Testa processamento de retorno de status com erro"""
        xml_retorno = """<?xml version="1.0" encoding="UTF-8"?>
        <consStatServResp xmlns="http://www.portalfiscal.inf.br/nfe">
            <versao>4.00</versao>
            <tpAmb>2</tpAmb>
            <verAplic>SVRS202401011000</verAplic>
            <cStat>108</cStat>
            <xMotivo>Servico Paralisado Momentaneamente</xMotivo>
            <cUF>51</cUF>
        </consStatServResp>"""
        
        retorno = self.client._processar_retorno_status(xml_retorno)
        
        assert retorno.sucesso is False
        assert retorno.codigo == "108"
        assert "paralisado" in retorno.mensagem.lower()
    
    def test_processar_retorno_envio_sucesso(self):
        """Testa processamento de retorno de envio com sucesso"""
        xml_retorno = """<?xml version="1.0" encoding="UTF-8"?>
        <retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <versao>4.00</versao>
            <tpAmb>2</tpAmb>
            <verAplic>SVRS202401011000</verAplic>
            <cStat>103</cStat>
            <xMotivo>Lote recebido com sucesso</xMotivo>
            <cUF>51</cUF>
            <dhRecbto>2024-09-01T12:00:00-03:00</dhRecbto>
            <infRec>
                <nRec>123456789012345</nRec>
                <tMed>1</tMed>
            </infRec>
        </retEnviNFe>"""
        
        retorno = self.client._processar_retorno_envio(xml_retorno)
        
        assert retorno.sucesso is True
        assert retorno.codigo == "103"
        assert retorno.protocolo == "123456789012345"
        assert "recebido com sucesso" in retorno.mensagem.lower()
    
    def test_processar_retorno_consulta_autorizada(self):
        """Testa processamento de consulta com NFe autorizada"""
        xml_retorno = """<?xml version="1.0" encoding="UTF-8"?>
        <retConsReciNFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <versao>4.00</versao>
            <tpAmb>2</tpAmb>
            <verAplic>SVRS202401011000</verAplic>
            <nRec>123456789012345</nRec>
            <cStat>104</cStat>
            <xMotivo>Lote processado</xMotivo>
            <protNFe versao="4.00">
                <infProt>
                    <tpAmb>2</tpAmb>
                    <verAplic>SVRS202401011000</verAplic>
                    <chNFe>51240912345678000190550010000000118000000019</chNFe>
                    <dhRecbto>2024-09-01T12:00:00-03:00</dhRecbto>
                    <nProt>151240000000123</nProt>
                    <digVal>Assinatura</digVal>
                    <cStat>100</cStat>
                    <xMotivo>Autorizado o uso da NF-e</xMotivo>
                </infProt>
            </protNFe>
        </retConsReciNFe>"""
        
        retorno = self.client._processar_retorno_consulta(xml_retorno)
        
        assert retorno.sucesso is True
        assert retorno.codigo == "100"
        assert retorno.protocolo == "151240000000123"
        assert "autorizado" in retorno.mensagem.lower()
    
    def test_processar_retorno_consulta_rejeitada(self):
        """Testa processamento de consulta com NFe rejeitada"""
        xml_retorno = """<?xml version="1.0" encoding="UTF-8"?>
        <retConsReciNFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <versao>4.00</versao>
            <tpAmb>2</tpAmb>
            <verAplic>SVRS202401011000</verAplic>
            <nRec>123456789012345</nRec>
            <cStat>104</cStat>
            <xMotivo>Lote processado</xMotivo>
            <protNFe versao="4.00">
                <infProt>
                    <tpAmb>2</tpAmb>
                    <verAplic>SVRS202401011000</verAplic>
                    <chNFe>51240912345678000190550010000000118000000019</chNFe>
                    <dhRecbto>2024-09-01T12:00:00-03:00</dhRecbto>
                    <cStat>204</cStat>
                    <xMotivo>Rejeicao: Destinatario nao habilitado a operar na UF</xMotivo>
                </infProt>
            </protNFe>
        </retConsReciNFe>"""
        
        retorno = self.client._processar_retorno_consulta(xml_retorno)
        
        assert retorno.sucesso is False
        assert retorno.codigo == "204"
        assert "rejeicao" in retorno.mensagem.lower()
    
    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_fluxo_completo_consulta_nfe_inexistente(self):
        """Teste E2E: consulta NFe que não existe"""
        # Chave de teste (formato válido mas NFe inexistente)
        chave_teste = "51240912345678000190550010000000118000000019"
        
        retorno = await self.client.consultar_nfe(chave_teste)
        
        # NFe inexistente deve retornar erro específico
        assert retorno is not None
        assert not retorno.sucesso
        # Códigos possíveis: 217 (NFe não consta na base) ou similar
        assert retorno.codigo in ["217", "101", "999"]
        
        print(f"Consulta NFe inexistente: {retorno.codigo} - {retorno.mensagem}")
    
    @pytest.mark.skip(reason="Requer certificado digital válido para teste completo")
    @pytest.mark.asyncio
    async def test_envio_nfe_teste_completo(self):
        """Teste completo de envio de NFe (SKIP - requer certificado)"""
        # Este teste seria executado apenas com certificado digital válido
        # e dados de teste completos
        pass
    
    def test_validacao_urls_ambiente(self):
        """Testa se URLs estão configuradas para homologação"""
        urls = self.client.urls
        
        # Todas as URLs devem apontar para homologação
        for nome, url in urls.items():
            assert "homologacao" in url, f"URL {nome} deve ser de homologação"
            assert "sefaz.mt.gov.br" in url, f"URL {nome} deve ser do SEFAZ-MT"
    
    def test_timeout_configurado(self):
        """Testa se timeout está configurado adequadamente"""
        assert self.client.timeout > 0
        assert self.client.timeout <= 300  # Máximo 5 minutos
        assert self.client.max_tentativas >= 1
        assert self.client.max_tentativas <= 5


@pytest.mark.asyncio
class TestSEFAZErrorHandling:
    """Testes de tratamento de erros"""
    
    def setup_method(self):
        self.client = SEFAZClient()
    
    async def test_erro_timeout(self):
        """Testa tratamento de timeout"""
        # Configura timeout muito baixo para forçar erro
        self.client.timeout = 0.001
        
        retorno = await self.client.verificar_status_servico()
        
        assert not retorno.sucesso
        assert "timeout" in retorno.mensagem.lower() or "erro" in retorno.mensagem.lower()
    
    def test_xml_malformado(self):
        """Testa tratamento de XML malformado"""
        xml_invalido = "<xml><invalid>sem fechamento"
        
        retorno = self.client._processar_retorno_status(xml_invalido)
        
        assert not retorno.sucesso
        assert retorno.codigo == "999"
        assert "erro" in retorno.mensagem.lower()


if __name__ == "__main__":
    # Executa apenas testes básicos por padrão
    pytest.main([__file__, "-v", "-m", "not integration"])