"""
APIs do sistema NFP-e
Importações centralizadas dos routers
"""
from . import nfpe, totvs, monitoring, auth

__all__ = ["nfpe", "totvs", "monitoring", "auth"]