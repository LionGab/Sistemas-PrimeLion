"""
Testes de geração de NFP-e
Validação do motor de geração XML e assinatura digital
"""
import pytest
from datetime import datetime
from decimal import Decimal
from lxml import etree
from unittest.mock import Mock, patch

from src.services.nfpe_generator import NFPeXMLGenerator
from src.models.nfpe import NFPe, NFPeItem
from src.models.fazenda import Fazenda


class TestNFPeGeneration:
    """Testes para geração de NFP-e"""
    
    def setup_method(self):
        """Setup para cada teste"""
        self.generator = NFPeXMLGenerator()
        self.fazenda = self.create_test_fazenda()
        self.nfpe = self.create_test_nfpe()
    
    def create_test_fazenda(self) -> Fazenda:
        """Cria fazenda para testes"""
        return Fazenda(
            id=1,
            cnpj="12345678000190",
            inscricao_estadual="1234567890",
            razao_social="Fazenda Brasil Ltda",
            nome_fantasia="Fazenda Brasil",
            logradouro="Rodovia MT-130",
            numero="KM 45",
            bairro="Zona Rural",
            codigo_municipio="5102704",
            municipio="Campo Verde",
            uf="MT",
            cep="78840000",
            codigo_pais="1058",
            pais="BRASIL",
            regime_tributario=3,
            serie_nfe_padrao=1,
            ultimo_numero_nfe=0
        )
    
    def create_test_nfpe(self) -> NFPe:
        """Cria NFP-e para testes"""
        nfpe = NFPe(
            id=1,
            fazenda_id=1,
            numero_nfe=1,
            serie=1,
            modelo="55",
            data_emissao=datetime(2024, 9, 1, 10, 0, 0),
            tipo_operacao=1,
            natureza_operacao="Venda de producao propria",
            cfop="5101",
            finalidade=1,
            indicador_presenca=0,
            destinatario_tipo="CNPJ",
            destinatario_documento="98765432000187",
            destinatario_nome="Cooperativa Agropecuaria Ltda",
            destinatario_ie="0987654321",
            destinatario_endereco={
                "logradouro": "Rua das Flores",
                "numero": "123",
                "bairro": "Centro",
                "municipio": "Cuiaba",
                "uf": "MT",
                "cep": "78000000",
                "codigo_municipio": "5103403"
            },
            valor_total_produtos=Decimal("10000.00"),
            valor_total_frete=Decimal("500.00"),
            valor_total_seguro=Decimal("0.00"),
            valor_total_desconto=Decimal("200.00"),
            valor_total_outros=Decimal("0.00"),
            valor_total_nfe=Decimal("10300.00"),
            valor_total_icms=Decimal("1200.00"),
            valor_total_pis=Decimal("65.00"),
            valor_total_cofins=Decimal("300.00"),
            modalidade_frete=0,
            status="PENDENTE"
        )
        
        # Adiciona item de teste
        item = NFPeItem(
            id=1,
            nfpe_id=1,
            numero_item=1,
            codigo_produto="SOJA001",
            descricao="SOJA GRAOS TIPO 1",
            ncm="12019000",
            cfop="5101",
            unidade="KG",
            quantidade=Decimal("10000.0000"),
            valor_unitario=Decimal("1.0000000000"),
            valor_total=Decimal("10000.00"),
            valor_desconto=Decimal("200.00"),
            icms_cst="000",
            icms_aliquota=Decimal("12.00"),
            icms_valor=Decimal("1200.00"),
            icms_base_calculo=Decimal("10000.00"),
            pis_cst="01",
            pis_aliquota=Decimal("0.65"),
            pis_valor=Decimal("65.00"),
            cofins_cst="01",
            cofins_aliquota=Decimal("3.00"),
            cofins_valor=Decimal("300.00"),
            safra="2024/2025"
        )
        
        nfpe.itens = [item]
        return nfpe
    
    def test_gerar_chave_acesso(self):
        """Testa geração de chave de acesso"""
        # Gera chave
        chave = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        
        # Validações
        assert len(chave) == 44, "Chave deve ter 44 dígitos"
        assert chave.isdigit(), "Chave deve conter apenas números"
        assert chave.startswith("51"), "Chave deve começar com código UF MT (51)"
        
        # Valida estrutura da chave
        uf = chave[:2]
        aamm = chave[2:6]
        cnpj = chave[6:20]
        modelo = chave[20:22]
        serie = chave[22:25]
        numero = chave[25:34]
        tipo_emissao = chave[34:35]
        codigo_numerico = chave[35:43]
        dv = chave[43:44]
        
        assert uf == "51"
        assert modelo == "55"
        assert serie == "001"
        assert numero == "000000001"
        assert tipo_emissao == "1"
        assert cnpj == self.fazenda.cnpj.zfill(14)
    
    def test_calcular_dv_chave_acesso(self):
        """Testa cálculo do dígito verificador"""
        chave_teste = "5124091234567800019055001000000011800000001"
        dv = self.generator._calcular_dv_chave_acesso(chave_teste)
        
        # DV deve ser string de 1 dígito
        assert isinstance(dv, str)
        assert len(dv) == 1
        assert dv.isdigit()
    
    def test_montar_xml_nfe_estrutura(self):
        """Testa estrutura básica do XML gerado"""
        # Mock da assinatura digital
        with patch.object(self.generator.signature_service, 'assinar_xml') as mock_sign:
            mock_sign.return_value = "<xml>signed</xml>"
            
            # Gera chave de acesso para teste
            self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
            
            # Gera XML
            xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
            
            # Parse do XML
            root = etree.fromstring(xml_content.encode('utf-8'))
            
            # Validações de estrutura
            assert root.tag == "NFe"
            
            # Verifica infNFe
            inf_nfe = root.find("infNFe")
            assert inf_nfe is not None
            assert inf_nfe.get("Id") == f"NFe{self.nfpe.chave_acesso}"
            assert inf_nfe.get("versao") == "4.00"
            
            # Verifica seções obrigatórias
            assert inf_nfe.find("ide") is not None
            assert inf_nfe.find("emit") is not None
            assert inf_nfe.find("dest") is not None
            assert inf_nfe.find("det") is not None
            assert inf_nfe.find("total") is not None
            assert inf_nfe.find("transp") is not None
    
    def test_validacao_dados_identificacao(self):
        """Testa seção ide (identificação)"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        ide = root.find(".//ide")
        
        assert ide.find("cUF").text == "51"  # MT
        assert ide.find("natOp").text == self.nfpe.natureza_operacao
        assert ide.find("mod").text == "55"
        assert ide.find("serie").text == "1"
        assert ide.find("nNF").text == "1"
        assert ide.find("tpNF").text == "1"  # Saída
        assert ide.find("idDest").text == "1"  # Operação interna
        assert ide.find("cMunFG").text == self.fazenda.codigo_municipio
        assert ide.find("tpAmb").text == "2"  # Homologação (padrão em teste)
        assert ide.find("finNFe").text == "1"  # Normal
        assert ide.find("indFinal").text == "1"  # Consumidor final
        assert ide.find("indPres").text == "0"  # Não se aplica
    
    def test_validacao_dados_emitente(self):
        """Testa seção emit (emitente)"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        emit = root.find(".//emit")
        
        assert emit.find("CNPJ").text == self.fazenda.cnpj
        assert emit.find("xNome").text == self.fazenda.razao_social
        assert emit.find("xFant").text == self.fazenda.nome_fantasia
        assert emit.find("IE").text == self.fazenda.inscricao_estadual
        assert emit.find("CRT").text == str(self.fazenda.regime_tributario)
        
        # Endereço
        endereco = emit.find("enderEmit")
        assert endereco.find("xLgr").text == self.fazenda.logradouro
        assert endereco.find("nro").text == self.fazenda.numero
        assert endereco.find("xBairro").text == self.fazenda.bairro
        assert endereco.find("cMun").text == self.fazenda.codigo_municipio
        assert endereco.find("xMun").text == self.fazenda.municipio
        assert endereco.find("UF").text == self.fazenda.uf
        assert endereco.find("CEP").text == self.fazenda.cep
    
    def test_validacao_dados_destinatario(self):
        """Testa seção dest (destinatário)"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        dest = root.find(".//dest")
        
        assert dest.find("CNPJ").text == self.nfpe.destinatario_documento
        assert dest.find("xNome").text == self.nfpe.destinatario_nome
        assert dest.find("IE").text == self.nfpe.destinatario_ie
        
        # Endereço
        endereco = dest.find("enderDest")
        endereco_data = self.nfpe.destinatario_endereco
        assert endereco.find("xLgr").text == endereco_data["logradouro"]
        assert endereco.find("nro").text == endereco_data["numero"]
        assert endereco.find("xBairro").text == endereco_data["bairro"]
        assert endereco.find("cMun").text == endereco_data["codigo_municipio"]
        assert endereco.find("xMun").text == endereco_data["municipio"]
        assert endereco.find("UF").text == endereco_data["uf"]
        assert endereco.find("CEP").text == endereco_data["cep"]
    
    def test_validacao_item_produto(self):
        """Testa seção det (detalhamento do produto)"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        det = root.find(".//det")
        
        assert det.get("nItem") == "1"
        
        # Produto
        prod = det.find("prod")
        item = self.nfpe.itens[0]
        
        assert prod.find("cProd").text == item.codigo_produto
        assert prod.find("xProd").text == item.descricao
        assert prod.find("NCM").text == item.ncm
        assert prod.find("CFOP").text == item.cfop
        assert prod.find("uCom").text == item.unidade
        assert prod.find("qCom").text == f"{item.quantidade:.4f}"
        assert prod.find("vUnCom").text == f"{item.valor_unitario:.10f}"
        assert prod.find("vProd").text == f"{item.valor_total:.2f}"
    
    def test_validacao_impostos(self):
        """Testa seção de impostos"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        imposto = root.find(".//imposto")
        
        # ICMS
        icms = imposto.find("ICMS")
        icms_situacao = icms.find("ICMS000")  # CST 000
        assert icms_situacao.find("orig").text == "0"  # Nacional
        assert icms_situacao.find("CST").text == "000"
        
        # PIS
        pis = imposto.find("PIS")
        pis_situacao = pis.find("PISAliq")
        assert pis_situacao.find("CST").text == "01"
        
        # COFINS
        cofins = imposto.find("COFINS")
        cofins_situacao = cofins.find("COFINSAliq")
        assert cofins_situacao.find("CST").text == "01"
    
    def test_validacao_totais(self):
        """Testa seção total (totais da NFe)"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        icms_tot = root.find(".//ICMSTot")
        
        assert icms_tot.find("vProd").text == f"{self.nfpe.valor_total_produtos:.2f}"
        assert icms_tot.find("vFrete").text == f"{self.nfpe.valor_total_frete:.2f}"
        assert icms_tot.find("vDesc").text == f"{self.nfpe.valor_total_desconto:.2f}"
        assert icms_tot.find("vNF").text == f"{self.nfpe.valor_total_nfe:.2f}"
        assert icms_tot.find("vICMS").text == f"{self.nfpe.valor_total_icms:.2f}"
        assert icms_tot.find("vPIS").text == f"{self.nfpe.valor_total_pis:.2f}"
        assert icms_tot.find("vCOFINS").text == f"{self.nfpe.valor_total_cofins:.2f}"
    
    @patch('src.services.digital_signature.DigitalSignatureService.assinar_xml')
    def test_geracao_xml_completa(self, mock_assinar):
        """Testa geração completa do XML assinado"""
        # Mock da assinatura
        xml_assinado = "<xml>signed_xml_content</xml>"
        mock_assinar.return_value = xml_assinado
        
        # Gera XML completo
        resultado = self.generator.gerar_xml_nfe(self.nfpe, self.fazenda)
        
        # Validações
        assert resultado == xml_assinado
        mock_assinar.assert_called_once()
        
        # Verifica se chave foi gerada
        assert self.nfpe.chave_acesso is not None
        assert len(self.nfpe.chave_acesso) == 44
    
    def test_xml_namespace_correto(self):
        """Testa se o XML tem o namespace correto da NFe 4.00"""
        self.nfpe.chave_acesso = self.generator._gerar_chave_acesso(self.nfpe, self.fazenda)
        xml_content = self.generator._montar_xml_nfe(self.nfpe, self.fazenda)
        
        root = etree.fromstring(xml_content.encode('utf-8'))
        
        # Verifica namespace
        assert root.nsmap[None] == "http://www.portalfiscal.inf.br/nfe"
        
        # Verifica versão
        inf_nfe = root.find("infNFe")
        assert inf_nfe.get("versao") == "4.00"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])