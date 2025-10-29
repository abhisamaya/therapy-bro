"""User service for managing user operations."""
from typing import Optional, Union
from sqlalchemy.orm import Session
from app.models import User
from app.schemas import RegisterIn, UpdateProfileIn, UserOut
from app.services.base_service import BaseService
from app.services.wallet_service import WalletService
from app.repositories.user_repository import UserRepository
from app.utils import hash_password, verify_password, now_utc
from app.exceptions import (
    UserNotFoundError, AuthenticationError, DuplicateResourceError, 
    ValidationError, AuthorizationError
)


class UserService(BaseService):
    """Service for user operations."""
    
    def __init__(self, db_session: Session):
        """Initialize service with database session.
        
        Args:
            db_session: SQLAlchemy database session
        """
        super().__init__(db_session)
        self.user_repository = UserRepository(db_session)
    
    def create_user(self, user_data: RegisterIn) -> User:
        """Create a new user with wallet.

        Args:
            user_data: Registration data

        Returns:
            The created user

        Raises:
            DuplicateResourceError: If login_id, email, or phone already exists
            ValidationError: If validation fails
        """
        self.logger.info(f"Creating new user: {user_data.login_id}")

        # Validate input data
        self._validate_user_data(user_data)

        # Check if user already exists by login_id
        existing_user = self.user_repository.find_by_login_id(user_data.login_id)
        if existing_user:
            self.logger.warning(f"Registration failed - login_id already exists: {user_data.login_id}")
            raise DuplicateResourceError("User", "login_id", user_data.login_id)

        # If login_id is an email, also populate the email field
        email = user_data.login_id if '@' in user_data.login_id else None

        # Check if email already exists (if email is provided)
        if email:
            existing_email_user = self.user_repository.find_by_email(email)
            if existing_email_user:
                self.logger.warning(f"Registration failed - email already exists: {email}")
                raise DuplicateResourceError("User", "email", email)

        # Check if phone already exists (if phone is provided)
        if user_data.phone and user_data.phone.strip():
            existing_phone_user = self.user_repository.find_by_phone(user_data.phone)
            if existing_phone_user:
                self.logger.warning(f"Registration failed - phone number already exists: {user_data.phone}")
                raise DuplicateResourceError("User", "phone", user_data.phone)

        user = User(
            login_id=user_data.login_id,
            email=email,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
            phone=user_data.phone,
            age=user_data.age,
            created_at=now_utc(),
        )

        created_user = self.user_repository.create(user)
        self.logger.info(f"User created successfully: {created_user.login_id} (ID: {created_user.id})")

        # Create wallet with initial balance
        self.logger.info(f"Creating wallet for new user: {created_user.login_id}")
        wallet_service = WalletService(self.db)
        wallet = wallet_service.create_wallet_with_bonus(created_user.id)
        self.logger.info(f"Wallet created with initial balance of {wallet.balance} for user: {created_user.login_id}")

        return created_user
    
    def authenticate_user(self, login_id: str, password: str) -> User:
        """Authenticate a user with login credentials.
        
        Args:
            login_id: User's login ID
            password: User's password
            
        Returns:
            User if authentication successful
            
        Raises:
            UserNotFoundError: If user not found
            AuthenticationError: If password is invalid
        """
        self.logger.info(f"Authenticating user: {login_id}")
        
        user = self.user_repository.find_by_login_id(login_id)
        if not user:
            self.logger.warning(f"Authentication failed - user not found: {login_id}")
            raise UserNotFoundError(login_id=login_id)
        
        if not verify_password(password, user.password_hash):
            self.logger.warning(f"Authentication failed - invalid password for: {login_id}")
            raise AuthenticationError("Invalid password", login_id)
        
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
            DuplicateResourceError: If phone number already exists
        """
        self.logger.info(f"Updating profile for user ID: {user_id}")
        self.logger.debug(f"Payload: name={profile_data.name}, phone={profile_data.phone}, age={profile_data.age}")

        user = self.user_repository.find_by_id(user_id)
        if not user:
            self.logger.warning(f"User not found with ID: {user_id}")
            raise ValueError("User not found")

        self.logger.debug(f"Found user: {user.login_id}")

        # Validate the profile data before updating
        self._validate_user_data(profile_data)

        # Check phone uniqueness if being updated
        if profile_data.phone is not None and profile_data.phone.strip() != "":
            if profile_data.phone != user.phone:
                existing_phone_user = self.user_repository.find_by_phone(profile_data.phone)
                if existing_phone_user and existing_phone_user.id != user_id:
                    self.logger.warning(f"Update failed - phone number already exists: {profile_data.phone}")
                    raise DuplicateResourceError("User", "phone", profile_data.phone)

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

        updated_user = self.user_repository.update(user)
        self.logger.info(f"Profile updated successfully for user: {updated_user.login_id}")

        return updated_user
    
    def find_by_login_id(self, login_id: str) -> Optional[User]:
        """Find user by login ID.
        
        Args:
            login_id: User's login ID
            
        Returns:
            User if found, None otherwise
        """
        return self.user_repository.find_by_login_id(login_id)
    
    def find_by_google_id(self, google_id: str) -> Optional[User]:
        """Find user by Google ID.
        
        Args:
            google_id: User's Google ID
            
        Returns:
            User if found, None otherwise
        """
        return self.user_repository.find_by_google_id(google_id)
    
    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email.
        
        Args:
            email: User's email address
            
        Returns:
            User if found, None otherwise
        """
        return self.user_repository.find_by_email(email)
    
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
        
        updated_user = self.user_repository.update(user)
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
            created_at=now_utc(),
        )
        
        created_user = self.user_repository.create(user)
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
    
    def _validate_user_data(self, user_data: Union[RegisterIn, UpdateProfileIn, User]) -> None:
        """Validate user data (registration, profile update, or user object).
        
        Args:
            user_data: Registration data, profile update data, or user object to validate
            
        Raises:
            ValidationError: If validation fails
        """
        import re
        
        # Handle different input types
        if isinstance(user_data, RegisterIn):
            # Registration validation
            if not user_data.login_id or len(user_data.login_id.strip()) < 3:
                raise ValidationError("Login ID must be at least 3 characters long", "login_id", user_data.login_id)
            
            if not user_data.password or len(user_data.password) < 6:
                raise ValidationError("Password must be at least 6 characters long", "password")
            
            if not user_data.name or len(user_data.name.strip()) < 2:
                raise ValidationError("Name must be at least 2 characters long", "name", user_data.name)
                
        elif isinstance(user_data, UpdateProfileIn):
            # Profile update validation
            if user_data.name is not None and user_data.name.strip() == "":
                raise ValidationError("Name cannot be empty", "name", user_data.name)
                
        elif isinstance(user_data, User):
            # User object validation
            if user_data.name and len(user_data.name.strip()) < 2:
                raise ValidationError("Name must be at least 2 characters long", "name", user_data.name)
        
        # Common validation for phone and age
        phone_value = getattr(user_data, 'phone', None)
        age_value = getattr(user_data, 'age', None)
        
        # Validate phone format if provided
        if phone_value and phone_value.strip() != "":
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,}$'
            if not re.match(phone_pattern, phone_value):
                raise ValidationError("Invalid phone number format", "phone", phone_value)
        
        # Validate age if provided
        if age_value is not None:
            if age_value < 13 or age_value > 120:
                raise ValidationError("Age must be between 13 and 120", "age", age_value)
