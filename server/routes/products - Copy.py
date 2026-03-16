from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from config.database import get_db
from config.cloudinary_config import upload_image, delete_image
from middleware.auth import get_current_user, get_admin_user
from models.schemas import ProductSchema
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import re

router = APIRouter()


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


async def serialize_product(p: dict, db=None) -> dict:
    p["id"] = str(p.pop("_id"))
    if "category_id" in p and p["category_id"]:
        if db:
            cat = await db.categories.find_one({"_id": ObjectId(p["category_id"])})
            p["category"] = {"id": p["category_id"], "name": cat["name"] if cat else ""}
    if "brand_id" in p and p["brand_id"]:
        if db:
            brand = await db.brands.find_one({"_id": ObjectId(p["brand_id"])})
            p["brand"] = {"id": p["brand_id"], "name": brand["name"] if brand else "", "logo": brand.get("logo") if brand else None}
    return p


# ─── Public endpoints ─────────────────────────────────────────────────────────
@router.get("")
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "createdAt",
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    on_sale: Optional[bool] = None,
):
    db = get_db()
    query = {"is_active": True}

    if search:
        query["$text"] = {"$search": search}
    if category:
        query["category_id"] = category
    if brand:
        query["brand_id"] = brand
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if featured:
        query["is_featured"] = True
    if new_arrival:
        query["is_new_arrival"] = True
    if on_sale:
        query["is_on_sale"] = True

    sort_map = {
        "createdAt": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "popular": [("sales_count", -1)],
        "rating": [("avg_rating", -1)],
    }
    sort_order = sort_map.get(sort, [("created_at", -1)])

    total = await db.products.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.products.find(query).sort(sort_order).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)

    result = []
    for p in products:
        result.append(await serialize_product(p, db))

    return {
        "success": True,
        "data": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    try:
        query = {"_id": ObjectId(product_id)} if ObjectId.is_valid(product_id) else {"slug": product_id}
    except Exception:
        query = {"slug": product_id}

    product = await db.products.find_one(query)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Increment view count
    await db.products.update_one({"_id": product["_id"]}, {"$inc": {"view_count": 1}})

    return {"success": True, "data": await serialize_product(product, db)}


# ─── Admin endpoints ──────────────────────────────────────────────────────────
@router.post("")
async def create_product(body: ProductSchema, admin=Depends(get_admin_user)):
    db = get_db()
    slug = slugify(body.name)
    # Ensure unique slug
    existing = await db.products.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{ObjectId()}"

    doc = body.dict()
    doc["slug"] = slug
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["avg_rating"] = 0.0
    doc["review_count"] = 0
    doc["sales_count"] = 0
    doc["view_count"] = 0

    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "message": "Product created", "data": await serialize_product(doc, db)}


@router.put("/{product_id}")
async def update_product(product_id: str, body: ProductSchema, admin=Depends(get_admin_user)):
    db = get_db()
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    result = await db.products.find_one_and_update(
        {"_id": ObjectId(product_id)},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product updated", "data": await serialize_product(result, db)}


@router.delete("/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete images from Cloudinary
    for pid in product.get("image_public_ids", []):
        try:
            await delete_image(pid)
        except Exception:
            pass

    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"success": True, "message": "Product deleted"}


@router.get("/admin/all")
async def admin_get_all_products(
    page: int = 1,
    limit: int = 20,
    admin=Depends(get_admin_user),
):
    db = get_db()
    total = await db.products.count_documents({})
    skip = (page - 1) * limit
    cursor = db.products.find({}).sort("created_at", -1).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    result = [await serialize_product(p, db) for p in products]
    return {
        "success": True,
        "data": result,
        "pagination": {"page": page, "limit": limit, "total": total},
    }
