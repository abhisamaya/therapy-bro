"""
Database migration script to add PhoneVerification table and any other missing tables.
This script checks existing tables and only creates missing ones.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel, Session, text
from app.models import User, ChatSession, Message, Wallet, WalletTransaction, SessionCharge, Payment, PasswordResetToken, PhoneVerification
from app.db import engine, init_db

def get_existing_tables(db_engine):
    """Get list of existing tables in the database."""
    with Session(db_engine) as session:
        result = session.exec(text("SELECT name FROM sqlite_master WHERE type='table'"))
        return [row[0] for row in result]

def migrate_database():
    """Run database migration to create missing tables."""
    print("=" * 80)
    print("DATABASE MIGRATION")
    print("=" * 80)

    # Check existing tables
    print("\n1. Checking existing tables...")
    existing_tables = get_existing_tables(engine)
    print(f"   Found {len(existing_tables)} existing tables:")
    for table in existing_tables:
        print(f"   - {table}")

    # List of expected tables
    expected_tables = {
        'user': User,
        'chatsession': ChatSession,
        'message': Message,
        'wallet': Wallet,
        'wallettransaction': WalletTransaction,
        'sessioncharge': SessionCharge,
        'payment': Payment,
        'passwordresettoken': PasswordResetToken,
        'phoneverification': PhoneVerification
    }

    # Find missing tables
    missing_tables = []
    for table_name in expected_tables.keys():
        if table_name not in existing_tables:
            missing_tables.append(table_name)

    print(f"\n2. Missing tables: {len(missing_tables)}")
    if missing_tables:
        for table in missing_tables:
            print(f"   - {table}")
    else:
        print("   ✓ All tables exist!")

    # Create missing tables
    if missing_tables:
        print(f"\n3. Creating {len(missing_tables)} missing table(s)...")
        try:
            # Use init_db which creates all tables
            init_db()
            print("   ✓ Tables created successfully!")
        except Exception as e:
            print(f"   ✗ Error creating tables: {e}")
            import traceback
            traceback.print_exc()
            return False
    else:
        print("\n3. Skipping table creation - all tables already exist")

    # Verify tables were created
    print("\n4. Verifying database schema...")
    existing_tables_after = get_existing_tables(engine)
    print(f"   Found {len(existing_tables_after)} tables after migration:")
    for table in existing_tables_after:
        print(f"   - {table}")

    # Check if PhoneVerification table exists now
    if 'phoneverification' in existing_tables_after:
        print("\n✅ SUCCESS: PhoneVerification table created!")

        # Show table schema
        with Session(engine) as session:
            result = session.exec(text("PRAGMA table_info(phoneverification)"))
            columns = list(result)
            print("\n   PhoneVerification table schema:")
            for col in columns:
                print(f"   - {col[1]}: {col[2]}")
    else:
        print("\n✗ WARNING: PhoneVerification table was not created")
        return False

    print("\n" + "=" * 80)
    print("MIGRATION COMPLETED SUCCESSFULLY")
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
