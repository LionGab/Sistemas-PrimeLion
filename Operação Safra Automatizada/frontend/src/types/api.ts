// Common API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ApiError {
  message: string
  detail?: string
  code?: string
}

// NFP-e Types
export interface NFPe {
  id: number
  numero_nfe: number
  serie: number
  chave_acesso: string
  status: 'PENDENTE' | 'PROCESSANDO' | 'AUTORIZADA' | 'REJEITADA' | 'CANCELADA'
  data_emissao: string
  data_saida?: string
  valor_total_nfe: number
  valor_total_produtos: number
  destinatario_nome: string
  destinatario_documento: string
  natureza_operacao: string
  created_at: string
  updated_at: string
}

export interface CreateNFPeRequest {
  fazenda_id: number
  numero_nfe: number
  serie: number
  tipo_operacao: number
  natureza_operacao: string
  cfop: string
  destinatario_nome: string
  destinatario_documento: string
  destinatario_tipo: 'CPF' | 'CNPJ'
  itens: NFPeItemRequest[]
}

export interface NFPeItemRequest {
  codigo_produto: string
  descricao: string
  ncm: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

// Produto Types
export interface Produto {
  id: number
  codigo_interno: string
  codigo_totvs?: string
  descricao: string
  ncm: string
  cfop_padrao: string
  unidade_medida: string
  tipo_produto: 'GRAO' | 'FIBRA' | 'SEMENTE' | 'INSUMO' | 'OUTROS'
  categoria: string
  valor_unitario_padrao?: number
  ativo: boolean
  created_at: string
  updated_at: string
}

// Cliente Types
export interface Cliente {
  id: number
  nome: string
  documento: string
  tipo_documento: 'CPF' | 'CNPJ'
  inscricao_estadual?: string
  endereco: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }
  telefone?: string
  email?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// TOTVS Integration Types
export interface TOTVSStatus {
  status: 'online' | 'offline'
  timestamp: string
  url_base: string
  company_id: string
  branch_id: string
  timeout: number
}

export interface TOTVSMovimentacao {
  id: string
  filial: string
  documento: string
  serie: string
  data_emissao: string
  cliente_fornecedor: string
  nome: string
  cnpj_cpf: string
  valor_total: number
  status: string
  total_itens: number
}