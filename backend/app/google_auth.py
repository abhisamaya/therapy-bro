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
        print("\n--- GOOGLE TOKEN VERIFICATION SERVICE ---")
        print(f"🔍 Client ID configured: {self.client_id[:20]}...{self.client_id[-10:]}")
        print(f"📦 Token length: {len(token)}")
        print(f"📦 Token preview: {token[:50]}...")

        try:
            print("🌐 Calling Google API to verify token...")
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), self.client_id
            )

            print("✅ Google API returned token info successfully")
            print(f"📋 Full idinfo from Google: {idinfo}")

            # Verify the issuer
            print(f"🔍 Verifying issuer: {idinfo.get('iss')}")
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                print(f"❌ Invalid issuer: {idinfo['iss']}")
                raise ValueError('Wrong issuer.')

            print("✅ Issuer verified")

            user_info = {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name'),
                'avatar_url': idinfo.get('picture'),
                'email_verified': idinfo.get('email_verified', False)
            }

            print("✅ User info extracted:")
            print(f"   Google ID: {user_info['google_id']}")
            print(f"   Email: {user_info['email']}")
            print(f"   Name: {user_info['name']}")
            print(f"   Avatar URL: {user_info['avatar_url']}")
            print(f"   Email Verified: {user_info['email_verified']}")
            print("--- END GOOGLE TOKEN VERIFICATION ---\n")

            return user_info

        except ValueError as e:
            print(f"❌ Token verification failed (ValueError): {e}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            print(f"   Stack trace:\n{traceback.format_exc()}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error during token verification: {e}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            print(f"   Stack trace:\n{traceback.format_exc()}")
            return None

google_auth_service = GoogleAuthService()