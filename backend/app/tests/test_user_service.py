"""Tests for user service."""
import pytest
from app.services.user_service import UserService
from app.models import User
from app.schemas import RegisterIn, UpdateProfileIn, UserOut
from datetime import date, datetime
from app.exceptions import DuplicateResourceError, AuthenticationError, UserNotFoundError


class TestUserService:
    """Test cases for UserService."""
    
    def test_create_user(self, db_session):
        """Test creating a new user."""
        user_service = UserService(db_session)
        
        # Create user data
        user_data = RegisterIn(
            login_id="test_user_123",
            password="test_password",
            name="Test User",
            phone="1234567890",
            date_of_birth=date.today().replace(year=date.today().year - 25)
        )
        
        # Create user
        user = user_service.create_user(user_data)
        
        # Verify user was created
        assert user is not None
        assert user.login_id == "test_user_123"
        assert user.name == "Test User"
        assert user.phone == "1234567890"
        expected_dob = date.today().replace(year=date.today().year - 25)
        if isinstance(user.date_of_birth, datetime):
            assert user.date_of_birth.date() == expected_dob
        else:
            assert user.date_of_birth == expected_dob
        assert user.password_hash is not None
        assert user.password_hash != "test_password"  # Should be hashed
        
        # Verify user exists in database
        found_user = user_service.find_by_login_id("test_user_123")
        assert found_user is not None
        assert found_user.id == user.id
    
    def test_create_user_duplicate_login_id(self, db_session):
        """Test creating user with duplicate login_id."""
        user_service = UserService(db_session)
        
        # Create first user
        user_data = RegisterIn(
            login_id="duplicate_user",
            password="password1",
            name="User 1",
            phone="1111111111",
            date_of_birth=date.today().replace(year=date.today().year - 25)
        )
        user_service.create_user(user_data)
        
        # Try to create second user with same login_id
        user_data2 = RegisterIn(
            login_id="duplicate_user",
            password="password2",
            name="User 2",
            phone="2222222222",
            date_of_birth=date.today().replace(year=date.today().year - 30)
        )
        
        with pytest.raises(DuplicateResourceError, match="User with login_id 'duplicate_user' already exists"):
            user_service.create_user(user_data2)
    
    def test_authenticate_user_success(self, db_session):
        """Test successful user authentication."""
        user_service = UserService(db_session)
        
        # Create user
        user_data = RegisterIn(
            login_id="auth_user",
            password="correct_password",
            name="Auth User",
            phone="3333333333",
            date_of_birth=date.today().replace(year=date.today().year - 28)
        )
        user_service.create_user(user_data)
        
        # Authenticate user
        authenticated_user = user_service.authenticate_user("auth_user", "correct_password")
        
        # Verify authentication
        assert authenticated_user is not None
        assert authenticated_user.login_id == "auth_user"
        assert authenticated_user.name == "Auth User"
    
    def test_authenticate_user_wrong_password(self, db_session):
        """Test authentication with wrong password."""
        user_service = UserService(db_session)
        
        # Create user
        user_data = RegisterIn(
            login_id="wrong_pass_user",
            password="correct_password",
            name="Wrong Pass User",
            phone="4444444444",
            date_of_birth=date.today().replace(year=date.today().year - 30)
        )
        user_service.create_user(user_data)
        
        # Try to authenticate with wrong password
        with pytest.raises(AuthenticationError, match="Invalid password"):
            user_service.authenticate_user("wrong_pass_user", "wrong_password")
    
    def test_authenticate_user_not_found(self, db_session):
        """Test authentication for non-existent user."""
        user_service = UserService(db_session)
        
        # Try to authenticate non-existent user
        with pytest.raises(UserNotFoundError, match="User with login_id 'nonexistent_user' not found"):
            user_service.authenticate_user("nonexistent_user", "password")
    
    def test_update_user_profile(self, db_session, test_user):
        """Test updating user profile."""
        user_service = UserService(db_session)
        
        # Update profile data
        new_dob = date.today().replace(year=date.today().year - 35)
        profile_data = UpdateProfileIn(
            name="Updated Name",
            phone="9999999999",
            date_of_birth=new_dob
        )
        
        # Update profile
        updated_user = user_service.update_user_profile(test_user.id, profile_data)
        
        # Verify updates
        assert updated_user.name == "Updated Name"
        assert updated_user.phone == "9999999999"
        if isinstance(updated_user.date_of_birth, datetime):
            assert updated_user.date_of_birth.date() == new_dob
        else:
            assert updated_user.date_of_birth == new_dob
        assert updated_user.login_id == test_user.login_id  # Should not change
    
    def test_update_user_profile_partial(self, db_session, test_user):
        """Test updating user profile with partial data."""
        user_service = UserService(db_session)
        
        # Update only name
        profile_data = UpdateProfileIn(
            name="Partial Update",
            phone=None,  # Not provided
            date_of_birth=None    # Not provided
        )
        
        # Update profile
        updated_user = user_service.update_user_profile(test_user.id, profile_data)
        
        # Verify only name was updated
        assert updated_user.name == "Partial Update"
        assert updated_user.phone == test_user.phone  # Should remain unchanged
        assert updated_user.date_of_birth == test_user.date_of_birth      # Should remain unchanged
    
    def test_update_user_profile_not_found(self, db_session):
        """Test updating profile for non-existent user."""
        user_service = UserService(db_session)
        
        profile_data = UpdateProfileIn(
            name="Updated Name",
            phone="9999999999",
            date_of_birth=date.today().replace(year=date.today().year - 35)
        )
        
        with pytest.raises(ValueError, match="User not found"):
            user_service.update_user_profile(999, profile_data)
    
    def test_find_by_login_id(self, db_session, test_user):
        """Test finding user by login_id."""
        user_service = UserService(db_session)
        
        # Find user
        found_user = user_service.find_by_login_id(test_user.login_id)
        
        # Verify user found
        assert found_user is not None
        assert found_user.id == test_user.id
        assert found_user.login_id == test_user.login_id
    
    def test_find_by_login_id_not_found(self, db_session):
        """Test finding user by non-existent login_id."""
        user_service = UserService(db_session)
        
        # Try to find non-existent user
        found_user = user_service.find_by_login_id("nonexistent_login")
        
        # Verify user not found
        assert found_user is None
    
    def test_find_by_google_id(self, db_session):
        """Test finding user by Google ID."""
        user_service = UserService(db_session)
        
        # Create user with Google ID
        user = User(
            login_id="google_user@example.com",
            email="google_user@example.com",
            name="Google User",
            google_id="google_123456",
            auth_provider="google"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Find user by Google ID
        found_user = user_service.find_by_google_id("google_123456")
        
        # Verify user found
        assert found_user is not None
        assert found_user.id == user.id
        assert found_user.google_id == "google_123456"
    
    def test_find_by_email(self, db_session):
        """Test finding user by email."""
        user_service = UserService(db_session)
        
        # Create user with email
        user = User(
            login_id="email_user",
            email="email_user@example.com",
            name="Email User",
            auth_provider="local"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Find user by email
        found_user = user_service.find_by_email("email_user@example.com")
        
        # Verify user found
        assert found_user is not None
        assert found_user.id == user.id
        assert found_user.email == "email_user@example.com"
    
    def test_link_google_account(self, db_session, test_user):
        """Test linking Google account to existing user."""
        user_service = UserService(db_session)
        
        # Clear the name to test the name update logic
        test_user.name = None
        db_session.commit()
        
        google_user_info = {
            'google_id': 'google_789',
            'name': 'Google Name',
            'avatar_url': 'https://example.com/avatar.jpg'
        }
        
        # Link Google account
        linked_user = user_service.link_google_account(test_user, google_user_info)
        
        # Verify Google account linked
        assert linked_user.google_id == 'google_789'
        assert linked_user.auth_provider == 'google'
        assert linked_user.avatar_url == 'https://example.com/avatar.jpg'
        assert linked_user.name == 'Google Name'  # Should update if not set
    
    def test_create_google_user(self, db_session):
        """Test creating new user from Google authentication."""
        user_service = UserService(db_session)
        
        google_user_info = {
            'google_id': 'google_new_user',
            'email': 'newuser@example.com',
            'name': 'New Google User',
            'avatar_url': 'https://example.com/new_avatar.jpg'
        }
        
        # Create Google user
        google_user = user_service.create_google_user(google_user_info)
        
        # Verify user created
        assert google_user is not None
        assert google_user.login_id == 'newuser@example.com'
        assert google_user.email == 'newuser@example.com'
        assert google_user.name == 'New Google User'
        assert google_user.google_id == 'google_new_user'
        assert google_user.auth_provider == 'google'
        assert google_user.avatar_url == 'https://example.com/new_avatar.jpg'
    
    def test_get_user_profile(self, db_session, test_user):
        """Test getting user profile information."""
        user_service = UserService(db_session)
        
        # Get user profile
        profile = user_service.get_user_profile(test_user)
        
        # Verify profile data
        assert isinstance(profile, UserOut)
        assert profile.login_id == test_user.login_id
        assert profile.name == test_user.name
        assert profile.email == test_user.email
        assert profile.avatar_url == test_user.avatar_url
        assert profile.auth_provider == test_user.auth_provider
        assert profile.phone == test_user.phone
        if isinstance(profile.date_of_birth, datetime) and isinstance(test_user.date_of_birth, datetime):
            assert profile.date_of_birth.date() == test_user.date_of_birth.date()
        elif isinstance(profile.date_of_birth, date) and isinstance(test_user.date_of_birth, datetime):
            assert profile.date_of_birth == test_user.date_of_birth.date()
        else:
            assert profile.date_of_birth == test_user.date_of_birth
