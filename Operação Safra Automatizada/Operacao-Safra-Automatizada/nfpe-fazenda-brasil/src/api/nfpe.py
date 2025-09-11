"""
API REST para operações de NFP-e
Endpoints para geração, consulta e gestão de Nota Fiscal do Produtor Eletrônica
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from ..core.database import get_db
from ..models import NFPe, NFPeItem, Fazenda
from ..services.nfpe_generator import nfpe_generator
from ..services.sefaz_client import sefaz_client
from ..services.totvs_integration import totvs_service
from ..schemas.nfpe_schema import (
    NFPeCreate, NFPeResponse, NFPeListResponse, 
    NFPeStatus, NFPeTransmitir, NFPeCancelar
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=NFPeListResponse)
async def listar_nfpe(
    skip: int = Query(0, ge=0, description="Registros a pular"),
    limit: int = Query(50, ge=1, le=100, description="Limite de registros"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    data_inicio: Optional[datetime] = Query(None, description="Data início (YYYY-MM-DD)"),
    data_fim: Optional[datetime] = Query(None, description="Data fim (YYYY-MM-DD)"),
    fazenda_id: Optional[int] = Query(None, description="ID da fazenda"),
    db: Session = Depends(get_db)
):
    """
    Lista NFP-e com filtros opcionais
    
    Permite filtrar por:
    - Status (PENDENTE, PROCESSANDO, AUTORIZADA, etc)
    - Período de emissão
    - Fazenda específica
    """
    try:
        query = db.query(NFPe)
        
        # Aplicar filtros
        if status:
            query = query.filter(NFPe.status == status.upper())
        
        if fazenda_id:
            query = query.filter(NFPe.fazenda_id == fazenda_id)
        
        if data_inicio:
            query = query.filter(NFPe.data_emissao >= data_inicio)
        
        if data_fim:
            query = query.filter(NFPe.data_emissao <= data_fim)
        
        # Ordenar por data de emissão (mais recentes primeiro)
        query = query.order_by(NFPe.data_emissao.desc())
        
        # Contar total
        total = query.count()
        
        # Aplicar paginação
        nfpe_list = query.offset(skip).limit(limit).all()
        
        return NFPeListResponse(
            items=nfpe_list,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Erro ao listar NFP-e: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao listar NFP-e"
        )


@router.get("/{nfpe_id}", response_model=NFPeResponse)
async def consultar_nfpe(
    nfpe_id: int = Path(..., description="ID da NFP-e"),
    db: Session = Depends(get_db)
):
    """
    Consulta NFP-e específica por ID
    
    Retorna dados completos incluindo itens
    """
    try:
        nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
        
        if not nfpe:
            raise HTTPException(
                status_code=404,
                detail="NFP-e não encontrada"
            )
        
        return NFPeResponse.from_orm(nfpe)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar NFP-e {nfpe_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao consultar NFP-e"
        )


@router.post("/", response_model=NFPeResponse, status_code=201)
async def criar_nfpe(
    nfpe_data: NFPeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Cria nova NFP-e
    
    Após criação, inicia processamento em background:
    1. Geração do XML
    2. Assinatura digital
    3. Transmissão para SEFAZ-MT
    """
    try:
        # Verifica se fazenda existe
        fazenda = db.query(Fazenda).filter(
            Fazenda.id == nfpe_data.fazenda_id
        ).first()
        
        if not fazenda:
            raise HTTPException(
                status_code=400,
                detail="Fazenda não encontrada"
            )
        
        # Gera próximo número de NFP-e
        numero_nfe = fazenda.proximo_numero_nfe()
        
        # Cria NFP-e
        nfpe = NFPe(
            fazenda_id=nfpe_data.fazenda_id,
            numero_nfe=numero_nfe,
            serie=nfpe_data.serie or fazenda.serie_nfe_padrao,
            tipo_operacao=nfpe_data.tipo_operacao,
            natureza_operacao=nfpe_data.natureza_operacao,
            cfop=nfpe_data.cfop,
            data_emissao=nfpe_data.data_emissao or datetime.now(),
            data_saida=nfpe_data.data_saida,
            destinatario_tipo=nfpe_data.destinatario_tipo,
            destinatario_documento=nfpe_data.destinatario_documento,
            destinatario_nome=nfpe_data.destinatario_nome,
            destinatario_ie=nfpe_data.destinatario_ie,
            destinatario_endereco=nfpe_data.destinatario_endereco,
            valor_total_produtos=nfpe_data.valor_total_produtos,
            valor_total_frete=nfpe_data.valor_total_frete,
            valor_total_seguro=nfpe_data.valor_total_seguro,
            valor_total_desconto=nfpe_data.valor_total_desconto,
            valor_total_outros=nfpe_data.valor_total_outros,
            valor_total_nfe=nfpe_data.valor_total_nfe,
            modalidade_frete=nfpe_data.modalidade_frete,
            transportador_documento=nfpe_data.transportador_documento,
            transportador_nome=nfpe_data.transportador_nome,
            veiculo_placa=nfpe_data.veiculo_placa,
            veiculo_uf=nfpe_data.veiculo_uf,
            informacoes_complementares=nfpe_data.informacoes_complementares,
            informacoes_fisco=nfpe_data.informacoes_fisco,
            status="PENDENTE"
        )
        
        db.add(nfpe)
        db.flush()  # Para obter ID
        
        # Adiciona itens
        for item_data in nfpe_data.itens:
            item = NFPeItem(
                nfpe_id=nfpe.id,
                numero_item=item_data.numero_item,
                produto_id=item_data.produto_id,
                codigo_produto=item_data.codigo_produto,
                descricao=item_data.descricao,
                ncm=item_data.ncm,
                cfop=item_data.cfop,
                unidade=item_data.unidade,
                quantidade=item_data.quantidade,
                valor_unitario=item_data.valor_unitario,
                valor_total=item_data.valor_total,
                valor_desconto=item_data.valor_desconto,
                valor_frete=item_data.valor_frete,
                valor_seguro=item_data.valor_seguro,
                valor_outros=item_data.valor_outros,
                icms_cst=item_data.icms_cst,
                icms_aliquota=item_data.icms_aliquota,
                icms_valor=item_data.icms_valor,
                icms_base_calculo=item_data.icms_base_calculo,
                pis_cst=item_data.pis_cst,
                pis_aliquota=item_data.pis_aliquota,
                pis_valor=item_data.pis_valor,
                cofins_cst=item_data.cofins_cst,
                cofins_aliquota=item_data.cofins_aliquota,
                cofins_valor=item_data.cofins_valor,
                lote=item_data.lote,
                talhao_origem=item_data.talhao_origem,
                safra=item_data.safra
            )
            db.add(item)
        
        # Atualiza último número da fazenda
        fazenda.ultimo_numero_nfe = numero_nfe
        
        db.commit()
        
        # Agenda processamento em background
        background_tasks.add_task(processar_nfpe_async, nfpe.id)
        
        logger.info(f"NFP-e criada: {nfpe.numero_nfe}/{nfpe.serie} - ID: {nfpe.id}")
        
        return NFPeResponse.from_orm(nfpe)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar NFP-e: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao criar NFP-e"
        )


@router.post("/{nfpe_id}/transmitir", response_model=Dict[str, Any])
async def transmitir_nfpe(
    nfpe_id: int = Path(..., description="ID da NFP-e"),
    dados: Optional[NFPeTransmitir] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """
    Transmite NFP-e para SEFAZ-MT
    
    Se NFP-e ainda não foi processada, gera XML primeiro
    """
    try:
        nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
        
        if not nfpe:
            raise HTTPException(status_code=404, detail="NFP-e não encontrada")
        
        if nfpe.status == "AUTORIZADA":
            raise HTTPException(
                status_code=400,
                detail="NFP-e já está autorizada"
            )
        
        # Agenda transmissão em background
        background_tasks.add_task(transmitir_nfpe_async, nfpe_id)
        
        return {
            "message": "Transmissão iniciada",
            "nfpe_id": nfpe_id,
            "status": nfpe.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao transmitir NFP-e {nfpe_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na transmissão"
        )


@router.post("/{nfpe_id}/cancelar", response_model=Dict[str, Any])
async def cancelar_nfpe(
    nfpe_id: int,
    dados_cancelamento: NFPeCancelar,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Cancela NFP-e autorizada
    
    Requer justificativa com mínimo 15 caracteres
    """
    try:
        nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
        
        if not nfpe:
            raise HTTPException(status_code=404, detail="NFP-e não encontrada")
        
        if nfpe.status != "AUTORIZADA":
            raise HTTPException(
                status_code=400,
                detail="Apenas NFP-e autorizadas podem ser canceladas"
            )
        
        if not nfpe.protocolo_autorizacao:
            raise HTTPException(
                status_code=400,
                detail="NFP-e sem protocolo de autorização"
            )
        
        if len(dados_cancelamento.justificativa) < 15:
            raise HTTPException(
                status_code=400,
                detail="Justificativa deve ter pelo menos 15 caracteres"
            )
        
        # Agenda cancelamento em background
        background_tasks.add_task(
            cancelar_nfpe_async, 
            nfpe_id, 
            dados_cancelamento.justificativa
        )
        
        return {
            "message": "Cancelamento iniciado",
            "nfpe_id": nfpe_id,
            "justificativa": dados_cancelamento.justificativa
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao cancelar NFP-e {nfpe_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno no cancelamento"
        )


@router.get("/{nfpe_id}/xml", response_class=Response)
async def obter_xml_nfpe(
    nfpe_id: int = Path(..., description="ID da NFP-e"),
    tipo: str = Query("nfe", regex="^(nfe|protocolo)$", description="Tipo do XML"),
    db: Session = Depends(get_db)
):
    """
    Retorna XML da NFP-e
    
    Tipos disponíveis:
    - nfe: XML da NFe
    - protocolo: XML do protocolo de autorização
    """
    try:
        nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
        
        if not nfpe:
            raise HTTPException(status_code=404, detail="NFP-e não encontrada")
        
        if tipo == "nfe":
            if not nfpe.xml_nfe:
                raise HTTPException(
                    status_code=404,
                    detail="XML da NFe não disponível"
                )
            xml_content = nfpe.xml_nfe
        else:  # protocolo
            if not nfpe.xml_protocolo:
                raise HTTPException(
                    status_code=404,
                    detail="XML do protocolo não disponível"
                )
            xml_content = nfpe.xml_protocolo
        
        filename = f"NFe{nfpe.chave_acesso}_{tipo}.xml"
        
        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter XML NFP-e {nfpe_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao obter XML"
        )


@router.get("/{nfpe_id}/status", response_model=NFPeStatus)
async def consultar_status_nfpe(
    nfpe_id: int = Path(..., description="ID da NFP-e"),
    consultar_sefaz: bool = Query(False, description="Consultar status no SEFAZ"),
    db: Session = Depends(get_db)
):
    """
    Consulta status atual da NFP-e
    
    Opcionalmente consulta situação atual no SEFAZ-MT
    """
    try:
        nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
        
        if not nfpe:
            raise HTTPException(status_code=404, detail="NFP-e não encontrada")
        
        status = NFPeStatus(
            id=nfpe.id,
            numero_nfe=nfpe.numero_nfe,
            serie=nfpe.serie,
            status=nfpe.status,
            chave_acesso=nfpe.chave_acesso,
            protocolo_autorizacao=nfpe.protocolo_autorizacao,
            data_emissao=nfpe.data_emissao,
            data_autorizacao=nfpe.data_autorizacao,
            mensagem_sefaz=nfpe.mensagem_sefaz,
            codigo_retorno_sefaz=nfpe.codigo_retorno_sefaz
        )
        
        # Se solicitado, consulta SEFAZ
        if consultar_sefaz and nfpe.chave_acesso:
            try:
                retorno = await sefaz_client.consultar_nfe(nfpe.chave_acesso)
                status.status_sefaz = {
                    "codigo": retorno.codigo,
                    "mensagem": retorno.mensagem,
                    "protocolo": retorno.protocolo,
                    "data_consulta": datetime.now()
                }
            except Exception as e:
                logger.warning(f"Erro ao consultar SEFAZ: {str(e)}")
                status.status_sefaz = {
                    "erro": str(e),
                    "data_consulta": datetime.now()
                }
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao consultar status NFP-e {nfpe_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na consulta"
        )


# Funções auxiliares para processamento em background

async def processar_nfpe_async(nfpe_id: int):
    """Processa NFP-e em background: gera XML, assina e transmite"""
    try:
        from ..core.database import get_db_session
        
        with get_db_session() as db:
            nfpe = db.query(NFPe).filter(NFPe.id == nfpe_id).first()
            if not nfpe:
                return
            
            fazenda = db.query(Fazenda).filter(Fazenda.id == nfpe.fazenda_id).first()
            if not fazenda:
                return
            
            # Atualiza status
            nfpe.status = "PROCESSANDO"
            db.commit()
            
            try:
                # Gera XML
                xml_nfe = nfpe_generator.gerar_xml_nfe(nfpe, fazenda)
                nfpe.xml_nfe = xml_nfe
                
                # Transmite para SEFAZ
                retorno = await sefaz_client.enviar_nfe(
                    nfpe, xml_nfe, fazenda.certificado_path, fazenda.certificado_senha_hash
                )
                
                if retorno.sucesso:
                    nfpe.status = "PROCESSANDO"  # Aguardando retorno
                    nfpe.mensagem_sefaz = retorno.mensagem
                    nfpe.codigo_retorno_sefaz = retorno.codigo
                    
                    # Se tem protocolo, consulta resultado
                    if retorno.protocolo:
                        resultado = await sefaz_client.consultar_recibo(retorno.protocolo)
                        if resultado.sucesso:
                            nfpe.status = "AUTORIZADA"
                            nfpe.protocolo_autorizacao = resultado.protocolo
                            nfpe.data_autorizacao = datetime.now()
                            nfpe.xml_protocolo = resultado.xml_retorno
                        else:
                            nfpe.status = "REJEITADA"
                            nfpe.mensagem_sefaz = resultado.mensagem
                else:
                    nfpe.status = "ERRO"
                    nfpe.mensagem_sefaz = retorno.mensagem
                    nfpe.codigo_retorno_sefaz = retorno.codigo
                
                db.commit()
                
            except Exception as e:
                nfpe.status = "ERRO"
                nfpe.mensagem_sefaz = str(e)
                db.commit()
                logger.error(f"Erro ao processar NFP-e {nfpe_id}: {str(e)}")
                
    except Exception as e:
        logger.error(f"Erro crítico no processamento NFP-e {nfpe_id}: {str(e)}")


async def transmitir_nfpe_async(nfpe_id: int):
    """Transmite NFP-e específica para SEFAZ"""
    # Similar ao processar_nfpe_async, mas apenas transmissão
    pass


async def cancelar_nfpe_async(nfpe_id: int, justificativa: str):
    """Cancela NFP-e específica no SEFAZ"""
    # Implementa lógica de cancelamento
    pass