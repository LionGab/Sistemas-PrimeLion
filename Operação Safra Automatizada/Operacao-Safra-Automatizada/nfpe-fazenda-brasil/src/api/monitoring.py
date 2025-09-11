"""
API de Monitoramento e Métricas
Dashboard em tempo real do sistema NFP-e
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from ..core.database import get_db
from ..models import NFPe, NFPeItem, Fazenda, LogAcesso
from ..services.sefaz_client import sefaz_client
from ..services.totvs_integration import totvs_service
from ..schemas.nfpe_schema import NFPeEstatisticas, NFPeRelatorio

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard", response_model=Dict[str, Any])
async def dashboard_geral(
    periodo_dias: int = Query(30, ge=1, le=365, description="Período em dias"),
    fazenda_id: Optional[int] = Query(None, description="Filtrar por fazenda"),
    db: Session = Depends(get_db)
):
    """
    Dashboard principal com métricas em tempo real
    
    Retorna KPIs principais:
    - Total de NFP-e por status
    - Valores faturados
    - Performance de processamento
    - Alertas e problemas
    """
    try:
        data_inicio = datetime.now() - timedelta(days=periodo_dias)
        
        # Query base
        query = db.query(NFPe).filter(NFPe.data_emissao >= data_inicio)
        if fazenda_id:
            query = query.filter(NFPe.fazenda_id == fazenda_id)
        
        # Estatísticas por status
        stats_status = db.query(
            NFPe.status,
            func.count(NFPe.id).label('total'),
            func.sum(NFPe.valor_total_nfe).label('valor_total')
        ).filter(NFPe.data_emissao >= data_inicio)
        
        if fazenda_id:
            stats_status = stats_status.filter(NFPe.fazenda_id == fazenda_id)
        
        stats_status = stats_status.group_by(NFPe.status).all()
        
        # Converte para dicionário
        por_status = {}
        valores_por_status = {}
        total_nfpe = 0
        valor_total = Decimal('0')
        
        for stat in stats_status:
            por_status[stat.status] = stat.total
            valores_por_status[stat.status] = float(stat.valor_total or 0)
            total_nfpe += stat.total
            valor_total += stat.valor_total or 0
        
        # Taxa de sucesso
        autorizadas = por_status.get('AUTORIZADA', 0)
        taxa_sucesso = (autorizadas / total_nfpe * 100) if total_nfpe > 0 else 0
        
        # Performance (tempo médio de processamento)
        tempo_medio = db.query(
            func.avg(
                func.extract('epoch', NFPe.data_autorizacao - NFPe.created_at)
            ).label('media_segundos')
        ).filter(
            and_(
                NFPe.data_emissao >= data_inicio,
                NFPe.status == 'AUTORIZADA',
                NFPe.data_autorizacao.isnot(None)
            )
        )
        
        if fazenda_id:
            tempo_medio = tempo_medio.filter(NFPe.fazenda_id == fazenda_id)
        
        tempo_medio = tempo_medio.scalar() or 0
        
        # NFP-e processadas hoje
        hoje = datetime.now().date()
        nfpe_hoje = query.filter(
            func.date(NFPe.data_emissao) == hoje
        ).count()
        
        # Alertas
        alertas = []
        
        # NFP-e pendentes há mais de 1 hora
        uma_hora_atras = datetime.now() - timedelta(hours=1)
        pendentes_antigas = query.filter(
            and_(
                NFPe.status == 'PENDENTE',
                NFPe.created_at < uma_hora_atras
            )
        ).count()
        
        if pendentes_antigas > 0:
            alertas.append({
                "tipo": "warning",
                "mensagem": f"{pendentes_antigas} NFP-e pendentes há mais de 1 hora",
                "count": pendentes_antigas
            })
        
        # NFP-e com erro
        com_erro = por_status.get('ERRO', 0)
        if com_erro > 0:
            alertas.append({
                "tipo": "error",
                "mensagem": f"{com_erro} NFP-e com erro de processamento",
                "count": com_erro
            })
        
        # Produtos mais vendidos (período)
        produtos_top = db.query(
            NFPeItem.descricao,
            func.sum(NFPeItem.quantidade).label('total_quantidade'),
            func.sum(NFPeItem.valor_total).label('total_valor'),
            func.count(NFPeItem.id).label('total_itens')
        ).join(NFPe).filter(
            NFPe.data_emissao >= data_inicio
        )
        
        if fazenda_id:
            produtos_top = produtos_top.filter(NFPe.fazenda_id == fazenda_id)
        
        produtos_top = produtos_top.group_by(NFPeItem.descricao)\
                                   .order_by(func.sum(NFPeItem.valor_total).desc())\
                                   .limit(10).all()
        
        produtos_lista = []
        for produto in produtos_top:
            produtos_lista.append({
                "descricao": produto.descricao,
                "quantidade": float(produto.total_quantidade),
                "valor": float(produto.total_valor),
                "itens": produto.total_itens
            })
        
        return {
            "periodo": {
                "inicio": data_inicio,
                "fim": datetime.now(),
                "dias": periodo_dias
            },
            "resumo": {
                "total_nfpe": total_nfpe,
                "valor_total": float(valor_total),
                "taxa_sucesso_percent": round(taxa_sucesso, 2),
                "tempo_medio_processamento_segundos": round(tempo_medio, 1),
                "nfpe_hoje": nfpe_hoje
            },
            "por_status": por_status,
            "valores_por_status": valores_por_status,
            "alertas": alertas,
            "produtos_mais_vendidos": produtos_lista,
            "fazenda_id": fazenda_id
        }
        
    except Exception as e:
        logger.error(f"Erro no dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno no dashboard"
        )


@router.get("/status-sistema", response_model=Dict[str, Any])
async def status_sistema():
    """
    Status geral do sistema e serviços externos
    
    Verifica:
    - Status do SEFAZ-MT
    - Conectividade TOTVS
    - Performance do banco de dados
    """
    try:
        status = {
            "timestamp": datetime.now(),
            "sistema": "online",
            "servicos": {}
        }
        
        # Testa SEFAZ-MT
        try:
            sefaz_status = await sefaz_client.verificar_status_servico()
            status["servicos"]["sefaz"] = {
                "status": "online" if sefaz_status.sucesso else "offline",
                "codigo": sefaz_status.codigo,
                "mensagem": sefaz_status.mensagem,
                "ambiente": "homologacao" if sefaz_status.codigo == "107" else "producao"
            }
        except Exception as e:
            status["servicos"]["sefaz"] = {
                "status": "error",
                "erro": str(e)
            }
        
        # Testa TOTVS
        try:
            totvs_online = await totvs_service.test_connection()
            status["servicos"]["totvs"] = {
                "status": "online" if totvs_online else "offline"
            }
        except Exception as e:
            status["servicos"]["totvs"] = {
                "status": "error",
                "erro": str(e)
            }
        
        # Testa banco de dados
        from ..core.database import check_db_connection
        db_ok = check_db_connection()
        status["servicos"]["database"] = {
            "status": "online" if db_ok else "offline"
        }
        
        # Status geral
        servicos_ok = all(
            s.get("status") == "online" 
            for s in status["servicos"].values()
        )
        status["sistema"] = "online" if servicos_ok else "degraded"
        
        return status
        
    except Exception as e:
        logger.error(f"Erro ao verificar status do sistema: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno na verificação de status"
        )


@router.get("/estatisticas", response_model=NFPeEstatisticas)
async def estatisticas_detalhadas(
    data_inicio: datetime = Query(..., description="Data início"),
    data_fim: datetime = Query(..., description="Data fim"),
    fazenda_id: Optional[int] = Query(None, description="ID da fazenda"),
    db: Session = Depends(get_db)
):
    """
    Estatísticas detalhadas por período
    
    Métricas avançadas:
    - Distribuição por status
    - Tempo médio de processamento
    - Valores por categoria
    - Performance por dia
    """
    try:
        # Valida período
        if data_fim <= data_inicio:
            raise HTTPException(
                status_code=400,
                detail="Data fim deve ser posterior à data início"
            )
        
        if (data_fim - data_inicio).days > 365:
            raise HTTPException(
                status_code=400,
                detail="Período não pode exceder 365 dias"
            )
        
        # Query base
        query = db.query(NFPe).filter(
            and_(
                NFPe.data_emissao >= data_inicio,
                NFPe.data_emissao <= data_fim
            )
        )
        
        if fazenda_id:
            query = query.filter(NFPe.fazenda_id == fazenda_id)
        
        # Total de NFP-e
        total_nfpe = query.count()
        
        # Distribuição por status
        stats_status = query.with_entities(
            NFPe.status,
            func.count(NFPe.id).label('total')
        ).group_by(NFPe.status).all()
        
        por_status = {stat.status: stat.total for stat in stats_status}
        
        # Valor total do período
        valor_total = query.with_entities(
            func.sum(NFPe.valor_total_nfe)
        ).scalar() or Decimal('0')
        
        # Tempo médio de processamento (apenas autorizadas)
        tempo_medio = query.filter(
            and_(
                NFPe.status == 'AUTORIZADA',
                NFPe.data_autorizacao.isnot(None)
            )
        ).with_entities(
            func.avg(
                func.extract('epoch', NFPe.data_autorizacao - NFPe.created_at)
            )
        ).scalar() or 0
        
        # Taxa de sucesso
        autorizadas = por_status.get('AUTORIZADA', 0)
        taxa_sucesso = (autorizadas / total_nfpe * 100) if total_nfpe > 0 else 0
        
        return NFPeEstatisticas(
            total_nfpe=total_nfpe,
            por_status=por_status,
            valor_total_periodo=valor_total,
            media_processamento_segundos=round(tempo_medio, 2) if tempo_medio else None,
            taxa_sucesso_percent=round(taxa_sucesso, 2),
            periodo_inicio=data_inicio,
            periodo_fim=data_fim
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao calcular estatísticas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno no cálculo de estatísticas"
        )


@router.get("/relatorio-fazenda/{fazenda_id}", response_model=NFPeRelatorio)
async def relatorio_fazenda(
    fazenda_id: int,
    data_inicio: datetime = Query(..., description="Data início"),
    data_fim: datetime = Query(..., description="Data fim"),
    db: Session = Depends(get_db)
):
    """
    Relatório completo por fazenda
    
    Inclui:
    - Totais por status
    - Produtos mais vendidos
    - Destinos principais
    - Análise de performance
    """
    try:
        # Verifica se fazenda existe
        fazenda = db.query(Fazenda).filter(Fazenda.id == fazenda_id).first()
        if not fazenda:
            raise HTTPException(
                status_code=404,
                detail="Fazenda não encontrada"
            )
        
        # NFP-e da fazenda no período
        query = db.query(NFPe).filter(
            and_(
                NFPe.fazenda_id == fazenda_id,
                NFPe.data_emissao >= data_inicio,
                NFPe.data_emissao <= data_fim
            )
        )
        
        # Totais por status
        total_emitidas = query.count()
        total_autorizadas = query.filter(NFPe.status == 'AUTORIZADA').count()
        total_rejeitadas = query.filter(NFPe.status == 'REJEITADA').count()
        
        # Valor total faturado
        valor_total = query.filter(NFPe.status == 'AUTORIZADA')\
                          .with_entities(func.sum(NFPe.valor_total_nfe))\
                          .scalar() or Decimal('0')
        
        # Produtos mais vendidos
        produtos_vendidos = db.query(
            NFPeItem.descricao,
            NFPeItem.ncm,
            func.sum(NFPeItem.quantidade).label('quantidade_total'),
            func.sum(NFPeItem.valor_total).label('valor_total'),
            func.count(NFPeItem.id).label('total_vendas')
        ).join(NFPe).filter(
            and_(
                NFPe.fazenda_id == fazenda_id,
                NFPe.data_emissao >= data_inicio,
                NFPe.data_emissao <= data_fim,
                NFPe.status == 'AUTORIZADA'
            )
        ).group_by(NFPeItem.descricao, NFPeItem.ncm)\
         .order_by(func.sum(NFPeItem.valor_total).desc())\
         .limit(15).all()
        
        produtos_lista = []
        for produto in produtos_vendidos:
            produtos_lista.append({
                "descricao": produto.descricao,
                "ncm": produto.ncm,
                "quantidade_total": float(produto.quantidade_total),
                "valor_total": float(produto.valor_total),
                "total_vendas": produto.total_vendas
            })
        
        # Destinos principais
        destinos = db.query(
            NFPe.destinatario_nome,
            NFPe.destinatario_documento,
            func.count(NFPe.id).label('total_nfpe'),
            func.sum(NFPe.valor_total_nfe).label('valor_total')
        ).filter(
            and_(
                NFPe.fazenda_id == fazenda_id,
                NFPe.data_emissao >= data_inicio,
                NFPe.data_emissao <= data_fim,
                NFPe.status == 'AUTORIZADA'
            )
        ).group_by(NFPe.destinatario_nome, NFPe.destinatario_documento)\
         .order_by(func.sum(NFPe.valor_total_nfe).desc())\
         .limit(10).all()
        
        destinos_lista = []
        for destino in destinos:
            destinos_lista.append({
                "nome": destino.destinatario_nome,
                "documento": destino.destinatario_documento,
                "total_nfpe": destino.total_nfpe,
                "valor_total": float(destino.valor_total)
            })
        
        return NFPeRelatorio(
            fazenda_id=fazenda_id,
            periodo_inicio=data_inicio,
            periodo_fim=data_fim,
            total_nfpe_emitidas=total_emitidas,
            total_nfpe_autorizadas=total_autorizadas,
            total_nfpe_rejeitadas=total_rejeitadas,
            valor_total_faturado=valor_total,
            produtos_mais_vendidos=produtos_lista,
            destinos_principais=destinos_lista
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar relatório da fazenda {fazenda_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno no relatório"
        )


@router.get("/alertas", response_model=List[Dict[str, Any]])
async def listar_alertas(
    severidade: Optional[str] = Query(None, regex="^(info|warning|error|critical)$"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista alertas do sistema
    
    Tipos de alertas:
    - NFP-e pendentes por muito tempo
    - Erros de processamento
    - Problemas de conectividade
    - Performance degradada
    """
    try:
        alertas = []
        agora = datetime.now()
        
        # NFP-e pendentes há mais de 2 horas
        duas_horas_atras = agora - timedelta(hours=2)
        pendentes_criticas = db.query(NFPe).filter(
            and_(
                NFPe.status == 'PENDENTE',
                NFPe.created_at < duas_horas_atras
            )
        ).count()
        
        if pendentes_criticas > 0:
            alertas.append({
                "id": "pendentes_criticas",
                "tipo": "error",
                "severidade": "error",
                "titulo": "NFP-e Pendentes Críticas",
                "mensagem": f"{pendentes_criticas} NFP-e pendentes há mais de 2 horas",
                "count": pendentes_criticas,
                "timestamp": agora,
                "acao_sugerida": "Verificar logs de processamento e status dos serviços"
            })
        
        # NFP-e com erro nas últimas 24h
        ontem = agora - timedelta(hours=24)
        com_erro = db.query(NFPe).filter(
            and_(
                NFPe.status == 'ERRO',
                NFPe.updated_at >= ontem
            )
        ).count()
        
        if com_erro > 0:
            alertas.append({
                "id": "erros_recentes",
                "tipo": "warning",
                "severidade": "warning",
                "titulo": "Erros de Processamento",
                "mensagem": f"{com_erro} NFP-e com erro nas últimas 24 horas",
                "count": com_erro,
                "timestamp": agora,
                "acao_sugerida": "Analisar mensagens de erro e corrigir problemas"
            })
        
        # NFP-e rejeitadas nas últimas 24h
        rejeitadas = db.query(NFPe).filter(
            and_(
                NFPe.status == 'REJEITADA',
                NFPe.updated_at >= ontem
            )
        ).count()
        
        if rejeitadas > 5:  # Mais de 5 rejeitadas é preocupante
            alertas.append({
                "id": "muitas_rejeitadas",
                "tipo": "warning",
                "severidade": "warning",
                "titulo": "Muitas NFP-e Rejeitadas",
                "mensagem": f"{rejeitadas} NFP-e rejeitadas nas últimas 24 horas",
                "count": rejeitadas,
                "timestamp": agora,
                "acao_sugerida": "Verificar dados das NFP-e e corrigir problemas recorrentes"
            })
        
        # Performance degradada (tempo médio > 5 minutos)
        tempo_medio = db.query(
            func.avg(
                func.extract('epoch', NFPe.data_autorizacao - NFPe.created_at)
            )
        ).filter(
            and_(
                NFPe.status == 'AUTORIZADA',
                NFPe.data_autorizacao >= ontem,
                NFPe.data_autorizacao.isnot(None)
            )
        ).scalar()
        
        if tempo_medio and tempo_medio > 300:  # 5 minutos = 300 segundos
            alertas.append({
                "id": "performance_degradada",
                "tipo": "warning",
                "severidade": "warning",
                "titulo": "Performance Degradada",
                "mensagem": f"Tempo médio de processamento: {int(tempo_medio/60)} minutos",
                "timestamp": agora,
                "acao_sugerida": "Verificar carga do sistema e conectividade com SEFAZ"
            })
        
        # Filtrar por severidade se especificado
        if severidade:
            alertas = [a for a in alertas if a.get("severidade") == severidade]
        
        # Ordenar por severidade e timestamp
        ordem_severidade = {"critical": 0, "error": 1, "warning": 2, "info": 3}
        alertas.sort(
            key=lambda x: (
                ordem_severidade.get(x.get("severidade", "info"), 4),
                x.get("timestamp", agora)
            ),
            reverse=True
        )
        
        return alertas[:limit]
        
    except Exception as e:
        logger.error(f"Erro ao listar alertas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno ao listar alertas"
        )