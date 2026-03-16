from fastapi import APIRouter, HTTPException, Depends, Query
from config.database import get_db
from config.cloudinary_config import delete_image
from middleware.auth import get_admin_user
from models.schemas import ProductSchema
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


def _safe_object_id(value) -> "ObjectId | None":
    """Return ObjectId if valid 24-hex string, else None. Never raises."""
    try:
        if value and isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
    except Exception:
        pass
    return None


def _stringify_doc(doc: dict) -> dict:
    """
    Return a NEW dict with all ObjectId → str and datetime → ISO string.
    Never mutates the source dict (Motor documents must not be mutated).
    """
    from datetime import datetime as _dt
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, _dt):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = _stringify_doc(v)
        elif isinstance(v, list):
            out[k] = [
                _stringify_doc(i) if isinstance(i, dict)
                else str(i) if isinstance(i, ObjectId)
                else i
                for i in v
            ]
        else:
            out[k] = v
    return out


async def serialize_product(p: dict, db=None) -> dict:
    """Convert a raw Motor document to a JSON-safe dict."""
    doc = _stringify_doc(p)

    # _stringify_doc keeps the key name — normalise _id → id
    if "_id" in doc:
        doc["id"] = doc.pop("_id")

    # ✅ FIX: use `is not None` — Motor DB objects raise NotImplementedError
    #         when Python evaluates `if db` (truth-value test).
    if db is not None and doc.get("category_id"):
        oid = _safe_object_id(doc["category_id"])
        if oid:
            cat = await db.categories.find_one({"_id": oid})
            doc["category"] = {
                "id": doc["category_id"],
                "name": cat["name"] if cat else "",
            }

    if db is not None and doc.get("brand_id"):
        oid = _safe_object_id(doc["brand_id"])
        if oid:
            brand = await db.brands.find_one({"_id": oid})
            doc["brand"] = {
                "id": doc["brand_id"],
                "name": brand["name"] if brand else "",
                "logo": brand.get("logo") if brand else None,
            }

    return doc


def _clean_product_doc(raw: dict) -> dict:
    """
    Coerce empty strings → None for all Optional fields so MongoDB
    never stores "" where None is expected. Also ensures subcategory_id
    and brand_id are either a valid-looking string or None.
    """
    NULLABLE_STR_FIELDS = {
        "sku", "subcategory_id", "brand_id",
        "youtube_url", "video_url",
        "meta_title", "meta_description",
        "short_description",
    }
    out = dict(raw)
    for field in NULLABLE_STR_FIELDS:
        if field in out and out[field] == "":
            out[field] = None
    return out


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
    query: dict = {"is_active": True}

    if search:
        query["$text"] = {"$search": search}
    if category:
        query["category_id"] = category
    if brand:
        query["brand_id"] = brand
    if min_price is not None or max_price is not None:
        price_q: dict = {}
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
        "createdAt":  [("created_at", -1)],
        "price_asc":  [("price", 1)],
        "price_desc": [("price", -1)],
        "popular":    [("sales_count", -1)],
        "rating":     [("avg_rating", -1)],
    }
    sort_order = sort_map.get(sort, [("created_at", -1)])

    total = await db.products.count_documents(query)
    skip  = (page - 1) * limit
    docs  = await db.products.find(query).sort(sort_order).skip(skip).limit(limit).to_list(length=limit)

    return {
        "success": True,
        "data": [await serialize_product(p, db) for p in docs],
        "pagination": {
            "page":  page,
            "limit": limit,
            "total": total,
            "pages": max(1, (total + limit - 1) // limit),
        },
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    db  = get_db()
    oid = _safe_object_id(product_id)
    query = {"_id": oid} if oid else {"slug": product_id}

    product = await db.products.find_one(query)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.products.update_one({"_id": product["_id"]}, {"$inc": {"view_count": 1}})
    return {"success": True, "data": await serialize_product(product, db)}


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@router.post("")
async def create_product(body: ProductSchema, admin=Depends(get_admin_user)):
    db = get_db()

    slug = slugify(body.name)
    if await db.products.find_one({"slug": slug}):
        slug = f"{slug}-{ObjectId()}"

    # Start from the validated Pydantic dict, then clean empty strings → None
    doc = _clean_product_doc(body.dict())
    doc.update({
        "slug":          slug,
        "created_at":    datetime.utcnow(),
        "updated_at":    datetime.utcnow(),
        "avg_rating":    0.0,
        "review_count":  0,
        "sales_count":   0,
        "view_count":    0,
        "wishlist_count": 0,
    })

    result  = await db.products.insert_one(doc)
    created = await db.products.find_one({"_id": result.inserted_id})
    return {
        "success": True,
        "message": "Product created",
        "data":    await serialize_product(created, db),
    }


@router.put("/{product_id}")
async def update_product(product_id: str, body: ProductSchema, admin=Depends(get_admin_user)):
    db = get_db()

    oid = _safe_object_id(product_id)
    if not oid:
        raise HTTPException(status_code=422, detail="Invalid product id")

    # Clean empty strings → None, exclude client-supplied id
    update_data = _clean_product_doc(
        {k: v for k, v in body.dict().items() if k != "id"}
    )
    update_data["updated_at"] = datetime.utcnow()

    result = await db.products.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "success": True,
        "message": "Product updated",
        "data":    await serialize_product(result, db),
    }


@router.delete("/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_admin_user)):
    db  = get_db()
    oid = _safe_object_id(product_id)
    if not oid:
        raise HTTPException(status_code=422, detail="Invalid product id")

    product = await db.products.find_one({"_id": oid})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for pid in product.get("image_public_ids", []):
        try:
            await delete_image(pid)
        except Exception as exc:
            logger.warning(f"Cloudinary delete failed for {pid}: {exc}")

    await db.products.delete_one({"_id": oid})
    return {"success": True, "message": "Product deleted"}


@router.get("/admin/list")
async def admin_get_all_products(
    page:   int           = 1,
    limit:  int           = 20,
    search: Optional[str] = None,
    admin=Depends(get_admin_user),
):
    db    = get_db()
    query: dict = {}
    if search:
        query["$text"] = {"$search": search}

    total = await db.products.count_documents(query)
    skip  = (page - 1) * limit
    docs  = await db.products.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    return {
        "success": True,
        "data":       [await serialize_product(p, db) for p in docs],
        "pagination": {"page": page, "limit": limit, "total": total},
    }
