"""
FastAPI simples para desenvolvimento - Operacao Safra
Versão mínima funcional para testar frontend
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
import jwt

app = FastAPI(
    title="NFP-e API - Fazenda Brasil",
    description="API de desenvolvimento para sistema NFP-e",
    version="1.0.0-dev"
)

# CORS para desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "dev-secret-key-fazenda-brasil-2025"

# Modelos
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400  # 24 horas
    user_id: int
    user_name: str
    user_email: str

class User(BaseModel):
    id: int
    email: str
    nome_completo: str
    is_active: bool
    created_at: str

class TOTVSStatus(BaseModel):
    status: str = "online"
    timestamp: str
    url_base: str = "https://api.totvs.com.br/protheus/v1"
    company_id: str = "01"
    branch_id: str = "01"
    timeout: int = 30

# Funções auxiliares
def get_db_connection():
    conn = sqlite3.connect('nfpe_fazenda.db')
    conn.row_factory = sqlite3.Row
    return conn

def simple_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return simple_hash(password) == hashed

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "sub": str(user_data["id"]),
        "email": user_data["email"],
        "name": user_data["nome_completo"],
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(token: str = Depends(security)):
    payload = verify_jwt_token(token.credentials)
    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM usuarios WHERE id = ? AND is_active = 1", 
        (payload["sub"],)
    ).fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return dict(user)

# Endpoints
@app.get("/")
async def root():
    return {
        "message": "NFP-e API - Fazenda Brasil",
        "status": "online",
        "version": "1.0.0-dev",
        "docs": "/docs"
    }

@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM usuarios WHERE email = ? AND is_active = 1",
        (credentials.email,)
    ).fetchone()
    conn.close()
    
    # Para desenvolvimento, aceitar qualquer senha para o usuário teste
    if not user or credentials.email != "admin@fazenda-brasil.agro":
        raise HTTPException(
            status_code=401, 
            detail="Credenciais inválidas"
        )
    
    user_dict = dict(user)
    token = create_jwt_token(user_dict)
    
    return LoginResponse(
        access_token=token,
        user_id=user_dict["id"],
        user_name=user_dict["nome_completo"],
        user_email=user_dict["email"]
    )

@app.get("/api/v1/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        nome_completo=current_user["nome_completo"],
        is_active=bool(current_user["is_active"]),
        created_at=current_user["created_at"] or datetime.now().isoformat()
    )

@app.post("/api/v1/auth/logout")
async def logout():
    return {"message": "Logout realizado com sucesso"}

@app.get("/api/v1/totvs/status", response_model=TOTVSStatus)
async def totvs_status():
    return TOTVSStatus(
        status="online",
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "sqlite - ok",
        "totvs": "mock - ok"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)