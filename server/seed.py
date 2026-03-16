"""
Seed script — run once to populate DB with admin user + sample data.

Usage:
    python seed.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/marketpro")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@marketpro.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123456")


SAMPLE_CATEGORIES = [
    {"name": "Electronics",    "description": "Gadgets & devices",       "is_active": True, "parent_id": None},
    {"name": "Fashion",        "description": "Clothing & accessories",   "is_active": True, "parent_id": None},
    {"name": "Home & Living",  "description": "Furniture & décor",        "is_active": True, "parent_id": None},
    {"name": "Sports",         "description": "Fitness & outdoor gear",   "is_active": True, "parent_id": None},
    {"name": "Beauty",         "description": "Skincare & cosmetics",     "is_active": True, "parent_id": None},
    {"name": "Books",          "description": "Books & stationery",       "is_active": True, "parent_id": None},
]

SAMPLE_BRANDS = [
    {"name": "Samsung",   "is_active": True, "logo": None, "website": "https://samsung.com"},
    {"name": "Nike",      "is_active": True, "logo": None, "website": "https://nike.com"},
    {"name": "Apple",     "is_active": True, "logo": None, "website": "https://apple.com"},
    {"name": "Adidas",    "is_active": True, "logo": None, "website": "https://adidas.com"},
    {"name": "Sony",      "is_active": True, "logo": None, "website": "https://sony.com"},
    {"name": "H&M",       "is_active": True, "logo": None, "website": "https://hm.com"},
]

SAMPLE_PRODUCTS = [
    {
        "name": "Wireless Noise Cancelling Headphones",
        "description": "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support.",
        "short_description": "Best-in-class ANC headphones with 30hr battery",
        "price": 4999.0,
        "compare_price": 7999.0,
        "sku": "ELEC-001",
        "stock": 50,
        "tags": ["headphones", "audio", "wireless"],
        "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop"],
        "youtube_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "is_active": True, "is_featured": True, "is_new_arrival": True, "is_on_sale": True,
        "avg_rating": 4.5, "review_count": 128, "sales_count": 340, "wishlist_count": 89,
    },
    {
        "name": "Running Shoes Pro X",
        "description": "Lightweight performance running shoes with responsive cushioning and breathable mesh upper.",
        "short_description": "Lightweight running shoes with Pro cushioning",
        "price": 3499.0,
        "compare_price": 5499.0,
        "sku": "SPORT-001",
        "stock": 30,
        "tags": ["shoes", "running", "sports"],
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop"],
        "is_active": True, "is_featured": True, "is_on_sale": True,
        "avg_rating": 4.7, "review_count": 256, "sales_count": 890, "wishlist_count": 210,
    },
    {
        "name": "Smart Watch Series 5",
        "description": "Stay connected with health tracking, GPS, and a beautiful always-on display.",
        "short_description": "Smart watch with health tracking & GPS",
        "price": 8999.0,
        "compare_price": 12999.0,
        "sku": "ELEC-002",
        "stock": 25,
        "tags": ["smartwatch", "wearable", "fitness"],
        "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop"],
        "is_active": True, "is_featured": True, "is_new_arrival": True,
        "avg_rating": 4.6, "review_count": 95, "sales_count": 420, "wishlist_count": 175,
    },
    {
        "name": "Minimalist Leather Backpack",
        "description": "Genuine leather backpack with laptop compartment, perfect for work and travel.",
        "short_description": "Premium leather backpack for work & travel",
        "price": 2299.0,
        "compare_price": 3499.0,
        "sku": "FASH-001",
        "stock": 40,
        "tags": ["backpack", "leather", "bag"],
        "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop"],
        "is_active": True, "is_featured": False, "is_on_sale": True,
        "avg_rating": 4.3, "review_count": 67, "sales_count": 230, "wishlist_count": 98,
    },
    {
        "name": "4K Ultra HD Smart TV 55\"",
        "description": "Stunning 55-inch 4K QLED display with HDR10+, Dolby Vision, and built-in streaming apps.",
        "short_description": "55\" 4K QLED Smart TV with HDR10+",
        "price": 39999.0,
        "compare_price": 54999.0,
        "sku": "ELEC-003",
        "stock": 15,
        "tags": ["tv", "4k", "smart tv", "samsung"],
        "images": ["https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop"],
        "youtube_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "is_active": True, "is_featured": True, "is_on_sale": True,
        "avg_rating": 4.8, "review_count": 312, "sales_count": 180, "wishlist_count": 290,
    },
    {
        "name": "Floral Summer Dress",
        "description": "Beautiful floral print summer dress made from 100% breathable cotton. Perfect for any occasion.",
        "short_description": "Breathable cotton floral summer dress",
        "price": 999.0,
        "compare_price": 1799.0,
        "sku": "FASH-002",
        "stock": 80,
        "tags": ["dress", "summer", "fashion"],
        "images": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop"],
        "is_active": True, "is_new_arrival": True, "is_on_sale": True,
        "avg_rating": 4.4, "review_count": 44, "sales_count": 320, "wishlist_count": 140,
    },
    {
        "name": "Stainless Steel Water Bottle",
        "description": "Double-wall insulated bottle keeps drinks cold 24hr and hot 12hr. BPA-free, leak-proof.",
        "short_description": "Insulated 24hr cold / 12hr hot water bottle",
        "price": 699.0,
        "compare_price": 1099.0,
        "sku": "HOME-001",
        "stock": 120,
        "tags": ["bottle", "eco", "hydration"],
        "images": ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop"],
        "is_active": True, "is_featured": False, "is_new_arrival": True,
        "avg_rating": 4.6, "review_count": 189, "sales_count": 670, "wishlist_count": 130,
    },
    {
        "name": "Premium Yoga Mat",
        "description": "Non-slip, eco-friendly yoga mat with alignment lines. Extra thick 6mm cushioning.",
        "short_description": "Eco-friendly 6mm non-slip yoga mat",
        "price": 1499.0,
        "compare_price": 2499.0,
        "sku": "SPORT-002",
        "stock": 60,
        "tags": ["yoga", "fitness", "exercise"],
        "images": ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop"],
        "is_active": True, "is_on_sale": True,
        "avg_rating": 4.5, "review_count": 88, "sales_count": 410, "wishlist_count": 95,
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db_name = "marketpro"
    db = client[db_name]

    print("🌱 Seeding database...")

    # Admin user
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing_admin:
        await db.users.insert_one({
            "name": "Admin User",
            "email": ADMIN_EMAIL,
            "password": pwd_context.hash(ADMIN_PASSWORD),
            "role": "admin",
            "is_active": True,
            "addresses": [],
            "created_at": datetime.utcnow(),
        })
        print(f"  ✅ Admin created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    else:
        print("  ⏭️  Admin already exists")

    # Categories
    cat_ids = {}
    for cat in SAMPLE_CATEGORIES:
        existing = await db.categories.find_one({"name": cat["name"]})
        if not existing:
            result = await db.categories.insert_one({**cat, "created_at": datetime.utcnow()})
            cat_ids[cat["name"]] = result.inserted_id
            print(f"  ✅ Category: {cat['name']}")
        else:
            cat_ids[cat["name"]] = existing["_id"]

    # Brands
    brand_ids = {}
    for brand in SAMPLE_BRANDS:
        existing = await db.brands.find_one({"name": brand["name"]})
        if not existing:
            result = await db.brands.insert_one({**brand, "created_at": datetime.utcnow()})
            brand_ids[brand["name"]] = result.inserted_id
            print(f"  ✅ Brand: {brand['name']}")
        else:
            brand_ids[brand["name"]] = existing["_id"]

    # Products
    cat_map = {
        0: "Electronics", 1: "Sports", 2: "Electronics",
        3: "Fashion",     4: "Electronics", 5: "Fashion",
        6: "Home & Living", 7: "Sports",
    }
    brand_map = {
        0: "Sony",  1: "Nike",    2: "Apple",
        3: "H&M",   4: "Samsung", 5: "H&M",
        6: "Nike",  7: "Adidas",
    }

    import re
    def slugify(text):
        text = text.lower().strip()
        text = re.sub(r"[^\w\s-]", "", text)
        text = re.sub(r"[\s_-]+", "-", text)
        return text

    for i, product in enumerate(SAMPLE_PRODUCTS):
        existing = await db.products.find_one({"sku": product["sku"]})
        if not existing:
            cat_name   = cat_map.get(i, "Electronics")
            brand_name = brand_map.get(i, "Samsung")
            doc = {
                **product,
                "slug":         slugify(product["name"]),
                "category_id":  str(cat_ids.get(cat_name, "")),
                "brand_id":     str(brand_ids.get(brand_name, "")),
                "image_public_ids": [],
                "variants":  [],
                "view_count": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await db.products.insert_one(doc)
            print(f"  ✅ Product: {product['name']}")
        else:
            print(f"  ⏭️  Product already exists: {product['name']}")

    # Indexes
    await db.products.create_index([("name", "text"), ("description", "text")])
    await db.products.create_index("slug", unique=True)
    await db.users.create_index("email", unique=True)
    await db.wishlists.create_index([("user_id", 1), ("product_id", 1)], unique=True)
    print("  ✅ Indexes created")

    client.close()
    print("\n✨ Seeding complete!")
    print(f"   Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print("   Run the server: uvicorn main:app --reload")


if __name__ == "__main__":
    asyncio.run(seed())
