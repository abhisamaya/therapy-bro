"""User service for managing user operations."""
from typing import Optional
from sqlalchemy.orm import Session
from app.models import User
from app.schemas import RegisterIn, UpdateProfileIn, UserOut
from app.services.base_service import BaseService
from app.services.wallet_service import WalletService
from app.utils import hash_password, verify_password, now_ist


class UserService(BaseService):
    """Service for user operations."""
    
    def create_user(self, user_data: RegisterIn) -> User:
        """Create a new user with wallet.
        
        Args:
            user_data: Registration data
            
        Returns:
            The created user
            
        Raises:
            ValueError: If login_id already exists
        """
        self.logger.info(f"Creating new user: {user_data.login_id}")
        
        # Check if user already exists
        existing_user = self.find_by_login_id(user_data.login_id)
        if existing_user:
            self.logger.warning(f"Registration failed - login_id already exists: {user_data.login_id}")
            raise ValueError("login_id already exists")
        
        # Create user
        user = User(
            login_id=user_data.login_id,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
            phone=user_data.phone,
            age=user_data.age,
            created_at=now_ist(),
        )
        
        created_user = self.create(user)
        self.logger.info(f"User created successfully: {created_user.login_id} (ID: {created_user.id})")
        
        # Create wallet with initial balance
        self.logger.info(f"Creating wallet for new user: {created_user.login_id}")
        wallet_service = WalletService(self.db)
        wallet = wallet_service.create_wallet_with_bonus(created_user.id)
        self.logger.info(f"Wallet created with initial balance of {wallet.balance} for user: {created_user.login_id}")
        
        return created_user
    
    def authenticate_user(self, login_id: str, password: str) -> Optional[User]:
        """Authenticate a user with login credentials.
        
        Args:
            login_id: User's login ID
            password: User's password
            
        Returns:
            User if authentication successful, None otherwise
        """
        self.logger.info(f"Authenticating user: {login_id}")
        
        user = self.find_by_login_id(login_id)
        if not user:
            self.logger.warning(f"Authentication failed - user not found: {login_id}")
            return None
        
        if not verify_password(password, user.password_hash):
            self.logger.warning(f"Authentication failed - invalid password for: {login_id}")
            return None
        
        self.logger.info(f"Authentication successful for: {login_id}")
        return user
    
    def update_user_profile(self, user_id: int, profile_data: UpdateProfileIn) -> User:
        """Update user profile information.
        
        Args:
            user_id: User ID to update
            profile_data: Profile update data
            
        Returns:
            Updated user
            
        Raises:
            ValueError: If user not found
        """
        self.logger.info(f"Updating profile for user ID: {user_id}")
        self.logger.debug(f"Payload: name={profile_data.name}, phone={profile_data.phone}, age={profile_data.age}")
        
        user = self.get_by_id(User, user_id)
        if not user:
            self.logger.warning(f"User not found with ID: {user_id}")
            raise ValueError("User not found")
        
        self.logger.debug(f"Found user: {user.login_id}")
        
        # Update only provided fields (email/login_id cannot be changed)
        if profile_data.name is not None and profile_data.name != "":
            self.logger.debug(f"Updating name: {user.name} -> {profile_data.name}")
            user.name = profile_data.name
        if profile_data.phone is not None and profile_data.phone != "":
            self.logger.debug(f"Updating phone: {user.phone} -> {profile_data.phone}")
            user.phone = profile_data.phone
        if profile_data.age is not None:
            self.logger.debug(f"Updating age: {user.age} -> {profile_data.age}")
            user.age = profile_data.age
        
        updated_user = self.update(user)
        self.logger.info(f"Profile updated successfully for user: {updated_user.login_id}")
        
        return updated_user
    
    def find_by_login_id(self, login_id: str) -> Optional[User]:
        """Find user by login ID.
        
        Args:
            login_id: User's login ID
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by login_id: {login_id}")
        return self.find_one_by_criteria(User, login_id=login_id)
    
    def find_by_google_id(self, google_id: str) -> Optional[User]:
        """Find user by Google ID.
        
        Args:
            google_id: User's Google ID
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by google_id: {google_id}")
        return self.find_one_by_criteria(User, google_id=google_id)
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email.
        
        Args:
            email: User's email address
            
        Returns:
            User if found, None otherwise
        """
        self.logger.debug(f"Finding user by email: {email}")
        return self.find_one_by_criteria(User, email=email)
    
    def link_google_account(self, user: User, google_user_info: dict) -> User:
        """Link Google account to existing user.
        
        Args:
            user: Existing user to link
            google_user_info: Google user information
            
        Returns:
            Updated user with Google account linked
        """
        self.logger.info(f"Linking Google account to user: {user.login_id}")
        
        # Link Google account to existing user
        user.google_id = google_user_info['google_id']
        user.auth_provider = "google"
        user.avatar_url = google_user_info['avatar_url']
        if not user.name:
            user.name = google_user_info['name']
        
        updated_user = self.update(user)
        self.logger.info(f"Google account linked successfully for user: {updated_user.login_id}")
        
        return updated_user
    
    def create_google_user(self, google_user_info: dict) -> User:
        """Create a new user from Google authentication.
        
        Args:
            google_user_info: Google user information
            
        Returns:
            Created user
        """
        self.logger.info(f"Creating new Google user: {google_user_info['email']}")
        
        user = User(
            login_id=google_user_info['email'],  # Use email as login_id for Google users
            email=google_user_info['email'],
            name=google_user_info['name'],
            avatar_url=google_user_info['avatar_url'],
            google_id=google_user_info['google_id'],
            auth_provider="google",
            created_at=now_ist(),
        )
        
        created_user = self.create(user)
        self.logger.info(f"Google user created successfully: {created_user.login_id} (ID: {created_user.id})")
        
        # Create wallet with initial balance
        self.logger.info(f"Creating wallet for new Google user: {created_user.login_id}")
        wallet_service = WalletService(self.db)
        wallet = wallet_service.create_wallet_with_bonus(created_user.id)
        self.logger.info(f"Wallet created with initial balance of {wallet.balance} for user: {created_user.login_id}")
        
        return created_user
    
    def get_user_profile(self, user: User) -> UserOut:
        """Get user profile information.
        
        Args:
            user: User object
            
        Returns:
            UserOut with profile information
        """
        self.logger.debug(f"Getting profile for user: {user.login_id}")
        
        return UserOut(
            login_id=user.login_id,
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            auth_provider=user.auth_provider,
            phone=user.phone,
            age=user.age
        )
