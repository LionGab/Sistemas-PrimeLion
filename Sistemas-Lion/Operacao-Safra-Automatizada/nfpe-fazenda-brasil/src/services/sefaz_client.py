"""
Cliente SOAP para WebServices SEFAZ-MT
Comunicação com ambiente de homologação e produção
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from lxml import etree
import zeep
from zeep import wsse
from zeep.transports import Transport
import httpx
import logging

from ..core.config import get_settings
from ..models import NFPe
from .digital_signature import DigitalSignatureService

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class RetornoSEFAZ:
    """Classe para retorno dos WebServices SEFAZ"""
    codigo: str
    mensagem: str
    protocolo: Optional[str] = None
    xml_retorno: Optional[str] = None
    data_recebimento: Optional[datetime] = None
    sucesso: bool = False


class SEFAZClient:
    """Cliente para WebServices SEFAZ-MT"""
    
    def __init__(self):
        self.signature_service = DigitalSignatureService()
        self.timeout = settings.SEFAZ_TIMEOUT
        self.max_tentativas = settings.SEFAZ_TENTATIVAS
        
        # URLs dos WebServices baseadas no ambiente
        self.urls = self._get_webservice_urls()
        
        # Configuração do transport HTTP
        self.transport = Transport(
            timeout=self.timeout,
            operation_timeout=self.timeout
        )
    
    def _get_webservice_urls(self) -> Dict[str, str]:
        """Retorna URLs dos WebServices baseadas no ambiente"""
        return {
            "autorizacao": settings.sefaz_url_autorizacao,
            "retorno": settings.sefaz_url_retorno,
            "consulta": settings.sefaz_url_consulta,
            "status": settings.sefaz_url_status,
        }
    
    async def verificar_status_servico(self) -> RetornoSEFAZ:
        """
        Verifica status do serviço SEFAZ-MT
        
        Returns:
            Status do serviço
        """
        try:
            # Monta XML de consulta status
            xml_consulta = self._montar_xml_consulta_status()
            
            # Chama WebService
            client = zeep.Client(
                wsdl=self.urls["status"] + "?wsdl",
                transport=self.transport
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.service.nfeStatusServicoNF(nfeDadosMsg=xml_consulta)
            )
            
            # Processa resposta
            return self._processar_retorno_status(response)
            
        except Exception as e:
            logger.error(f"Erro ao verificar status SEFAZ: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro de comunicação: {str(e)}",
                sucesso=False
            )
    
    async def enviar_nfe(
        self, 
        nfpe: NFPe, 
        xml_nfe: str,
        certificado_path: str,
        certificado_senha: str
    ) -> RetornoSEFAZ:
        """
        Envia NFP-e para autorização no SEFAZ-MT
        
        Args:
            nfpe: Instância da NFP-e
            xml_nfe: XML da NFe assinado
            certificado_path: Caminho do certificado
            certificado_senha: Senha do certificado
            
        Returns:
            Retorno da transmissão
        """
        try:
            # Monta lote de NFe
            xml_lote = self._montar_lote_nfe(nfpe, xml_nfe)
            
            # Assina o lote
            xml_lote_assinado = self.signature_service.assinar_lote_nfe(
                xml_lote, certificado_path, certificado_senha
            )
            
            # Envia para SEFAZ
            for tentativa in range(1, self.max_tentativas + 1):
                try:
                    logger.info(f"Enviando NFP-e {nfpe.chave_acesso} - Tentativa {tentativa}")
                    
                    retorno = await self._enviar_lote_sefaz(xml_lote_assinado)
                    
                    if retorno.sucesso:
                        return retorno
                    
                    # Se não teve sucesso, tenta novamente após delay
                    if tentativa < self.max_tentativas:
                        await asyncio.sleep(tentativa * 2)  # Backoff exponencial
                        
                except Exception as e:
                    logger.error(f"Erro na tentativa {tentativa}: {str(e)}")
                    if tentativa == self.max_tentativas:
                        raise
            
            return RetornoSEFAZ(
                codigo="999",
                mensagem="Máximo de tentativas excedido",
                sucesso=False
            )
            
        except Exception as e:
            logger.error(f"Erro ao enviar NFP-e {nfpe.chave_acesso}: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro no envio: {str(e)}",
                sucesso=False
            )
    
    async def consultar_recibo(self, numero_recibo: str) -> RetornoSEFAZ:
        """
        Consulta recibo de processamento no SEFAZ-MT
        
        Args:
            numero_recibo: Número do recibo retornado no envio
            
        Returns:
            Resultado do processamento
        """
        try:
            # Monta XML de consulta recibo
            xml_consulta = self._montar_xml_consulta_recibo(numero_recibo)
            
            # Chama WebService
            client = zeep.Client(
                wsdl=self.urls["retorno"] + "?wsdl",
                transport=self.transport
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.service.nfeRetAutorizacao(nfeDadosMsg=xml_consulta)
            )
            
            return self._processar_retorno_consulta(response)
            
        except Exception as e:
            logger.error(f"Erro ao consultar recibo {numero_recibo}: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro na consulta: {str(e)}",
                sucesso=False
            )
    
    async def consultar_nfe(self, chave_acesso: str) -> RetornoSEFAZ:
        """
        Consulta situação de NFP-e específica
        
        Args:
            chave_acesso: Chave de acesso da NFe
            
        Returns:
            Situação da NFe
        """
        try:
            # Monta XML de consulta situação
            xml_consulta = self._montar_xml_consulta_situacao(chave_acesso)
            
            # Chama WebService
            client = zeep.Client(
                wsdl=self.urls["consulta"] + "?wsdl",
                transport=self.transport
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.service.nfeConsultaNF(nfeDadosMsg=xml_consulta)
            )
            
            return self._processar_retorno_consulta_nfe(response)
            
        except Exception as e:
            logger.error(f"Erro ao consultar NFe {chave_acesso}: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro na consulta: {str(e)}",
                sucesso=False
            )
    
    async def cancelar_nfe(
        self,
        chave_acesso: str,
        protocolo_autorizacao: str,
        justificativa: str,
        certificado_path: str,
        certificado_senha: str
    ) -> RetornoSEFAZ:
        """
        Cancela NFP-e autorizada
        
        Args:
            chave_acesso: Chave de acesso da NFe
            protocolo_autorizacao: Protocolo de autorização
            justificativa: Justificativa do cancelamento (min 15 chars)
            certificado_path: Caminho do certificado
            certificado_senha: Senha do certificado
            
        Returns:
            Resultado do cancelamento
        """
        try:
            if len(justificativa) < 15:
                raise ValueError("Justificativa deve ter no mínimo 15 caracteres")
            
            # Monta XML do evento de cancelamento
            xml_evento = self._montar_xml_cancelamento(
                chave_acesso, protocolo_autorizacao, justificativa
            )
            
            # Assina o evento
            xml_assinado = self.signature_service.assinar_xml(
                xml_evento, certificado_path, certificado_senha, "infEvento"
            )
            
            # Envia evento
            return await self._enviar_evento_sefaz(xml_assinado)
            
        except Exception as e:
            logger.error(f"Erro ao cancelar NFe {chave_acesso}: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro no cancelamento: {str(e)}",
                sucesso=False
            )
    
    def _montar_xml_consulta_status(self) -> str:
        """Monta XML para consulta status do serviço"""
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        consulta = etree.Element("consStatServ", nsmap=ns)
        consulta.set("versao", "4.00")
        
        etree.SubElement(consulta, "tpAmb").text = "2" if settings.is_homologacao else "1"
        etree.SubElement(consulta, "cUF").text = "51"  # Mato Grosso
        etree.SubElement(consulta, "xServ").text = "STATUS"
        
        return etree.tostring(consulta, encoding="unicode")
    
    def _montar_lote_nfe(self, nfpe: NFPe, xml_nfe: str) -> str:
        """Monta XML do lote de NFe para envio"""
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        lote = etree.Element("enviNFe", nsmap=ns)
        lote.set("versao", "4.00")
        
        # Identificação do lote
        id_lote = str(int(datetime.now().timestamp()))
        etree.SubElement(lote, "idLote").text = id_lote
        etree.SubElement(lote, "indSinc").text = "1"  # Síncrono
        
        # Adiciona NFe ao lote
        nfe_element = etree.fromstring(xml_nfe)
        lote.append(nfe_element)
        
        return etree.tostring(lote, encoding="unicode")
    
    def _montar_xml_consulta_recibo(self, numero_recibo: str) -> str:
        """Monta XML para consulta de recibo"""
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        consulta = etree.Element("consReciNFe", nsmap=ns)
        consulta.set("versao", "4.00")
        
        etree.SubElement(consulta, "tpAmb").text = "2" if settings.is_homologacao else "1"
        etree.SubElement(consulta, "nRec").text = numero_recibo
        
        return etree.tostring(consulta, encoding="unicode")
    
    def _montar_xml_consulta_situacao(self, chave_acesso: str) -> str:
        """Monta XML para consulta situação NFe"""
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        consulta = etree.Element("consSitNFe", nsmap=ns)
        consulta.set("versao", "4.00")
        
        etree.SubElement(consulta, "tpAmb").text = "2" if settings.is_homologacao else "1"
        etree.SubElement(consulta, "xServ").text = "CONSULTAR"
        etree.SubElement(consulta, "chNFe").text = chave_acesso
        
        return etree.tostring(consulta, encoding="unicode")
    
    def _montar_xml_cancelamento(
        self, 
        chave_acesso: str, 
        protocolo: str, 
        justificativa: str
    ) -> str:
        """Monta XML do evento de cancelamento"""
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        evento = etree.Element("evento", nsmap=ns)
        evento.set("versao", "1.00")
        
        inf_evento = etree.SubElement(evento, "infEvento")
        inf_evento.set("Id", f"ID110111{chave_acesso}01")
        
        etree.SubElement(inf_evento, "cOrgao").text = "51"  # MT
        etree.SubElement(inf_evento, "tpAmb").text = "2" if settings.is_homologacao else "1"
        etree.SubElement(inf_evento, "CNPJ").text = settings.FAZENDA_CNPJ.replace(".", "").replace("/", "").replace("-", "")
        etree.SubElement(inf_evento, "chNFe").text = chave_acesso
        etree.SubElement(inf_evento, "dhEvento").text = datetime.now().isoformat()
        etree.SubElement(inf_evento, "tpEvento").text = "110111"  # Cancelamento
        etree.SubElement(inf_evento, "nSeqEvento").text = "1"
        etree.SubElement(inf_evento, "verEvento").text = "1.00"
        
        # Detalhes do evento
        det_evento = etree.SubElement(inf_evento, "detEvento")
        det_evento.set("versao", "1.00")
        
        etree.SubElement(det_evento, "descEvento").text = "Cancelamento"
        etree.SubElement(det_evento, "nProt").text = protocolo
        etree.SubElement(det_evento, "xJust").text = justificativa
        
        return etree.tostring(evento, encoding="unicode")
    
    async def _enviar_lote_sefaz(self, xml_lote: str) -> RetornoSEFAZ:
        """Envia lote para SEFAZ"""
        try:
            client = zeep.Client(
                wsdl=self.urls["autorizacao"] + "?wsdl",
                transport=self.transport
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.service.nfeAutorizacaoLote(nfeDadosMsg=xml_lote)
            )
            
            return self._processar_retorno_envio(response)
            
        except Exception as e:
            logger.error(f"Erro ao enviar lote SEFAZ: {str(e)}")
            raise
    
    async def _enviar_evento_sefaz(self, xml_evento: str) -> RetornoSEFAZ:
        """Envia evento para SEFAZ"""
        try:
            # URL específica para eventos
            url_evento = self.urls["autorizacao"].replace("NfeAutorizacao4", "RecepcaoEvento4")
            
            client = zeep.Client(
                wsdl=url_evento + "?wsdl",
                transport=self.transport
            )
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.service.nfeRecepcaoEvento(nfeDadosMsg=xml_evento)
            )
            
            return self._processar_retorno_evento(response)
            
        except Exception as e:
            logger.error(f"Erro ao enviar evento SEFAZ: {str(e)}")
            raise
    
    def _processar_retorno_status(self, response) -> RetornoSEFAZ:
        """Processa retorno da consulta de status"""
        try:
            # Parse da resposta XML
            xml_ret = etree.fromstring(response.encode('utf-8') if isinstance(response, str) else response)
            
            codigo = xml_ret.find(".//cStat").text if xml_ret.find(".//cStat") is not None else "999"
            mensagem = xml_ret.find(".//xMotivo").text if xml_ret.find(".//xMotivo") is not None else "Erro desconhecido"
            
            sucesso = codigo == "107"  # Serviço em operação
            
            return RetornoSEFAZ(
                codigo=codigo,
                mensagem=mensagem,
                xml_retorno=response,
                sucesso=sucesso
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar retorno status: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro ao processar resposta: {str(e)}",
                sucesso=False
            )
    
    def _processar_retorno_envio(self, response) -> RetornoSEFAZ:
        """Processa retorno do envio de lote"""
        try:
            xml_ret = etree.fromstring(response.encode('utf-8') if isinstance(response, str) else response)
            
            codigo = xml_ret.find(".//cStat").text if xml_ret.find(".//cStat") is not None else "999"
            mensagem = xml_ret.find(".//xMotivo").text if xml_ret.find(".//xMotivo") is not None else "Erro desconhecido"
            protocolo = xml_ret.find(".//nRec").text if xml_ret.find(".//nRec") is not None else None
            
            # Código 103 = Lote recebido com sucesso
            sucesso = codigo == "103"
            
            return RetornoSEFAZ(
                codigo=codigo,
                mensagem=mensagem,
                protocolo=protocolo,
                xml_retorno=response,
                sucesso=sucesso
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar retorno envio: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro ao processar resposta: {str(e)}",
                sucesso=False
            )
    
    def _processar_retorno_consulta(self, response) -> RetornoSEFAZ:
        """Processa retorno da consulta de recibo"""
        try:
            xml_ret = etree.fromstring(response.encode('utf-8') if isinstance(response, str) else response)
            
            # Busca protocolo de autorização
            prot_nfe = xml_ret.find(".//protNFe")
            if prot_nfe is not None:
                codigo = prot_nfe.find(".//cStat").text
                mensagem = prot_nfe.find(".//xMotivo").text
                protocolo = prot_nfe.find(".//nProt").text
                
                # Código 100 = Autorizada
                sucesso = codigo == "100"
                
                return RetornoSEFAZ(
                    codigo=codigo,
                    mensagem=mensagem,
                    protocolo=protocolo,
                    xml_retorno=response,
                    data_recebimento=datetime.now(),
                    sucesso=sucesso
                )
            
            # Se não encontrou protocolo, busca erro geral
            codigo = xml_ret.find(".//cStat").text if xml_ret.find(".//cStat") is not None else "999"
            mensagem = xml_ret.find(".//xMotivo").text if xml_ret.find(".//xMotivo") is not None else "Erro desconhecido"
            
            return RetornoSEFAZ(
                codigo=codigo,
                mensagem=mensagem,
                xml_retorno=response,
                sucesso=False
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar retorno consulta: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro ao processar resposta: {str(e)}",
                sucesso=False
            )
    
    def _processar_retorno_consulta_nfe(self, response) -> RetornoSEFAZ:
        """Processa retorno da consulta situação NFe"""
        return self._processar_retorno_consulta(response)
    
    def _processar_retorno_evento(self, response) -> RetornoSEFAZ:
        """Processa retorno de evento (cancelamento, etc)"""
        try:
            xml_ret = etree.fromstring(response.encode('utf-8') if isinstance(response, str) else response)
            
            codigo = xml_ret.find(".//cStat").text if xml_ret.find(".//cStat") is not None else "999"
            mensagem = xml_ret.find(".//xMotivo").text if xml_ret.find(".//xMotivo") is not None else "Erro desconhecido"
            protocolo = xml_ret.find(".//nProt").text if xml_ret.find(".//nProt") is not None else None
            
            # Código 135 = Evento registrado e vinculado a NFe
            sucesso = codigo == "135"
            
            return RetornoSEFAZ(
                codigo=codigo,
                mensagem=mensagem,
                protocolo=protocolo,
                xml_retorno=response,
                sucesso=sucesso
            )
            
        except Exception as e:
            logger.error(f"Erro ao processar retorno evento: {str(e)}")
            return RetornoSEFAZ(
                codigo="999",
                mensagem=f"Erro ao processar resposta: {str(e)}",
                sucesso=False
            )


# Instância global do cliente
sefaz_client = SEFAZClient()