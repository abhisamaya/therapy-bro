"""Wallet repository for data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Wallet, WalletTransaction
import logging


class WalletRepository:
    """Repository for Wallet data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, wallet: Wallet) -> Wallet:
        """Create a new wallet in the database.
        
        Args:
            wallet: Wallet object to create
            
        Returns:
            Created wallet with ID
        """
        self.logger.debug(f"Creating wallet for user_id: {wallet.user_id}")
        self.db.add(wallet)
        self.db.commit()
        self.db.refresh(wallet)
        self.logger.info(f"Created wallet for user_id: {wallet.user_id} (ID: {wallet.id})")
        return wallet
    
    def find_by_id(self, wallet_id: int) -> Optional[Wallet]:
        """Find wallet by ID.
        
        Args:
            wallet_id: Wallet ID to find
            
        Returns:
            Wallet if found, None otherwise
        """
        self.logger.debug(f"Finding wallet by ID: {wallet_id}")
        wallet = self.db.get(Wallet, wallet_id)
        self.logger.debug(f"{'Found' if wallet else 'Not found'} wallet with ID: {wallet_id}")
        return wallet
    
    def find_by_user_id(self, user_id: int) -> Optional[Wallet]:
        """Find wallet by user ID.
        
        Args:
            user_id: User ID to find wallet for
            
        Returns:
            Wallet if found, None otherwise
        """
        self.logger.debug(f"Finding wallet for user_id: {user_id}")
        query = select(Wallet).where(Wallet.user_id == user_id)
        wallet = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if wallet else 'Not found'} wallet for user_id: {user_id}")
        return wallet
    
    def update(self, wallet: Wallet) -> Wallet:
        """Update an existing wallet.
        
        Args:
            wallet: Wallet object to update
            
        Returns:
            Updated wallet
        """
        self.logger.debug(f"Updating wallet: {wallet.id} for user_id: {wallet.user_id}")
        self.db.add(wallet)
        self.db.commit()
        self.db.refresh(wallet)
        self.logger.info(f"Updated wallet: {wallet.id} for user_id: {wallet.user_id}")
        return wallet
    
    def delete(self, wallet_id: int) -> bool:
        """Delete wallet by ID.
        
        Args:
            wallet_id: Wallet ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting wallet with ID: {wallet_id}")
        wallet = self.find_by_id(wallet_id)
        if not wallet:
            self.logger.warning(f"Cannot delete wallet with ID: {wallet_id} - not found")
            return False
        self.db.delete(wallet)
        self.db.commit()
        self.logger.info(f"Deleted wallet: {wallet_id}")
        return True
    
    def find_all(self, limit: Optional[int] = None, offset: int = 0) -> List[Wallet]:
        """Find all wallets with pagination.
        
        Args:
            limit: Maximum number of wallets to return
            offset: Number of wallets to skip
            
        Returns:
            List of Wallet objects
        """
        self.logger.debug(f"Finding all wallets (limit: {limit}, offset: {offset})")
        query = select(Wallet).order_by(Wallet.id.asc())
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        wallets = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(wallets)} wallets")
        return wallets


class TransactionRepository:
    """Repository for WalletTransaction data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, transaction: WalletTransaction) -> WalletTransaction:
        """Create a new transaction in the database.
        
        Args:
            transaction: WalletTransaction object to create
            
        Returns:
            Created transaction with ID
        """
        self.logger.debug(f"Creating transaction for wallet_id: {transaction.wallet_id}")
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        self.logger.info(f"Created transaction: {transaction.type} (ID: {transaction.id})")
        return transaction
    
    def find_by_id(self, transaction_id: int) -> Optional[WalletTransaction]:
        """Find transaction by ID.
        
        Args:
            transaction_id: Transaction ID to find
            
        Returns:
            WalletTransaction if found, None otherwise
        """
        self.logger.debug(f"Finding transaction by ID: {transaction_id}")
        transaction = self.db.get(WalletTransaction, transaction_id)
        self.logger.debug(f"{'Found' if transaction else 'Not found'} transaction with ID: {transaction_id}")
        return transaction
    
    def find_by_wallet_id(self, wallet_id: int) -> List[WalletTransaction]:
        """Find all transactions for a wallet.
        
        Args:
            wallet_id: Wallet ID to find transactions for
            
        Returns:
            List of WalletTransaction objects ordered by creation time
        """
        self.logger.debug(f"Finding transactions for wallet_id: {wallet_id}")
        query = select(WalletTransaction).where(WalletTransaction.wallet_id == wallet_id).order_by(WalletTransaction.id.asc())
        transactions = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(transactions)} transactions for wallet_id: {wallet_id}")
        return transactions
    
    def find_by_reference_id(self, reference_id: str) -> Optional[WalletTransaction]:
        """Find transaction by reference ID.
        
        Args:
            reference_id: Reference ID to find transaction for
            
        Returns:
            WalletTransaction if found, None otherwise
        """
        self.logger.debug(f"Finding transaction by reference_id: {reference_id}")
        query = select(WalletTransaction).where(WalletTransaction.reference_id == reference_id)
        transaction = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if transaction else 'Not found'} transaction with reference_id: {reference_id}")
        return transaction
    
    def update(self, transaction: WalletTransaction) -> WalletTransaction:
        """Update an existing transaction.
        
        Args:
            transaction: WalletTransaction object to update
            
        Returns:
            Updated transaction
        """
        self.logger.debug(f"Updating transaction: {transaction.type} (ID: {transaction.id})")
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        self.logger.info(f"Updated transaction: {transaction.type} (ID: {transaction.id})")
        return transaction
    
    def delete(self, transaction_id: int) -> bool:
        """Delete transaction by ID.
        
        Args:
            transaction_id: Transaction ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting transaction with ID: {transaction_id}")
        transaction = self.find_by_id(transaction_id)
        if not transaction:
            self.logger.warning(f"Cannot delete transaction with ID: {transaction_id} - not found")
            return False
        self.db.delete(transaction)
        self.db.commit()
        self.logger.info(f"Deleted transaction: {transaction.type} (ID: {transaction_id})")
        return True
    
    def find_all(self, limit: Optional[int] = None, offset: int = 0) -> List[WalletTransaction]:
        """Find all transactions with pagination.
        
        Args:
            limit: Maximum number of transactions to return
            offset: Number of transactions to skip
            
        Returns:
            List of WalletTransaction objects
        """
        self.logger.debug(f"Finding all transactions (limit: {limit}, offset: {offset})")
        query = select(WalletTransaction).order_by(WalletTransaction.id.asc())
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        transactions = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(transactions)} transactions")
        return transactions
