"""
API de Autenticação e Autorização
Sistema de login, JWT e controle de acesso
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import logging

from ..core.database import get_db
from ..core.config import get_settings
from ..models import Usuario, TokenAccess, LogAcesso

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()
settings = get_settings()


class LoginRequest(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Schema de resposta do login"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    user_name: str
    user_email: str


class UserResponse(BaseModel):
    """Schema de resposta do usuário"""
    id: int
    email: str
    nome_completo: str
    cpf: Optional[str]
    cargo: Optional[str]
    departamento: Optional[str]
    is_active: bool
    ultimo_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        orm_mode = True


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Autenticação de usuário
    
    Retorna JWT token para acesso à API
    """
    try:
        # Busca usuário por email
        usuario = db.query(Usuario).filter(
            Usuario.email == credentials.email
        ).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos"
            )
        
        if not usuario.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário inativo"
            )
        
        # Verifica senha
        if not usuario.verify_password(credentials.password):
            # Log tentativa de login falha
            log_acesso = LogAcesso(
                usuario_id=usuario.id,
                acao="LOGIN_FAILED",
                ip_address="unknown",
                sucesso=False,
                erro_mensagem="Senha incorreta"
            )
            db.add(log_acesso)
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos"
            )
        
        # Verifica se senha não está expirada
        if usuario.is_password_expired:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Senha expirada. Contate o administrador."
            )
        
        # Gera JWT token
        expires_in_seconds = settings.JWT_EXPIRATION_HOURS * 3600
        expire = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
        
        token_data = {
            "sub": str(usuario.id),
            "email": usuario.email,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        access_token = jwt.encode(
            token_data, 
            settings.SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        
        # Salva token no banco
        token_hash = jwt.encode({"token": access_token}, settings.SECRET_KEY)
        token_access = TokenAccess(
            usuario_id=usuario.id,
            token_hash=token_hash,
            token_type="access",
            expires_at=expire
        )
        db.add(token_access)
        
        # Atualiza último login
        usuario.ultimo_login = datetime.utcnow()
        
        # Log login sucesso
        log_acesso = LogAcesso(
            usuario_id=usuario.id,
            acao="LOGIN_SUCCESS",
            ip_address="unknown",
            sucesso=True
        )
        db.add(log_acesso)
        
        db.commit()
        
        logger.info(f"Login realizado: {usuario.email}")
        
        return LoginResponse(
            access_token=access_token,
            expires_in=expires_in_seconds,
            user_id=usuario.id,
            user_name=usuario.nome_completo,
            user_email=usuario.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor"
        )


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Logout do usuário
    
    Revoga o token JWT
    """
    try:
        # Decodifica token
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = int(payload.get("sub"))
        
        # Revoga token
        token_hash = jwt.encode({"token": token}, settings.SECRET_KEY)
        token_access = db.query(TokenAccess).filter(
            TokenAccess.token_hash == token_hash
        ).first()
        
        if token_access:
            token_access.is_revoked = True
        
        # Log logout
        log_acesso = LogAcesso(
            usuario_id=user_id,
            acao="LOGOUT",
            ip_address="unknown",
            sucesso=True
        )
        db.add(log_acesso)
        
        db.commit()
        
        return {"message": "Logout realizado com sucesso"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    except Exception as e:
        logger.error(f"Erro no logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: Usuario = Depends(get_current_user_dependency)
):
    """
    Retorna dados do usuário atual
    """
    return UserResponse.from_orm(current_user)


@router.post("/refresh")
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Renova token JWT
    """
    try:
        # Decodifica token atual
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id = int(payload.get("sub"))
        
        # Busca usuário
        usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
        if not usuario or not usuario.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário inválido"
            )
        
        # Gera novo token
        expires_in_seconds = settings.JWT_EXPIRATION_HOURS * 3600
        expire = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
        
        token_data = {
            "sub": str(usuario.id),
            "email": usuario.email,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        new_token = jwt.encode(
            token_data,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        
        # Revoga token anterior
        old_token_hash = jwt.encode({"token": token}, settings.SECRET_KEY)
        old_token = db.query(TokenAccess).filter(
            TokenAccess.token_hash == old_token_hash
        ).first()
        
        if old_token:
            old_token.is_revoked = True
        
        # Salva novo token
        new_token_hash = jwt.encode({"token": new_token}, settings.SECRET_KEY)
        token_access = TokenAccess(
            usuario_id=usuario.id,
            token_hash=new_token_hash,
            token_type="access",
            expires_at=expire
        )
        db.add(token_access)
        db.commit()
        
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": expires_in_seconds
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    except Exception as e:
        logger.error(f"Erro ao renovar token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno no servidor"
        )


# Dependency para obter usuário atual
async def get_current_user_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Dependency para obter usuário autenticado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        
        # Verifica se token foi revogado
        token_hash = jwt.encode({"token": token}, settings.SECRET_KEY)
        token_access = db.query(TokenAccess).filter(
            TokenAccess.token_hash == token_hash
        ).first()
        
        if token_access and token_access.is_revoked:
            raise credentials_exception
        
        # Decodifica token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Busca usuário
        usuario = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
        if usuario is None or not usuario.is_active:
            raise credentials_exception
            
        return usuario
        
    except JWTError:
        raise credentials_exception