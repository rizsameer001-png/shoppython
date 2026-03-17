"""
New routes: Product Attributes, Blog, Banners/Ads, Bulk Import/Export
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from config.database import get_db
from middleware.auth import get_admin_user, get_optional_user
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId
import csv, io, json, logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def sid(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def safe_oid(v):
    try:
        if v and ObjectId.is_valid(str(v)):
            return ObjectId(str(v))
    except Exception:
        pass
    return None


# ═════════════════════════════════════════════════════════════════════════════
# PRODUCT ATTRIBUTES
# ═════════════════════════════════════════════════════════════════════════════
attribute_router = APIRouter()

class AttributeValueSchema(BaseModel):
    value: str
    label: Optional[str] = None
    color_hex: Optional[str] = None   # for color swatches
    image: Optional[str] = None       # for image swatches
    sort_order: int = 0

class AttributeSchema(BaseModel):
    name: str = Field(..., min_length=1)
    slug: str = ""                    # auto-generated if empty
    type: str = "select"              # select | color | image | text | number
    category_ids: List[str] = []      # which categories use this attribute
    values: List[AttributeValueSchema] = []
    is_required: bool = False
    is_variant: bool = True           # used to generate variants
    is_filterable: bool = True
    sort_order: int = 0
    size_chart: Optional[dict] = None # { rows: [], cols: [], data: [[]] }
    description: Optional[str] = None

def _slugify(text: str) -> str:
    import re
    return re.sub(r"[\s_-]+", "-", re.sub(r"[^\w\s-]", "", text.lower().strip()))

@attribute_router.get("")
async def list_attributes(category_id: Optional[str] = None):
    db = get_db()
    q = {}
    if category_id:
        q["$or"] = [{"category_ids": []}, {"category_ids": category_id}]
    docs = await db.attributes.find(q).sort("sort_order", 1).to_list(200)
    return {"success": True, "data": [sid(d) for d in docs]}

@attribute_router.post("")
async def create_attribute(body: AttributeSchema, admin=Depends(get_admin_user)):
    db = get_db()
    slug = body.slug or _slugify(body.name)
    if await db.attributes.find_one({"slug": slug}):
        slug = f"{slug}-{ObjectId()}"
    doc = body.dict()
    doc["slug"] = slug
    doc["created_at"] = datetime.utcnow()
    r = await db.attributes.insert_one(doc)
    created = await db.attributes.find_one({"_id": r.inserted_id})
    return {"success": True, "data": sid(created)}

@attribute_router.put("/{attr_id}")
async def update_attribute(attr_id: str, body: AttributeSchema, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(attr_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    doc = body.dict()
    doc["updated_at"] = datetime.utcnow()
    r = await db.attributes.find_one_and_update({"_id": oid}, {"$set": doc}, return_document=True)
    if not r:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": sid(r)}

@attribute_router.delete("/{attr_id}")
async def delete_attribute(attr_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(attr_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    await db.attributes.delete_one({"_id": oid})
    return {"success": True, "message": "Attribute deleted"}

@attribute_router.get("/{attr_id}")
async def get_attribute(attr_id: str):
    db = get_db()
    oid = safe_oid(attr_id)
    doc = await db.attributes.find_one({"_id": oid} if oid else {"slug": attr_id})
    if not doc:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": sid(doc)}


# ═════════════════════════════════════════════════════════════════════════════
# BLOG
# ═════════════════════════════════════════════════════════════════════════════
blog_router = APIRouter()

class BlogSchema(BaseModel):
    title: str = Field(..., min_length=2)
    slug: Optional[str] = None
    content: str = ""
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    category_id: Optional[str] = None
    tags: List[str] = []
    status: str = "draft"       # draft | published
    is_featured: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

@blog_router.get("")
async def list_blogs(
    page: int = 1, limit: int = 20,
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
):
    db = get_db()
    q = {}
    if status:
        q["status"] = status
    if category_id:
        q["category_id"] = category_id
    if search:
        q["$text"] = {"$search": search}
    total = await db.blogs.count_documents(q)
    docs = await db.blogs.find(q).sort("created_at", -1).skip((page-1)*limit).limit(limit).to_list(limit)
    for d in docs:
        sid(d)
        if d.get("category_id"):
            cat = await db.categories.find_one({"_id": safe_oid(d["category_id"])})
            d["category"] = {"id": d["category_id"], "name": cat["name"] if cat else ""}
    return {"success": True, "data": docs, "pagination": {"page": page, "limit": limit, "total": total}}

@blog_router.post("")
async def create_blog(body: BlogSchema, admin=Depends(get_admin_user)):
    db = get_db()
    slug = body.slug or _slugify(body.title)
    if await db.blogs.find_one({"slug": slug}):
        slug = f"{slug}-{ObjectId()}"
    doc = body.dict()
    doc["slug"] = slug
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    doc["view_count"] = 0
    r = await db.blogs.insert_one(doc)
    created = await db.blogs.find_one({"_id": r.inserted_id})
    return {"success": True, "data": sid(created)}

@blog_router.get("/{blog_id}")
async def get_blog(blog_id: str):
    db = get_db()
    oid = safe_oid(blog_id)
    doc = await db.blogs.find_one({"_id": oid} if oid else {"slug": blog_id})
    if not doc:
        raise HTTPException(404, "Blog not found")
    await db.blogs.update_one({"_id": doc["_id"]}, {"$inc": {"view_count": 1}})
    sid(doc)
    return {"success": True, "data": doc}

@blog_router.put("/{blog_id}")
async def update_blog(blog_id: str, body: BlogSchema, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(blog_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    doc = body.dict()
    doc["updated_at"] = datetime.utcnow()
    r = await db.blogs.find_one_and_update({"_id": oid}, {"$set": doc}, return_document=True)
    if not r:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": sid(r)}

@blog_router.delete("/{blog_id}")
async def delete_blog(blog_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(blog_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    await db.blogs.delete_one({"_id": oid})
    return {"success": True, "message": "Blog deleted"}


# ═════════════════════════════════════════════════════════════════════════════
# BANNERS & ADS
# ═════════════════════════════════════════════════════════════════════════════
banner_router = APIRouter()

class BannerSchema(BaseModel):
    title: str
    subtitle: Optional[str] = None
    type: str = "hero"          # hero | side | popup | festival | product_ad
    image: Optional[str] = None
    mobile_image: Optional[str] = None
    video_url: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    position: str = "home"      # home | products | sidebar | popup | category
    product_ids: List[str] = [] # for product ad banners
    category_id: Optional[str] = None
    bg_color: Optional[str] = None
    text_color: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    # Popup specific
    popup_delay_ms: int = 3000
    popup_once_per_session: bool = True
    # Festival specific
    festival_name: Optional[str] = None
    badge_text: Optional[str] = None

@banner_router.get("")
async def list_banners(
    type: Optional[str] = None,
    position: Optional[str] = None,
    active_only: bool = True,
):
    db = get_db()
    q = {}
    if type:
        q["type"] = type
    if position:
        q["position"] = position
    if active_only:
        q["is_active"] = True
    docs = await db.banners.find(q).sort("sort_order", 1).to_list(100)
    for d in docs:
        sid(d)
    return {"success": True, "data": docs}

@banner_router.post("")
async def create_banner(body: BannerSchema, admin=Depends(get_admin_user)):
    db = get_db()
    doc = body.dict()
    doc["created_at"] = datetime.utcnow()
    r = await db.banners.insert_one(doc)
    created = await db.banners.find_one({"_id": r.inserted_id})
    return {"success": True, "data": sid(created)}

@banner_router.put("/{banner_id}")
async def update_banner(banner_id: str, body: BannerSchema, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(banner_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    r = await db.banners.find_one_and_update(
        {"_id": oid}, {"$set": {**body.dict(), "updated_at": datetime.utcnow()}},
        return_document=True
    )
    if not r:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": sid(r)}

@banner_router.delete("/{banner_id}")
async def delete_banner(banner_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    oid = safe_oid(banner_id)
    if not oid:
        raise HTTPException(422, "Invalid id")
    await db.banners.delete_one({"_id": oid})
    return {"success": True, "message": "Banner deleted"}

@banner_router.get("/admin/all")
async def admin_list_all_banners(admin=Depends(get_admin_user)):
    db = get_db()
    docs = await db.banners.find({}).sort("sort_order", 1).to_list(200)
    for d in docs:
        sid(d)
    return {"success": True, "data": docs}


# ═════════════════════════════════════════════════════════════════════════════
# BULK IMPORT / EXPORT
# ═════════════════════════════════════════════════════════════════════════════
bulk_router = APIRouter()

PRODUCT_CSV_HEADERS = [
    "name","description","short_description","price","compare_price","cost_price",
    "sku","stock","category_name","brand_name","tags","images",
    "youtube_url","weight","is_active","is_featured","is_new_arrival","is_on_sale",
    "meta_title","meta_description"
]

CATEGORY_CSV_HEADERS = ["name","description","parent_name","is_active"]

@bulk_router.get("/export/products")
async def export_products(admin=Depends(get_admin_user)):
    db = get_db()
    products = await db.products.find({}).to_list(10000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=PRODUCT_CSV_HEADERS)
    writer.writeheader()

    for p in products:
        cat_name = ""
        brand_name = ""
        if p.get("category_id"):
            cat = await db.categories.find_one({"_id": safe_oid(p["category_id"])})
            cat_name = cat["name"] if cat else ""
        if p.get("brand_id"):
            brand = await db.brands.find_one({"_id": safe_oid(p["brand_id"])})
            brand_name = brand["name"] if brand else ""

        writer.writerow({
            "name":              p.get("name",""),
            "description":       p.get("description",""),
            "short_description": p.get("short_description",""),
            "price":             p.get("price",""),
            "compare_price":     p.get("compare_price",""),
            "cost_price":        p.get("cost_price",""),
            "sku":               p.get("sku",""),
            "stock":             p.get("stock",0),
            "category_name":     cat_name,
            "brand_name":        brand_name,
            "tags":              "|".join(p.get("tags",[])),
            "images":            "|".join(p.get("images",[])),
            "youtube_url":       p.get("youtube_url",""),
            "weight":            p.get("weight",""),
            "is_active":         p.get("is_active",True),
            "is_featured":       p.get("is_featured",False),
            "is_new_arrival":    p.get("is_new_arrival",False),
            "is_on_sale":        p.get("is_on_sale",False),
            "meta_title":        p.get("meta_title",""),
            "meta_description":  p.get("meta_description",""),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_export.csv"}
    )

@bulk_router.get("/export/categories")
async def export_categories(admin=Depends(get_admin_user)):
    db = get_db()
    cats = await db.categories.find({}).to_list(1000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CATEGORY_CSV_HEADERS)
    writer.writeheader()

    for c in cats:
        parent_name = ""
        if c.get("parent_id"):
            parent = await db.categories.find_one({"_id": safe_oid(c["parent_id"])})
            parent_name = parent["name"] if parent else ""
        writer.writerow({
            "name":        c.get("name",""),
            "description": c.get("description",""),
            "parent_name": parent_name,
            "is_active":   c.get("is_active", True),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=categories_export.csv"}
    )

@bulk_router.get("/template/products")
async def download_product_template(admin=Depends(get_admin_user)):
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=PRODUCT_CSV_HEADERS)
    writer.writeheader()
    writer.writerow({
        "name": "Sample Product",
        "description": "Full description here",
        "short_description": "Short description",
        "price": "999",
        "compare_price": "1499",
        "cost_price": "500",
        "sku": "SKU-001",
        "stock": "50",
        "category_name": "Electronics",
        "brand_name": "Samsung",
        "tags": "tag1|tag2|tag3",
        "images": "https://example.com/img1.jpg|https://example.com/img2.jpg",
        "youtube_url": "",
        "weight": "0.5",
        "is_active": "True",
        "is_featured": "False",
        "is_new_arrival": "True",
        "is_on_sale": "False",
        "meta_title": "",
        "meta_description": "",
    })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_template.csv"}
    )

@bulk_router.post("/import/products")
async def import_products(file: UploadFile = File(...), admin=Depends(get_admin_user)):
    db = get_db()
    if not file.filename.endswith((".csv", ".CSV")):
        raise HTTPException(400, "Only CSV files supported")

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))

    created = 0
    updated = 0
    errors = []

    import re
    def slugify(t):
        return re.sub(r"[\s_-]+", "-", re.sub(r"[^\w\s-]","",t.lower().strip()))

    for i, row in enumerate(reader, 1):
        try:
            name = row.get("name","").strip()
            if not name:
                errors.append(f"Row {i}: name is required")
                continue

            price = float(row.get("price", 0) or 0)
            if price <= 0:
                errors.append(f"Row {i}: valid price required")
                continue

            # Resolve category
            cat_id = None
            cat_name = row.get("category_name","").strip()
            if cat_name:
                cat = await db.categories.find_one({"name": {"$regex": f"^{cat_name}$", "$options": "i"}})
                cat_id = str(cat["_id"]) if cat else None

            # Resolve brand
            brand_id = None
            brand_name = row.get("brand_name","").strip()
            if brand_name:
                brand = await db.brands.find_one({"name": {"$regex": f"^{brand_name}$", "$options": "i"}})
                brand_id = str(brand["_id"]) if brand else None

            def parse_bool(v):
                return str(v).strip().lower() in ("true","1","yes")

            doc = {
                "name":              name,
                "description":       row.get("description",""),
                "short_description": row.get("short_description","") or None,
                "price":             price,
                "compare_price":     float(row["compare_price"]) if row.get("compare_price","").strip() else None,
                "cost_price":        float(row["cost_price"]) if row.get("cost_price","").strip() else None,
                "sku":               row.get("sku","").strip() or None,
                "stock":             int(row.get("stock",0) or 0),
                "category_id":       cat_id or "",
                "brand_id":          brand_id or None,
                "tags":              [t.strip() for t in row.get("tags","").split("|") if t.strip()],
                "images":            [u.strip() for u in row.get("images","").split("|") if u.strip()],
                "image_public_ids":  [],
                "youtube_url":       row.get("youtube_url","").strip() or None,
                "weight":            float(row["weight"]) if row.get("weight","").strip() else None,
                "is_active":         parse_bool(row.get("is_active","True")),
                "is_featured":       parse_bool(row.get("is_featured","False")),
                "is_new_arrival":    parse_bool(row.get("is_new_arrival","False")),
                "is_on_sale":        parse_bool(row.get("is_on_sale","False")),
                "meta_title":        row.get("meta_title","").strip() or None,
                "meta_description":  row.get("meta_description","").strip() or None,
                "avg_rating": 0.0, "review_count": 0,
                "sales_count": 0, "view_count": 0, "wishlist_count": 0,
                "variants": [], "updated_at": datetime.utcnow(),
            }

            sku = doc["sku"]
            existing = await db.products.find_one({"sku": sku}) if sku else None
            if existing:
                await db.products.update_one({"_id": existing["_id"]}, {"$set": doc})
                updated += 1
            else:
                doc["slug"] = slugify(name)
                if await db.products.find_one({"slug": doc["slug"]}):
                    doc["slug"] = f"{doc['slug']}-{ObjectId()}"
                doc["created_at"] = datetime.utcnow()
                await db.products.insert_one(doc)
                created += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return {
        "success": True,
        "message": f"Import complete: {created} created, {updated} updated",
        "created": created, "updated": updated, "errors": errors[:20]
    }

@bulk_router.post("/import/categories")
async def import_categories(file: UploadFile = File(...), admin=Depends(get_admin_user)):
    db = get_db()
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    created = 0
    errors = []

    for i, row in enumerate(reader, 1):
        try:
            name = row.get("name","").strip()
            if not name:
                continue
            existing = await db.categories.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
            if existing:
                continue

            parent_id = None
            parent_name = row.get("parent_name","").strip()
            if parent_name:
                parent = await db.categories.find_one({"name": {"$regex": f"^{parent_name}$", "$options": "i"}})
                parent_id = str(parent["_id"]) if parent else None

            await db.categories.insert_one({
                "name": name,
                "description": row.get("description",""),
                "parent_id": parent_id,
                "is_active": str(row.get("is_active","True")).strip().lower() != "false",
                "created_at": datetime.utcnow(),
            })
            created += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    return {"success": True, "message": f"{created} categories imported", "created": created, "errors": errors}
