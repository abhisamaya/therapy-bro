#!/usr/bin/env python3
"""Quick MongoDB connectivity check"""
import sys
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

    uris = [
        ("localhost:27017", "mongodb://localhost:27017"),
        ("127.0.0.1:27017", "mongodb://127.0.0.1:27017"),
    ]

    print("Checking MongoDB connectivity...\n")

    for name, uri in uris:
        try:
            print(f"Testing {name}...", end=" ")
            client = MongoClient(uri, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            print("✓ CONNECTED")

            # Show databases
            dbs = client.list_database_names()
            print(f"  Databases: {dbs}")

            # Check chatdb
            if "chatdb" in dbs:
                db = client["chatdb"]
                cols = db.list_collection_names()
                print(f"  'chatdb' collections: {cols}")
                if "messages" in cols:
                    count = db.messages.count_documents({})
                    print(f"  Messages: {count}")

            client.close()
            print("\n✓ MongoDB is AVAILABLE\n")
            sys.exit(0)

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print("✗ Not reachable")
        except Exception as e:
            print(f"✗ Error: {e}")

    print("\n✗ MongoDB is NOT AVAILABLE")
    print("\nStart MongoDB using one of these methods:")
    print("  1. Homebrew: brew services start mongodb-community")
    print("  2. Docker: docker run -d -p 27017:27017 --name mongodb mongo")
    print("  3. Manual: mongod --config /usr/local/etc/mongod.conf")
    sys.exit(1)

except ImportError:
    print("pymongo not installed. Using motor check...")
    try:
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient

        async def check():
            try:
                client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
                await client.admin.command('ping')
                print("✓ MongoDB is AVAILABLE at localhost:27017")
                dbs = await client.list_database_names()
                print(f"  Databases: {dbs}")
                return True
            except Exception as e:
                print(f"✗ MongoDB is NOT AVAILABLE: {e}")
                return False

        result = asyncio.run(check())
        sys.exit(0 if result else 1)
    except ImportError:
        print("Neither pymongo nor motor installed!")
        sys.exit(1)
