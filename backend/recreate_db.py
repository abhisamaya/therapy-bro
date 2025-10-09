#!/usr/bin/env python3
"""
Script to recreate the database with the updated wallet schema.
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import init_db, engine
from sqlmodel import SQLModel

def main():
    print("🗑️  Dropping all existing tables...")
    SQLModel.metadata.drop_all(engine)
    print("✅ All tables dropped")

    print("\n📦 Creating new tables with updated schema...")
    init_db()
    print("✅ Database created successfully")

    print("\n📋 Tables created:")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    for table_name in inspector.get_table_names():
        print(f"  - {table_name}")
        columns = inspector.get_columns(table_name)
        for col in columns:
            print(f"      {col['name']}: {col['type']}")

if __name__ == "__main__":
    main()
