#!/usr/bin/env python3
"""
Script to test MongoDB connection
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_mongodb():
    # Try different connection strings
    mongo_uris = [
        os.getenv("MONGO_URI", "mongodb://localhost:27017"),
        "mongodb://localhost:27017",
        "mongodb://127.0.0.1:27017",
        "mongodb://mongo:27017",
    ]

    print("Testing MongoDB connectivity...\n")

    for uri in mongo_uris:
        print(f"Trying connection to: {uri}")
        try:
            client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
            # Test the connection
            await client.admin.command('ping')
            print(f"✓ Successfully connected to MongoDB at {uri}")

            # List databases
            db_list = await client.list_database_names()
            print(f"  Available databases: {db_list}")

            # Check if chatdb exists
            if "chatdb" in db_list:
                db = client["chatdb"]
                collections = await db.list_collection_names()
                print(f"  Collections in 'chatdb': {collections}")

                # Check messages collection
                if "messages" in collections:
                    msg_count = await db.messages.count_documents({})
                    print(f"  Messages count: {msg_count}")

            client.close()
            print("\n✓ MongoDB is available and working!\n")
            return True

        except Exception as e:
            print(f"✗ Failed: {e}")
            print()

    print("✗ MongoDB is not available on any of the tested URIs")
    print("\nTo start MongoDB:")
    print("  - Using Docker: docker run -d -p 27017:27017 --name mongodb mongo")
    print("  - Using Homebrew: brew services start mongodb-community")
    print("  - Manual: mongod --dbpath /path/to/data")
    return False

if __name__ == "__main__":
    asyncio.run(test_mongodb())
