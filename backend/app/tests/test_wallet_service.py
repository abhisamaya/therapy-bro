"""Tests for wallet service."""
import pytest
from decimal import Decimal
from app.services.wallet_service import WalletService
from app.models import Wallet, WalletTransaction, User
from app.schemas import WalletOut


class TestWalletService:
    """Test cases for WalletService."""
    
    def test_create_wallet_with_bonus(self, db_session, test_user):
        """Test creating a wallet with initial bonus."""
        wallet_service = WalletService(db_session)
        
        # Create wallet with bonus
        wallet = wallet_service.create_wallet_with_bonus(test_user.id)
        
        # Verify wallet was created
        assert wallet is not None
        assert wallet.user_id == test_user.id
        assert wallet.balance == Decimal("200.0000")
        assert wallet.reserved == Decimal("0.0000")
        assert wallet.currency == "INR"
        
        # Verify transaction was created
        from sqlalchemy import select
        transactions = db_session.execute(
            select(WalletTransaction).where(WalletTransaction.wallet_id == wallet.id)
        ).scalars().all()
        assert len(transactions) == 1
        assert transactions[0].type == "topup"
        assert transactions[0].amount == Decimal("200.0000")
        assert transactions[0].reference_id == "initial_signup_bonus"
    
    def test_get_or_create_wallet_existing(self, db_session, test_user, test_wallet):
        """Test getting existing wallet."""
        wallet_service = WalletService(db_session)
        
        # Get existing wallet
        wallet = wallet_service.get_or_create_wallet(test_user.id)
        
        # Should return the existing wallet
        assert wallet.id == test_wallet.id
        assert wallet.user_id == test_user.id
    
    def test_get_or_create_wallet_new(self, db_session, test_user):
        """Test creating new wallet when none exists."""
        wallet_service = WalletService(db_session)
        
        # Create new wallet
        wallet = wallet_service.get_or_create_wallet(test_user.id)
        
        # Verify wallet was created
        assert wallet is not None
        assert wallet.user_id == test_user.id
        assert wallet.balance == Decimal("200.0000")
    
    def test_get_wallet_balance(self, db_session, test_user, test_wallet):
        """Test getting wallet balance."""
        wallet_service = WalletService(db_session)
        
        # Get wallet balance
        wallet_out = wallet_service.get_wallet_balance(test_user.id)
        
        # Verify balance information
        assert isinstance(wallet_out, WalletOut)
        assert wallet_out.balance == "200.0000"
        assert wallet_out.reserved == "0.0000"
        assert wallet_out.currency == "INR"
    
    def test_get_wallet_balance_creates_wallet(self, db_session, test_user):
        """Test that getting balance creates wallet if it doesn't exist."""
        wallet_service = WalletService(db_session)
        
        # Get wallet balance (should create wallet)
        wallet_out = wallet_service.get_wallet_balance(test_user.id)
        
        # Verify wallet was created
        assert wallet_out.balance == "200.0000"
        
        # Verify wallet exists in database
        wallet = wallet_service.find_wallet_by_user_id(test_user.id)
        assert wallet is not None
        assert wallet.user_id == test_user.id
    
    def test_find_wallet_by_user_id(self, db_session, test_user, test_wallet):
        """Test finding wallet by user ID."""
        wallet_service = WalletService(db_session)
        
        # Find existing wallet
        wallet = wallet_service.find_wallet_by_user_id(test_user.id)
        
        assert wallet is not None
        assert wallet.id == test_wallet.id
        assert wallet.user_id == test_user.id
    
    def test_find_wallet_by_user_id_not_found(self, db_session):
        """Test finding wallet by user ID when wallet doesn't exist."""
        wallet_service = WalletService(db_session)
        
        # Try to find non-existent wallet
        wallet = wallet_service.find_wallet_by_user_id(999)
        
        assert wallet is None
    
    def test_update_wallet_balance(self, db_session, test_user, test_wallet):
        """Test updating wallet balance."""
        wallet_service = WalletService(db_session)
        
        # Update wallet balance
        new_balance = Decimal("300.0000")
        updated_wallet = wallet_service.update_wallet_balance(
            test_wallet.id, 
            new_balance, 
            reserved=Decimal("50.0000")
        )
        
        # Verify balance was updated
        assert updated_wallet.balance == new_balance
        assert updated_wallet.reserved == Decimal("50.0000")
    
    def test_update_wallet_balance_not_found(self, db_session):
        """Test updating wallet balance when wallet doesn't exist."""
        wallet_service = WalletService(db_session)
        
        # Try to update non-existent wallet
        with pytest.raises(ValueError, match="Wallet with ID 999 not found"):
            wallet_service.update_wallet_balance(999, Decimal("100.0000"))
    
    def test_add_transaction_topup(self, db_session, test_user, test_wallet):
        """Test adding a topup transaction."""
        wallet_service = WalletService(db_session)
        
        # Add topup transaction
        transaction = wallet_service.add_transaction(
            wallet_id=test_wallet.id,
            user_id=test_user.id,
            transaction_type="topup",
            amount=Decimal("100.0000"),
            reference_id="test_topup",
            meta={"reason": "Test topup"}
        )
        
        # Verify transaction was created
        assert transaction.type == "topup"
        assert transaction.amount == Decimal("100.0000")
        assert transaction.balance_after == Decimal("300.0000")  # 200 + 100
        assert transaction.reference_id == "test_topup"
        
        # Verify wallet balance was updated
        updated_wallet = wallet_service.get_by_id(Wallet, test_wallet.id)
        assert updated_wallet.balance == Decimal("300.0000")
    
    def test_add_transaction_payment(self, db_session, test_user, test_wallet):
        """Test adding a payment transaction."""
        wallet_service = WalletService(db_session)
        
        # Add payment transaction
        transaction = wallet_service.add_transaction(
            wallet_id=test_wallet.id,
            user_id=test_user.id,
            transaction_type="payment",
            amount=Decimal("50.0000"),
            reference_id="test_payment",
            meta={"reason": "Test payment"}
        )
        
        # Verify transaction was created
        assert transaction.type == "payment"
        assert transaction.amount == Decimal("50.0000")
        assert transaction.balance_after == Decimal("150.0000")  # 200 - 50
        assert transaction.reference_id == "test_payment"
        
        # Verify wallet balance was updated
        updated_wallet = wallet_service.get_by_id(Wallet, test_wallet.id)
        assert updated_wallet.balance == Decimal("150.0000")
    
    def test_add_transaction_wallet_not_found(self, db_session, test_user):
        """Test adding transaction when wallet doesn't exist."""
        wallet_service = WalletService(db_session)
        
        # Try to add transaction to non-existent wallet
        with pytest.raises(ValueError, match="Wallet with ID 999 not found"):
            wallet_service.add_transaction(
                wallet_id=999,
                user_id=test_user.id,
                transaction_type="topup",
                amount=Decimal("100.0000"),
                reference_id="test"
            )
