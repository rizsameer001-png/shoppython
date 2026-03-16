from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_default_database() if "?" in settings.MONGODB_URL else client["marketpro"]
    # Create indexes
    await create_indexes()
    logger.info("MongoDB connected")


async def disconnect_db():
    global client
    if client:
        client.close()


async def create_indexes():
    """Create MongoDB indexes for performance"""
    try:
        await db.products.create_index([("name", "text"), ("description", "text")])
        await db.products.create_index("slug", unique=True)
        await db.products.create_index("category_id")
        await db.products.create_index("brand_id")
        await db.products.create_index("is_active")
        await db.users.create_index("email", unique=True)
        await db.orders.create_index("user_id")
        await db.orders.create_index("status")
        await db.wishlists.create_index([("user_id", 1), ("product_id", 1)], unique=True)
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")


def get_db():
    return db
