from motor.motor_asyncio import AsyncIOMotorClient
from redis import asyncio as aioredis
from .config import settings


_mongo_client = None
_redis = None


def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    return _mongo_client


async def get_redis():
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(settings.REDIS_URL)
    return _redis


# helper to get collection


def get_collection(name: str):
    client = get_mongo_client()
    db = client[settings.MONGO_DB]
    return db[name]