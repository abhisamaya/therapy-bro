"""Wallet router for TherapyBro backend."""
import logging
from decimal import Decimal
from fastapi import APIRouter, Depends

from app.db import get_session
from app.models import User
from app.schemas import WalletOut, CreateWalletOut
from app.auth import get_current_user
from app.dependencies import get_wallet_service
from app.services.wallet_service import WalletService
from app.logging_config import get_logger

# Create logger for wallet router
wallet_router_logger = get_logger('wallet_router')

# Create router
router = APIRouter(prefix="/api", tags=["wallet"])


@router.get("/wallet", response_model=WalletOut)
def get_wallet(user: User = Depends(get_current_user), wallet_service: WalletService = Depends(get_wallet_service)):
    """Get or create user's wallet and return balance."""
    wallet_router_logger.info(f"Getting wallet for user: {user.login_id}")
    
    wallet_out = wallet_service.get_wallet_balance(user.id)
    wallet_router_logger.info(f"Wallet retrieved for user: {user.login_id}, balance: {wallet_out.balance}")
    return wallet_out


@router.post("/wallet/create", response_model=CreateWalletOut)
def create_wallet(user: User = Depends(get_current_user), wallet_service: WalletService = Depends(get_wallet_service)):
    """Explicitly create a wallet for the user."""
    wallet_router_logger.info(f"Creating wallet for user: {user.login_id}")
    
    # Check if wallet already exists
    existing = wallet_service.find_wallet_by_user_id(user.id)
    if existing:
        wallet_router_logger.info(f"Wallet already exists for user: {user.login_id}")
        return CreateWalletOut(
            wallet_id=existing.id,
            balance=str(existing.balance),
            currency=existing.currency
        )

    # Create new wallet with initial balance using wallet service
    wallet = wallet_service.create_wallet_with_bonus(user.id)
    wallet_router_logger.info(f"Wallet created for user: {user.login_id}, balance: {wallet.balance}")
    
    return CreateWalletOut(
        wallet_id=wallet.id,
        balance=str(wallet.balance),
        currency=wallet.currency
    )
