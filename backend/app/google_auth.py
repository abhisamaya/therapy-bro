from __future__ import annotations
import os
from google.auth.transport import requests
from google.oauth2 import id_token
from typing import Optional, Dict, Any
from fastapi import HTTPException

class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID environment variable is required")
    
    def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token and return user info"""
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), self.client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name'),
                'avatar_url': idinfo.get('picture'),
                'email_verified': idinfo.get('email_verified', False)
            }
        except ValueError as e:
            print(f"Token verification failed: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error during token verification: {e}")
            return None

google_auth_service = GoogleAuthService()