from __future__ import annotations
import os
import logging
import traceback
from google.auth.transport import requests
from google.oauth2 import id_token
from typing import Optional, Dict, Any
from fastapi import HTTPException

# Create logger for Google auth
logger = logging.getLogger('google_auth')

class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID environment variable is required")
    
    def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token and return user info"""
        logger.info("--- GOOGLE TOKEN VERIFICATION SERVICE ---")
        logger.debug(f"Client ID configured: {self.client_id[:20]}...{self.client_id[-10:]}")
        logger.debug(f"Token length: {len(token)}")
        logger.debug(f"Token preview: {token[:50]}...")

        try:
            logger.info("Calling Google API to verify token...")
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), self.client_id
            )

            logger.info("Google API returned token info successfully")
            logger.debug(f"Full idinfo from Google: {idinfo}")

            # Verify the issuer
            logger.debug(f"Verifying issuer: {idinfo.get('iss')}")
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                logger.error(f"Invalid issuer: {idinfo['iss']}")
                raise ValueError('Wrong issuer.')

            logger.info("Issuer verified")

            user_info = {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name'),
                'avatar_url': idinfo.get('picture'),
                'email_verified': idinfo.get('email_verified', False)
            }

            logger.info("User info extracted:")
            logger.debug(f"   Google ID: {user_info['google_id']}")
            logger.debug(f"   Email: {user_info['email']}")
            logger.debug(f"   Name: {user_info['name']}")
            logger.debug(f"   Avatar URL: {user_info['avatar_url']}")
            logger.debug(f"   Email Verified: {user_info['email_verified']}")
            logger.info("--- END GOOGLE TOKEN VERIFICATION ---")

            return user_info

        except ValueError as e:
            logger.error(f"Token verification failed (ValueError): {e}")
            logger.error(f"   Error type: {type(e).__name__}")
            logger.error(f"   Stack trace:\n{traceback.format_exc()}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            logger.error(f"   Error type: {type(e).__name__}")
            logger.error(f"   Stack trace:\n{traceback.format_exc()}")
            return None

google_auth_service = GoogleAuthService()