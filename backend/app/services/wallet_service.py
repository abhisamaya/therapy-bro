"""Wallet service for managing user wallets and transactions."""
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Wallet, WalletTransaction, User
from app.schemas import WalletOut
from app.services.base_service import BaseService
from app.repositories.wallet_repository import WalletRepository, TransactionRepository
from app.config.settings import get_settings
from app.utils import now_utc


class WalletService(BaseService):
    """Service for wallet operations."""
    
    def __init__(self, db_session: Session):
        """Initialize service with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        super().__init__(db_session)
        self.wallet_repository = WalletRepository(db_session)
        self.transaction_repository = TransactionRepository(db_session)
    
    def create_wallet_with_bonus(self, user_id: int) -> Wallet:
        """Create a wallet with initial bonus for a new user.
        
        Args:
            user_id: The user ID to create wallet for
            
        Returns:
            The created wallet with initial balance
        """
        self.logger.info(f"Creating wallet with bonus for user ID: {user_id}")
        
        # Create wallet with initial balance from settings
        settings = get_settings()
        wallet = Wallet(
            user_id=user_id,
            balance=settings.initial_wallet_balance,
            reserved=Decimal("0.0000"),
            currency=settings.wallet_currency,
            updated_at=now_utc()
        )
        
        # Add wallet to database
        wallet = self.wallet_repository.create(wallet)
        
        # Create initial transaction record
        transaction = WalletTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            type="topup",
            amount=settings.initial_wallet_balance,
            balance_after=settings.initial_wallet_balance,
            reference_id="initial_signup_bonus",
            meta={"reason": "New user signup bonus"},
            created_at=now_utc()
        )
        self.transaction_repository.create(transaction)
        self.db.refresh(wallet)
        
        self.logger.info(f"Wallet created with initial balance of {settings.initial_wallet_balance} for user ID: {user_id}")
        return wallet
    
    #not used
    def get_or_create_wallet(self, user_id: int) -> Wallet:
        """Get existing wallet or create one with bonus if it doesn't exist.
        
        Args:
            user_id: The user ID
            
        Returns:
            The user's wallet (existing or newly created)
        """
        self.logger.debug(f"Getting or creating wallet for user ID: {user_id}")
        
        # Try to find existing wallet
        wallet = self.wallet_repository.find_by_user_id(user_id)
        
        if wallet:
            self.logger.debug(f"Found existing wallet for user ID: {user_id}")
            return wallet
        
        # Create new wallet with bonus
        self.logger.info(f"No wallet found, creating new wallet with bonus for user ID: {user_id}")
        return self.create_wallet_with_bonus(user_id)
    
    def get_wallet_balance(self, user_id: int) -> WalletOut:
        """Get wallet balance information for a user.
        
        Args:
            user_id: The user ID
            
        Returns:
            WalletOut with balance information
        """
        self.logger.debug(f"Getting wallet balance for user ID: {user_id}")
        
        wallet = self.get_or_create_wallet(user_id)
        
        return WalletOut(
            balance=str(wallet.balance),
            reserved=str(wallet.reserved),
            currency=wallet.currency
        )
    
    def find_wallet_by_user_id(self, user_id: int) -> Optional[Wallet]:
        """Find wallet by user ID.
        
        Args:
            user_id: The user ID
            
        Returns:
            Wallet if found, None otherwise
        """
        self.logger.debug(f"Finding wallet for user ID: {user_id}")
        return self.wallet_repository.find_by_user_id(user_id)
    
    #not used currently
    def update_wallet_balance(self, wallet_id: int, new_balance: Decimal, reserved: Decimal = None) -> Wallet:
        """Update wallet balance.
        
        Args:
            wallet_id: The wallet ID
            new_balance: New balance amount
            reserved: New reserved amount (optional)
            
        Returns:
            Updated wallet
        """
        self.logger.info(f"Updating wallet balance for wallet ID: {wallet_id}")
        
        wallet = self.wallet_repository.find_by_id(wallet_id)
        if not wallet:
            raise ValueError(f"Wallet with ID {wallet_id} not found")
        
        wallet.balance = new_balance
        if reserved is not None:
            wallet.reserved = reserved
        wallet.updated_at = now_utc()
        
        return self.wallet_repository.update(wallet)


    #not used
    def add_transaction(self, wallet_id: int, user_id: int, transaction_type: str, 
                       amount: Decimal, reference_id: str, meta: dict = None) -> WalletTransaction:
        """Add a transaction to the wallet.
        
        Args:
            wallet_id: The wallet ID
            user_id: The user ID
            transaction_type: Type of transaction (topup, payment, etc.)
            amount: Transaction amount
            reference_id: Reference ID for the transaction
            meta: Additional metadata
            
        Returns:
            Created transaction
        """
        self.logger.info(f"Adding transaction for wallet ID: {wallet_id}, type: {transaction_type}")
        
        # Get current wallet balance
        wallet = self.wallet_repository.find_by_id(wallet_id)
        if not wallet:
            raise ValueError(f"Wallet with ID {wallet_id} not found")
        
        # Calculate new balance
        if transaction_type == "topup":
            new_balance = wallet.balance + amount
        elif transaction_type == "payment":
            new_balance = wallet.balance - amount
        else:
            new_balance = wallet.balance  # For other types, balance remains same
        
        # Create transaction
        transaction = WalletTransaction(
            wallet_id=wallet_id,
            user_id=user_id,
            type=transaction_type,
            amount=amount,
            balance_after=new_balance,
            reference_id=reference_id,
            meta=meta or {},
            created_at=now_utc()
        )
        
        transaction = self.transaction_repository.create(transaction)
        
        # Update wallet balance
        wallet.balance = new_balance
        wallet.updated_at = now_utc()
        
        self.wallet_repository.update(wallet)
        
        self.logger.info(f"Transaction added successfully for wallet ID: {wallet_id}")
        return transaction
