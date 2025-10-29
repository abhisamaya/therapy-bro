"""User repository for data access operations."""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import User
import logging


class UserRepository:
    """Repository for User data access operations."""
    
    def __init__(self, db_session: Session):
        """Initialize repository with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        self.db = db_session
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def create(self, user: User) -> User:
        """Create a new user in the database.
        
        Args:
            user: User object to create
            
        Returns:
            Created user with ID
        """
        self.logger.debug(f"Creating user: {user.login_id}")
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        self.logger.info(f"Created user: {user.login_id} (ID: {user.id})")
        return user
    
    def find_by_id(self, user_id: int) -> Optional[User]:
        """Find user by ID.
        
        Args:
            user_id: User ID to find
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by ID: {user_id}")
        user = self.db.get(User, user_id)
        self.logger.debug(f"{'Found' if user else 'Not found'} user with ID: {user_id}")
        return user
    
    def find_by_login_id(self, login_id: str) -> Optional[User]:
        """Find user by login ID.
        
        Args:
            login_id: User's login ID
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by login_id: {login_id}")
        query = select(User).where(User.login_id == login_id)
        user = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if user else 'Not found'} user with login_id: {login_id}")
        return user
    
    def find_by_google_id(self, google_id: str) -> Optional[User]:
        """Find user by Google ID.
        
        Args:
            google_id: User's Google ID
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by google_id: {google_id}")
        query = select(User).where(User.google_id == google_id)
        user = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if user else 'Not found'} user with google_id: {google_id}")
        return user
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email.

        Args:
            email: User's email address

        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by email: {email}")
        query = select(User).where(User.email == email)
        user = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if user else 'Not found'} user with email: {email}")
        return user

    def find_by_phone(self, phone: str) -> Optional[User]:
        """Find user by phone number.

        Args:
            phone: User's phone number

        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by phone: {phone}")
        query = select(User).where(User.phone == phone)
        user = self.db.execute(query).scalar_one_or_none()
        self.logger.debug(f"{'Found' if user else 'Not found'} user with phone: {phone}")
        return user

    def update(self, user: User) -> User:
        """Update an existing user.
        
        Args:
            user: User object to update
            
        Returns:
            Updated user
        """
        self.logger.debug(f"Updating user: {user.login_id} (ID: {user.id})")
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        self.logger.info(f"Updated user: {user.login_id} (ID: {user.id})")
        return user
    
    def delete(self, user_id: int) -> bool:
        """Delete user by ID.
        
        Args:
            user_id: User ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        self.logger.debug(f"Deleting user with ID: {user_id}")
        user = self.find_by_id(user_id)
        if not user:
            self.logger.warning(f"Cannot delete user with ID: {user_id} - not found")
            return False
        self.db.delete(user)
        self.db.commit()
        self.logger.info(f"Deleted user: {user.login_id} (ID: {user_id})")
        return True
    
    def find_all(self, limit: Optional[int] = None, offset: int = 0) -> List[User]:
        """Find all users with pagination.
        
        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
            
        Returns:
            List of users
        """
        self.logger.debug(f"Finding all users (limit: {limit}, offset: {offset})")
        query = select(User).order_by(User.id.asc())
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        users = self.db.execute(query).scalars().all()
        self.logger.debug(f"Found {len(users)} users")
        return users
