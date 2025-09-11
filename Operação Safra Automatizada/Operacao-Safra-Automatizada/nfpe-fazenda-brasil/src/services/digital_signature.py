"""
Serviço de assinatura digital para NFP-e
Suporte para certificados A1 e A3
"""
import base64
import hashlib
from datetime import datetime
from typing import Optional, Union
from lxml import etree
from signxml import XMLSigner, XMLVerifier
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography import x509
import logging

from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DigitalSignatureService:
    """Serviço de assinatura digital XML para NFP-e"""
    
    def __init__(self):
        self.canonicalization_method = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
        self.signature_method = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
        self.digest_method = "http://www.w3.org/2001/04/xmlenc#sha256"
    
    def assinar_xml(
        self, 
        xml_content: str, 
        certificado_path: str, 
        certificado_senha: str,
        elemento_assinar: str = "infNFe"
    ) -> str:
        """
        Assina XML digitalmente usando certificado A1 ou A3
        
        Args:
            xml_content: Conteúdo XML a ser assinado
            certificado_path: Caminho para arquivo .pfx/.p12
            certificado_senha: Senha do certificado
            elemento_assinar: Elemento a ser assinado (padrão: infNFe)
            
        Returns:
            XML assinado digitalmente
        """
        try:
            # Carrega certificado
            private_key, certificate = self._carregar_certificado(
                certificado_path, certificado_senha
            )
            
            # Parse do XML
            xml_doc = etree.fromstring(xml_content.encode('utf-8'))
            
            # Encontra elemento a ser assinado
            namespace = {"": "http://www.portalfiscal.inf.br/nfe"}
            elemento = xml_doc.find(f".//{elemento_assinar}", namespace)
            
            if elemento is None:
                raise ValueError(f"Elemento {elemento_assinar} não encontrado no XML")
            
            # Cria assinatura
            signer = XMLSigner(
                method=XMLSigner.SignatureMethod.RSA_SHA256,
                digest_algorithm="sha256"
            )
            
            # Assina o elemento específico
            xml_assinado = signer.sign(
                xml_doc,
                key=private_key,
                cert=certificate,
                reference_uri=f"#{elemento.get('Id')}"
            )
            
            # Converte de volta para string
            xml_string = etree.tostring(
                xml_assinado,
                encoding="unicode",
                pretty_print=True
            )
            
            logger.info(f"XML assinado com sucesso usando certificado: {certificate.subject}")
            return xml_string
            
        except Exception as e:
            logger.error(f"Erro ao assinar XML: {str(e)}")
            raise
    
    def _carregar_certificado(self, certificado_path: str, senha: str):
        """Carrega certificado digital do arquivo .pfx/.p12"""
        try:
            with open(certificado_path, 'rb') as cert_file:
                cert_data = cert_file.read()
            
            # Carrega certificado PKCS#12
            private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
                cert_data, senha.encode('utf-8')
            )
            
            # Verifica validade do certificado
            now = datetime.utcnow()
            if certificate.not_valid_after < now:
                raise ValueError("Certificado digital expirado")
            
            if certificate.not_valid_before > now:
                raise ValueError("Certificado digital ainda não é válido")
            
            logger.info(f"Certificado carregado: {certificate.subject}")
            logger.info(f"Válido até: {certificate.not_valid_after}")
            
            return private_key, certificate
            
        except FileNotFoundError:
            logger.error(f"Arquivo de certificado não encontrado: {certificado_path}")
            raise
        except Exception as e:
            logger.error(f"Erro ao carregar certificado: {str(e)}")
            raise
    
    def verificar_assinatura(self, xml_assinado: str) -> bool:
        """
        Verifica se a assinatura digital do XML é válida
        
        Args:
            xml_assinado: XML com assinatura digital
            
        Returns:
            True se assinatura é válida, False caso contrário
        """
        try:
            xml_doc = etree.fromstring(xml_assinado.encode('utf-8'))
            
            verifier = XMLVerifier()
            
            # Verifica assinatura
            verified_data = verifier.verify(xml_doc)
            
            logger.info("Assinatura XML verificada com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao verificar assinatura: {str(e)}")
            return False
    
    def extrair_certificado_info(self, certificado_path: str, senha: str) -> dict:
        """
        Extrai informações do certificado digital
        
        Args:
            certificado_path: Caminho para arquivo .pfx/.p12
            senha: Senha do certificado
            
        Returns:
            Dicionário com informações do certificado
        """
        try:
            private_key, certificate = self._carregar_certificado(certificado_path, senha)
            
            # Extrai informações do subject
            subject_dict = {}
            for attribute in certificate.subject:
                subject_dict[attribute.oid._name] = attribute.value
            
            # Extrai informações do issuer
            issuer_dict = {}
            for attribute in certificate.issuer:
                issuer_dict[attribute.oid._name] = attribute.value
            
            return {
                "subject": subject_dict,
                "issuer": issuer_dict,
                "serial_number": str(certificate.serial_number),
                "not_valid_before": certificate.not_valid_before,
                "not_valid_after": certificate.not_valid_after,
                "is_valid": datetime.utcnow() < certificate.not_valid_after,
                "public_key_size": certificate.public_key().key_size,
                "signature_algorithm": certificate.signature_algorithm_oid._name,
                "version": certificate.version.name
            }
            
        except Exception as e:
            logger.error(f"Erro ao extrair informações do certificado: {str(e)}")
            raise
    
    def gerar_hash_xml(self, xml_content: str, algoritmo: str = "sha256") -> str:
        """
        Gera hash do XML para verificação de integridade
        
        Args:
            xml_content: Conteúdo XML
            algoritmo: Algoritmo de hash (sha256, sha1, md5)
            
        Returns:
            Hash em base64
        """
        try:
            # Remove espaços em branco e quebras de linha
            xml_normalizado = ''.join(xml_content.split())
            
            # Calcula hash
            if algoritmo == "sha256":
                hash_obj = hashlib.sha256(xml_normalizado.encode('utf-8'))
            elif algoritmo == "sha1":
                hash_obj = hashlib.sha1(xml_normalizado.encode('utf-8'))
            elif algoritmo == "md5":
                hash_obj = hashlib.md5(xml_normalizado.encode('utf-8'))
            else:
                raise ValueError(f"Algoritmo de hash não suportado: {algoritmo}")
            
            # Converte para base64
            hash_b64 = base64.b64encode(hash_obj.digest()).decode('utf-8')
            
            return hash_b64
            
        except Exception as e:
            logger.error(f"Erro ao gerar hash XML: {str(e)}")
            raise
    
    def assinar_lote_nfe(
        self, 
        xml_lote: str, 
        certificado_path: str, 
        certificado_senha: str
    ) -> str:
        """
        Assina lote de NFP-e para envio ao SEFAZ
        
        Args:
            xml_lote: XML do lote de NFP-e
            certificado_path: Caminho do certificado
            certificado_senha: Senha do certificado
            
        Returns:
            XML do lote assinado
        """
        try:
            # Carrega certificado
            private_key, certificate = self._carregar_certificado(
                certificado_path, certificado_senha
            )
            
            # Parse do XML
            xml_doc = etree.fromstring(xml_lote.encode('utf-8'))
            
            # Cria assinatura para o lote
            signer = XMLSigner(
                method=XMLSigner.SignatureMethod.RSA_SHA256,
                digest_algorithm="sha256"
            )
            
            # Assina o lote
            xml_assinado = signer.sign(
                xml_doc,
                key=private_key,
                cert=certificate
            )
            
            # Converte para string
            xml_string = etree.tostring(
                xml_assinado,
                encoding="unicode",
                pretty_print=True
            )
            
            logger.info("Lote de NFP-e assinado com sucesso")
            return xml_string
            
        except Exception as e:
            logger.error(f"Erro ao assinar lote de NFP-e: {str(e)}")
            raise
    
    def validar_certificado(self, certificado_path: str, senha: str) -> dict:
        """
        Valida certificado digital e retorna status
        
        Args:
            certificado_path: Caminho do certificado
            senha: Senha do certificado
            
        Returns:
            Status de validação
        """
        try:
            info = self.extrair_certificado_info(certificado_path, senha)
            
            status = {
                "valido": True,
                "mensagens": [],
                "warnings": [],
                "erro": None
            }
            
            # Verifica se está expirado
            if not info["is_valid"]:
                status["valido"] = False
                status["mensagens"].append("Certificado expirado")
            
            # Verifica se expira em menos de 30 dias
            dias_para_expirar = (info["not_valid_after"] - datetime.utcnow()).days
            if dias_para_expirar <= 30:
                status["warnings"].append(f"Certificado expira em {dias_para_expirar} dias")
            
            # Verifica tamanho da chave
            if info["public_key_size"] < 2048:
                status["warnings"].append("Chave pública menor que 2048 bits")
            
            # Verifica algoritmo de assinatura
            if "sha1" in info["signature_algorithm"].lower():
                status["warnings"].append("Algoritmo SHA-1 é considerado fraco")
            
            return status
            
        except Exception as e:
            return {
                "valido": False,
                "mensagens": [],
                "warnings": [],
                "erro": str(e)
            }


# Instância global do serviço
signature_service = DigitalSignatureService()