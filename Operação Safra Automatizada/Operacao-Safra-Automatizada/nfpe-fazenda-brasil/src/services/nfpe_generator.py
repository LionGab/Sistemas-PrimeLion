"""
Gerador de XML NFP-e (Nota Fiscal do Produtor Eletrônica)
Conformidade com layout SEFAZ-MT versão 4.00
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from decimal import Decimal
from lxml import etree
import logging

from ..core.config import get_settings
from ..models import NFPe, Fazenda
from .digital_signature import DigitalSignatureService

logger = logging.getLogger(__name__)
settings = get_settings()


class NFPeXMLGenerator:
    """Gerador de XML da NFP-e conforme layout SEFAZ-MT"""
    
    def __init__(self):
        self.signature_service = DigitalSignatureService()
    
    def gerar_xml_nfe(self, nfpe: NFPe, fazenda: Fazenda) -> str:
        """
        Gera XML completo da NFP-e
        
        Args:
            nfpe: Instância da NFP-e
            fazenda: Dados da fazenda emitente
            
        Returns:
            XML da NFe assinado digitalmente
        """
        try:
            # Gera chave de acesso se não existir
            if not nfpe.chave_acesso:
                nfpe.chave_acesso = self._gerar_chave_acesso(nfpe, fazenda)
            
            # Monta XML da NFe
            xml_nfe = self._montar_xml_nfe(nfpe, fazenda)
            
            # Assina digitalmente
            xml_assinado = self.signature_service.assinar_xml(
                xml_nfe, 
                fazenda.certificado_path,
                fazenda.certificado_senha_hash
            )
            
            logger.info(f"XML NFP-e gerado e assinado: {nfpe.chave_acesso}")
            return xml_assinado
            
        except Exception as e:
            logger.error(f"Erro ao gerar XML NFP-e {nfpe.id}: {str(e)}")
            raise
    
    def _gerar_chave_acesso(self, nfpe: NFPe, fazenda: Fazenda) -> str:
        """
        Gera chave de acesso da NFe (44 dígitos)
        Formato: UF + AAMM + CNPJ + Modelo + Serie + Numero + Tipo Emissao + Codigo Numerico + DV
        """
        # UF (2 dígitos)
        cod_uf = "51"  # Mato Grosso
        
        # Ano e Mês (4 dígitos)
        aamm = nfpe.data_emissao.strftime("%y%m")
        
        # CNPJ (14 dígitos)
        cnpj = fazenda.cnpj.zfill(14)
        
        # Modelo (2 dígitos)
        modelo = "55"  # NFe
        
        # Série (3 dígitos)
        serie = str(nfpe.serie).zfill(3)
        
        # Número (9 dígitos)
        numero = str(nfpe.numero_nfe).zfill(9)
        
        # Tipo de Emissão (1 dígito)
        tipo_emissao = str(nfpe.tipo_emissao)
        
        # Código Numérico (8 dígitos) - gerado aleatoriamente
        codigo_numerico = str(abs(hash(f"{cnpj}{numero}{serie}")) % 100000000).zfill(8)
        
        # Monta chave sem DV
        chave_sem_dv = f"{cod_uf}{aamm}{cnpj}{modelo}{serie}{numero}{tipo_emissao}{codigo_numerico}"
        
        # Calcula dígito verificador
        dv = self._calcular_dv_chave_acesso(chave_sem_dv)
        
        return f"{chave_sem_dv}{dv}"
    
    def _calcular_dv_chave_acesso(self, chave: str) -> str:
        """Calcula dígito verificador da chave de acesso usando módulo 11"""
        sequencia = "4329876543298765432987654329876543298765432"
        soma = sum(int(chave[i]) * int(sequencia[i]) for i in range(43))
        resto = soma % 11
        
        if resto in (0, 1):
            return "0"
        else:
            return str(11 - resto)
    
    def _montar_xml_nfe(self, nfpe: NFPe, fazenda: Fazenda) -> str:
        """Monta estrutura XML da NFe"""
        
        # Namespace NFe 4.00
        ns = {"": "http://www.portalfiscal.inf.br/nfe"}
        
        # Elemento raiz
        nfe = etree.Element("NFe", nsmap=ns)
        
        # infNFe
        inf_nfe = etree.SubElement(nfe, "infNFe")
        inf_nfe.set("Id", f"NFe{nfpe.chave_acesso}")
        inf_nfe.set("versao", "4.00")
        
        # ide (Identificação)
        self._adicionar_identificacao(inf_nfe, nfpe, fazenda)
        
        # emit (Emitente)
        self._adicionar_emitente(inf_nfe, fazenda)
        
        # dest (Destinatário)
        self._adicionar_destinatario(inf_nfe, nfpe)
        
        # det (Detalhamento dos produtos/serviços)
        for item in nfpe.itens:
            self._adicionar_item(inf_nfe, item)
        
        # total (Totais da NFe)
        self._adicionar_totais(inf_nfe, nfpe)
        
        # transp (Transporte)
        self._adicionar_transporte(inf_nfe, nfpe)
        
        # infAdic (Informações adicionais)
        if nfpe.informacoes_complementares or nfpe.informacoes_fisco:
            self._adicionar_informacoes_adicionais(inf_nfe, nfpe)
        
        # Converte para string XML
        xml_string = etree.tostring(
            nfe, 
            encoding="unicode", 
            pretty_print=True,
            xml_declaration=True
        )
        
        return xml_string
    
    def _adicionar_identificacao(self, inf_nfe: etree.Element, nfpe: NFPe, fazenda: Fazenda):
        """Adiciona seção ide (Identificação) ao XML"""
        ide = etree.SubElement(inf_nfe, "ide")
        
        etree.SubElement(ide, "cUF").text = "51"  # Mato Grosso
        etree.SubElement(ide, "cNF").text = nfpe.chave_acesso[35:43]  # Código numérico
        etree.SubElement(ide, "natOp").text = nfpe.natureza_operacao
        etree.SubElement(ide, "mod").text = nfpe.modelo
        etree.SubElement(ide, "serie").text = str(nfpe.serie)
        etree.SubElement(ide, "nNF").text = str(nfpe.numero_nfe)
        etree.SubElement(ide, "dhEmi").text = nfpe.data_emissao.isoformat()
        
        if nfpe.data_saida:
            etree.SubElement(ide, "dhSaiEnt").text = nfpe.data_saida.isoformat()
        
        etree.SubElement(ide, "tpNF").text = str(nfpe.tipo_operacao)
        etree.SubElement(ide, "idDest").text = "1"  # Operação interna (MT)
        etree.SubElement(ide, "cMunFG").text = fazenda.codigo_municipio
        etree.SubElement(ide, "tpImp").text = "1"  # DANFE em retrato
        etree.SubElement(ide, "tpEmis").text = str(nfpe.tipo_emissao)
        etree.SubElement(ide, "cDV").text = nfpe.chave_acesso[-1]  # Dígito verificador
        etree.SubElement(ide, "tpAmb").text = "2" if settings.SEFAZ_ENVIRONMENT == "homologacao" else "1"
        etree.SubElement(ide, "finNFe").text = str(nfpe.finalidade)
        etree.SubElement(ide, "indFinal").text = "1"  # Consumidor final
        etree.SubElement(ide, "indPres").text = str(nfpe.indicador_presenca)
        etree.SubElement(ide, "procEmi").text = "0"  # Emissão própria
        etree.SubElement(ide, "verProc").text = "NFPe_Fazenda_Brasil_v1.0"
    
    def _adicionar_emitente(self, inf_nfe: etree.Element, fazenda: Fazenda):
        """Adiciona seção emit (Emitente) ao XML"""
        emit = etree.SubElement(inf_nfe, "emit")
        
        etree.SubElement(emit, "CNPJ").text = fazenda.cnpj
        etree.SubElement(emit, "xNome").text = fazenda.razao_social
        
        if fazenda.nome_fantasia:
            etree.SubElement(emit, "xFant").text = fazenda.nome_fantasia
        
        # Endereço
        endereco = etree.SubElement(emit, "enderEmit")
        etree.SubElement(endereco, "xLgr").text = fazenda.logradouro
        etree.SubElement(endereco, "nro").text = fazenda.numero
        
        if fazenda.complemento:
            etree.SubElement(endereco, "xCpl").text = fazenda.complemento
        
        etree.SubElement(endereco, "xBairro").text = fazenda.bairro
        etree.SubElement(endereco, "cMun").text = fazenda.codigo_municipio
        etree.SubElement(endereco, "xMun").text = fazenda.municipio
        etree.SubElement(endereco, "UF").text = fazenda.uf
        etree.SubElement(endereco, "CEP").text = fazenda.cep
        etree.SubElement(endereco, "cPais").text = fazenda.codigo_pais
        etree.SubElement(endereco, "xPais").text = fazenda.pais
        
        if fazenda.telefone:
            etree.SubElement(endereco, "fone").text = fazenda.telefone
        
        etree.SubElement(emit, "IE").text = fazenda.inscricao_estadual
        
        if fazenda.inscricao_municipal:
            etree.SubElement(emit, "IM").text = fazenda.inscricao_municipal
        
        etree.SubElement(emit, "CRT").text = str(fazenda.regime_tributario)
    
    def _adicionar_destinatario(self, inf_nfe: etree.Element, nfpe: NFPe):
        """Adiciona seção dest (Destinatário) ao XML"""
        dest = etree.SubElement(inf_nfe, "dest")
        
        if nfpe.destinatario_tipo == "CNPJ":
            etree.SubElement(dest, "CNPJ").text = nfpe.destinatario_documento
        else:
            etree.SubElement(dest, "CPF").text = nfpe.destinatario_documento
        
        etree.SubElement(dest, "xNome").text = nfpe.destinatario_nome
        
        # Endereço do destinatário
        endereco_dest = nfpe.destinatario_endereco
        endereco = etree.SubElement(dest, "enderDest")
        
        etree.SubElement(endereco, "xLgr").text = endereco_dest.get("logradouro", "")
        etree.SubElement(endereco, "nro").text = endereco_dest.get("numero", "S/N")
        
        if endereco_dest.get("complemento"):
            etree.SubElement(endereco, "xCpl").text = endereco_dest["complemento"]
        
        etree.SubElement(endereco, "xBairro").text = endereco_dest.get("bairro", "")
        etree.SubElement(endereco, "cMun").text = endereco_dest.get("codigo_municipio", "")
        etree.SubElement(endereco, "xMun").text = endereco_dest.get("municipio", "")
        etree.SubElement(endereco, "UF").text = endereco_dest.get("uf", "")
        etree.SubElement(endereco, "CEP").text = endereco_dest.get("cep", "")
        etree.SubElement(endereco, "cPais").text = "1058"  # Brasil
        etree.SubElement(endereco, "xPais").text = "BRASIL"
        
        if nfpe.destinatario_ie:
            etree.SubElement(dest, "IE").text = nfpe.destinatario_ie
        else:
            etree.SubElement(dest, "indIEDest").text = "9"  # Não contribuinte
    
    def _adicionar_item(self, inf_nfe: etree.Element, item):
        """Adiciona seção det (Detalhamento) ao XML"""
        det = etree.SubElement(inf_nfe, "det")
        det.set("nItem", str(item.numero_item))
        
        # Produto
        prod = etree.SubElement(det, "prod")
        etree.SubElement(prod, "cProd").text = item.codigo_produto
        etree.SubElement(prod, "cEAN").text = "SEM GTIN"
        etree.SubElement(prod, "xProd").text = item.descricao
        etree.SubElement(prod, "NCM").text = item.ncm
        etree.SubElement(prod, "CFOP").text = item.cfop
        etree.SubElement(prod, "uCom").text = item.unidade
        etree.SubElement(prod, "qCom").text = f"{item.quantidade:.4f}"
        etree.SubElement(prod, "vUnCom").text = f"{item.valor_unitario:.10f}"
        etree.SubElement(prod, "vProd").text = f"{item.valor_total:.2f}"
        etree.SubElement(prod, "cEANTrib").text = "SEM GTIN"
        etree.SubElement(prod, "uTrib").text = item.unidade
        etree.SubElement(prod, "qTrib").text = f"{item.quantidade:.4f}"
        etree.SubElement(prod, "vUnTrib").text = f"{item.valor_unitario:.10f}"
        
        if item.valor_frete > 0:
            etree.SubElement(prod, "vFrete").text = f"{item.valor_frete:.2f}"
        
        if item.valor_seguro > 0:
            etree.SubElement(prod, "vSeg").text = f"{item.valor_seguro:.2f}"
        
        if item.valor_desconto > 0:
            etree.SubElement(prod, "vDesc").text = f"{item.valor_desconto:.2f}"
        
        if item.valor_outros > 0:
            etree.SubElement(prod, "vOutro").text = f"{item.valor_outros:.2f}"
        
        etree.SubElement(prod, "indTot").text = "1"  # Compõe total da NFe
        
        # Impostos
        imposto = etree.SubElement(det, "imposto")
        
        # ICMS
        if item.icms_cst:
            icms = etree.SubElement(imposto, "ICMS")
            icms_situacao = etree.SubElement(icms, f"ICMS{item.icms_cst}")
            etree.SubElement(icms_situacao, "orig").text = "0"  # Nacional
            etree.SubElement(icms_situacao, "CST").text = item.icms_cst
            
            if item.icms_base_calculo > 0:
                etree.SubElement(icms_situacao, "vBC").text = f"{item.icms_base_calculo:.2f}"
                etree.SubElement(icms_situacao, "pICMS").text = f"{item.icms_aliquota:.2f}"
                etree.SubElement(icms_situacao, "vICMS").text = f"{item.icms_valor:.2f}"
        
        # PIS
        if item.pis_cst:
            pis = etree.SubElement(imposto, "PIS")
            pis_situacao = etree.SubElement(pis, f"PISAliq" if item.pis_aliquota > 0 else "PISNT")
            etree.SubElement(pis_situacao, "CST").text = item.pis_cst
            
            if item.pis_aliquota > 0:
                etree.SubElement(pis_situacao, "vBC").text = f"{item.valor_total:.2f}"
                etree.SubElement(pis_situacao, "pPIS").text = f"{item.pis_aliquota:.2f}"
                etree.SubElement(pis_situacao, "vPIS").text = f"{item.pis_valor:.2f}"
        
        # COFINS
        if item.cofins_cst:
            cofins = etree.SubElement(imposto, "COFINS")
            cofins_situacao = etree.SubElement(cofins, f"COFINSAliq" if item.cofins_aliquota > 0 else "COFINSNT")
            etree.SubElement(cofins_situacao, "CST").text = item.cofins_cst
            
            if item.cofins_aliquota > 0:
                etree.SubElement(cofins_situacao, "vBC").text = f"{item.valor_total:.2f}"
                etree.SubElement(cofins_situacao, "pCOFINS").text = f"{item.cofins_aliquota:.2f}"
                etree.SubElement(cofins_situacao, "vCOFINS").text = f"{item.cofins_valor:.2f}"
        
        # Informações adicionais do item
        if item.informacoes_adicionais:
            etree.SubElement(det, "infAdProd").text = item.informacoes_adicionais
    
    def _adicionar_totais(self, inf_nfe: etree.Element, nfpe: NFPe):
        """Adiciona seção total (Totais) ao XML"""
        total = etree.SubElement(inf_nfe, "total")
        
        # ICMS Total
        icms_tot = etree.SubElement(total, "ICMSTot")
        etree.SubElement(icms_tot, "vBC").text = f"{sum(item.icms_base_calculo for item in nfpe.itens):.2f}"
        etree.SubElement(icms_tot, "vICMS").text = f"{nfpe.valor_total_icms:.2f}"
        etree.SubElement(icms_tot, "vICMSDeson").text = "0.00"
        etree.SubElement(icms_tot, "vFCP").text = "0.00"
        etree.SubElement(icms_tot, "vBCST").text = "0.00"
        etree.SubElement(icms_tot, "vST").text = "0.00"
        etree.SubElement(icms_tot, "vFCPST").text = "0.00"
        etree.SubElement(icms_tot, "vFCPSTRet").text = "0.00"
        etree.SubElement(icms_tot, "vProd").text = f"{nfpe.valor_total_produtos:.2f}"
        etree.SubElement(icms_tot, "vFrete").text = f"{nfpe.valor_total_frete:.2f}"
        etree.SubElement(icms_tot, "vSeg").text = f"{nfpe.valor_total_seguro:.2f}"
        etree.SubElement(icms_tot, "vDesc").text = f"{nfpe.valor_total_desconto:.2f}"
        etree.SubElement(icms_tot, "vII").text = "0.00"
        etree.SubElement(icms_tot, "vIPI").text = f"{nfpe.valor_total_ipi:.2f}"
        etree.SubElement(icms_tot, "vIPIDevol").text = "0.00"
        etree.SubElement(icms_tot, "vPIS").text = f"{nfpe.valor_total_pis:.2f}"
        etree.SubElement(icms_tot, "vCOFINS").text = f"{nfpe.valor_total_cofins:.2f}"
        etree.SubElement(icms_tot, "vOutro").text = f"{nfpe.valor_total_outros:.2f}"
        etree.SubElement(icms_tot, "vNF").text = f"{nfpe.valor_total_nfe:.2f}"
        etree.SubElement(icms_tot, "vTotTrib").text = f"{nfpe.valor_total_icms + nfpe.valor_total_pis + nfpe.valor_total_cofins:.2f}"
    
    def _adicionar_transporte(self, inf_nfe: etree.Element, nfpe: NFPe):
        """Adiciona seção transp (Transporte) ao XML"""
        transp = etree.SubElement(inf_nfe, "transp")
        etree.SubElement(transp, "modFrete").text = str(nfpe.modalidade_frete)
        
        if nfpe.transportador_documento:
            transporta = etree.SubElement(transp, "transporta")
            
            if len(nfpe.transportador_documento) == 14:
                etree.SubElement(transporta, "CNPJ").text = nfpe.transportador_documento
            else:
                etree.SubElement(transporta, "CPF").text = nfpe.transportador_documento
            
            if nfpe.transportador_nome:
                etree.SubElement(transporta, "xNome").text = nfpe.transportador_nome
        
        if nfpe.veiculo_placa:
            veiculo = etree.SubElement(transp, "veicTransp")
            etree.SubElement(veiculo, "placa").text = nfpe.veiculo_placa
            etree.SubElement(veiculo, "UF").text = nfpe.veiculo_uf or "MT"
    
    def _adicionar_informacoes_adicionais(self, inf_nfe: etree.Element, nfpe: NFPe):
        """Adiciona seção infAdic (Informações adicionais) ao XML"""
        inf_adic = etree.SubElement(inf_nfe, "infAdic")
        
        if nfpe.informacoes_complementares:
            etree.SubElement(inf_adic, "infCpl").text = nfpe.informacoes_complementares
        
        if nfpe.informacoes_fisco:
            etree.SubElement(inf_adic, "infAdFisco").text = nfpe.informacoes_fisco


# Instância global do gerador
nfpe_generator = NFPeXMLGenerator()