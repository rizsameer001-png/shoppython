"""
Routes: Categories, Brands, Upload, Cart, Wishlist, Orders, Users, Admin
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from config.database import get_db
from config.cloudinary_config import upload_image, upload_from_url, delete_image
from middleware.auth import get_current_user, get_admin_user
from models.schemas import (
    CategorySchema, BrandSchema, CartItemSchema, UpdateCartItemSchema,
    WishlistSchema, PlaceOrderSchema, ReturnRequestSchema, UpdateProfileSchema,
    UploadFromUrlSchema, OrderStatus
)
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# ─── Categories ──────────────────────────────────────────────────────────────
category_router = APIRouter()

@category_router.get("")
async def get_categories(include_subs: bool = True):
    db = get_db()
    cats = await db.categories.find({"is_active": True, "parent_id": None}).to_list(length=200)
    result = []
    for c in cats:
        c["id"] = str(c.pop("_id"))
        if include_subs:
            subs = await db.categories.find({"parent_id": c["id"], "is_active": True}).to_list(length=50)
            for s in subs:
                s["id"] = str(s.pop("_id"))
            c["subcategories"] = subs
        result.append(c)
    return {"success": True, "data": result}

@category_router.post("")
async def create_category(body: CategorySchema, admin=Depends(get_admin_user)):
    db = get_db()
    doc = body.dict()
    doc["created_at"] = datetime.utcnow()
    result = await db.categories.insert_one(doc)
    # ✅ Re-fetch — never reuse the dict passed to insert_one
    created = await db.categories.find_one({"_id": result.inserted_id})
    created["id"] = str(created.pop("_id"))
    return {"success": True, "data": created}

@category_router.put("/{cat_id}")
async def update_category(cat_id: str, body: CategorySchema, admin=Depends(get_admin_user)):
    db = get_db()
    await db.categories.update_one({"_id": ObjectId(cat_id)}, {"$set": body.dict()})
    return {"success": True, "message": "Category updated"}

@category_router.delete("/{cat_id}")
async def delete_category(cat_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    await db.categories.delete_one({"_id": ObjectId(cat_id)})
    return {"success": True, "message": "Category deleted"}

@category_router.get("/all")
async def get_all_categories_admin(admin=Depends(get_admin_user)):
    db = get_db()
    cats = await db.categories.find({}).to_list(length=500)
    for c in cats:
        c["id"] = str(c.pop("_id"))
    return {"success": True, "data": cats}


# ─── Brands ───────────────────────────────────────────────────────────────────
brand_router = APIRouter()

@brand_router.get("")
async def get_brands():
    db = get_db()
    brands = await db.brands.find({"is_active": True}).to_list(length=200)
    for b in brands:
        b["id"] = str(b.pop("_id"))
    return {"success": True, "data": brands}

@brand_router.post("")
async def create_brand(body: BrandSchema, admin=Depends(get_admin_user)):
    db = get_db()
    doc = body.dict()
    doc["created_at"] = datetime.utcnow()
    result = await db.brands.insert_one(doc)
    # ✅ Re-fetch — never reuse the dict passed to insert_one
    created = await db.brands.find_one({"_id": result.inserted_id})
    created["id"] = str(created.pop("_id"))
    return {"success": True, "data": created}

@brand_router.put("/{brand_id}")
async def update_brand(brand_id: str, body: BrandSchema, admin=Depends(get_admin_user)):
    db = get_db()
    await db.brands.update_one({"_id": ObjectId(brand_id)}, {"$set": body.dict()})
    return {"success": True, "message": "Brand updated"}

@brand_router.delete("/{brand_id}")
async def delete_brand(brand_id: str, admin=Depends(get_admin_user)):
    db = get_db()
    await db.brands.delete_one({"_id": ObjectId(brand_id)})
    return {"success": True, "message": "Brand deleted"}


# ─── Upload ───────────────────────────────────────────────────────────────────
upload_router = APIRouter()

@upload_router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(...),
    folder: str = Form("marketpro/products"),
    admin=Depends(get_admin_user),
):
    results = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        content = await file.read()
        result = await upload_image(content, folder=folder)
        results.append(result)
    return {"success": True, "data": results}

@upload_router.post("/image-url")
async def upload_from_url_endpoint(body: UploadFromUrlSchema, admin=Depends(get_admin_user)):
    try:
        result = await upload_from_url(body.url, folder=body.folder or "marketpro/products")
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

@upload_router.delete("")
async def delete_media(body: dict, admin=Depends(get_admin_user)):
    public_id = body.get("public_id")
    if not public_id:
        raise HTTPException(status_code=400, detail="public_id required")
    ok = await delete_image(public_id)
    return {"success": ok, "message": "Deleted" if ok else "Delete failed"}


# ─── Cart ─────────────────────────────────────────────────────────────────────
cart_router = APIRouter()

async def get_or_create_cart(user_id: str, db):
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        cart = {"user_id": user_id, "items": [], "created_at": datetime.utcnow()}
        result = await db.carts.insert_one(cart)
        cart["_id"] = result.inserted_id
    return cart

async def serialize_cart(cart: dict, db):
    items = []
    for item in cart.get("items", []):
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            items.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "variant": item.get("variant"),
                "product": {
                    "id": str(product["_id"]),
                    "name": product["name"],
                    "price": product["price"],
                    "images": product.get("images", [])[:1],
                    "stock": product.get("stock", 0),
                }
            })
    total = sum(i["quantity"] * i["product"]["price"] for i in items)
    return {"items": items, "total": total, "item_count": len(items)}

@cart_router.get("")
async def get_cart(user=Depends(get_current_user)):
    db = get_db()
    cart = await get_or_create_cart(str(user["_id"]), db)
    return {"success": True, "data": await serialize_cart(cart, db)}

@cart_router.post("/add")
async def add_to_cart(body: CartItemSchema, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    product = await db.products.find_one({"_id": ObjectId(body.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = await get_or_create_cart(uid, db)
    items = cart.get("items", [])
    found = False
    for item in items:
        if item["product_id"] == body.product_id and item.get("variant") == body.variant:
            item["quantity"] += body.quantity
            found = True
            break
    if not found:
        items.append({"product_id": body.product_id, "quantity": body.quantity, "variant": body.variant})

    await db.carts.update_one({"user_id": uid}, {"$set": {"items": items}})
    cart["items"] = items
    return {"success": True, "data": await serialize_cart(cart, db)}

@cart_router.put("/{product_id}")
async def update_cart_item(product_id: str, body: UpdateCartItemSchema, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    cart = await get_or_create_cart(uid, db)
    items = [i for i in cart.get("items", []) if i["product_id"] != product_id]
    if body.quantity > 0:
        items.append({"product_id": product_id, "quantity": body.quantity})
    await db.carts.update_one({"user_id": uid}, {"$set": {"items": items}})
    cart["items"] = items
    return {"success": True, "data": await serialize_cart(cart, db)}

@cart_router.delete("")
async def clear_cart(user=Depends(get_current_user)):
    db = get_db()
    await db.carts.update_one({"user_id": str(user["_id"])}, {"$set": {"items": []}})
    return {"success": True, "message": "Cart cleared"}


# ─── Wishlist ─────────────────────────────────────────────────────────────────
wishlist_router = APIRouter()

@wishlist_router.get("")
async def get_wishlist(user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    items = await db.wishlists.find({"user_id": uid}).to_list(length=500)
    result = []
    for item in items:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            result.append({
                "id": str(item["_id"]),
                "product_id": item["product_id"],
                "product": {
                    "id": str(product["_id"]),
                    "name": product["name"],
                    "price": product["price"],
                    "compare_price": product.get("compare_price"),
                    "images": product.get("images", [])[:1],
                    "avg_rating": product.get("avg_rating", 0),
                    "is_on_sale": product.get("is_on_sale", False),
                },
                "added_at": item.get("added_at"),
            })
    return {"success": True, "data": result}

@wishlist_router.post("/toggle")
async def toggle_wishlist(body: WishlistSchema, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    existing = await db.wishlists.find_one({"user_id": uid, "product_id": body.product_id})
    if existing:
        await db.wishlists.delete_one({"_id": existing["_id"]})
        # Decrement wishlist count
        await db.products.update_one({"_id": ObjectId(body.product_id)}, {"$inc": {"wishlist_count": -1}})
        return {"success": True, "message": "Removed from wishlist", "is_wishlisted": False}
    else:
        await db.wishlists.insert_one({
            "user_id": uid,
            "product_id": body.product_id,
            "added_at": datetime.utcnow(),
        })
        await db.products.update_one({"_id": ObjectId(body.product_id)}, {"$inc": {"wishlist_count": 1}})
        return {"success": True, "message": "Added to wishlist", "is_wishlisted": True}

@wishlist_router.get("/check/{product_id}")
async def check_wishlist(product_id: str, user=Depends(get_current_user)):
    db = get_db()
    existing = await db.wishlists.find_one({"user_id": str(user["_id"]), "product_id": product_id})
    return {"success": True, "is_wishlisted": bool(existing)}


# ─── Orders ───────────────────────────────────────────────────────────────────
order_router = APIRouter()

@order_router.post("")
async def place_order(body: PlaceOrderSchema, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    cart = await db.carts.find_one({"user_id": uid})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    items = []
    subtotal = 0
    for ci in cart["items"]:
        product = await db.products.find_one({"_id": ObjectId(ci["product_id"])})
        if not product:
            continue
        line_total = product["price"] * ci["quantity"]
        subtotal += line_total
        items.append({
            "product_id": ci["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": ci["quantity"],
            "image": product.get("images", [None])[0],
            "variant": ci.get("variant"),
        })

    shipping = 0 if subtotal > 500 else 50
    tax = round(subtotal * 0.18, 2)
    total = subtotal + shipping + tax

    order = {
        "user_id": uid,
        "items": items,
        "subtotal": subtotal,
        "shipping": shipping,
        "tax": tax,
        "total": total,
        "shipping_address": body.shipping_address.dict(),
        "payment_method": body.payment_method,
        "payment_status": "pending",
        "status": OrderStatus.CONFIRMED,
        "notes": body.notes,
        "coupon_code": body.coupon_code,
        "tracking_number": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.orders.insert_one(order)
    order["id"] = str(result.inserted_id)

    # Update sales count & clear cart
    for ci in cart["items"]:
        await db.products.update_one(
            {"_id": ObjectId(ci["product_id"])},
            {"$inc": {"sales_count": ci["quantity"], "stock": -ci["quantity"]}}
        )
    await db.carts.update_one({"user_id": uid}, {"$set": {"items": []}})

    return {"success": True, "message": "Order placed successfully", "data": order}

@order_router.get("")
async def get_my_orders(page: int = 1, limit: int = 10, user=Depends(get_current_user)):
    db = get_db()
    uid = str(user["_id"])
    total = await db.orders.count_documents({"user_id": uid})
    skip = (page - 1) * limit
    orders = await db.orders.find({"user_id": uid}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for o in orders:
        o["id"] = str(o.pop("_id"))
    return {"success": True, "data": orders, "pagination": {"page": page, "limit": limit, "total": total}}

@order_router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": str(user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order.pop("_id"))
    return {"success": True, "data": order}

@order_router.post("/{order_id}/return")
async def request_return(order_id: str, body: ReturnRequestSchema, user=Depends(get_current_user)):
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id), "user_id": str(user["_id"])})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Only delivered orders can be returned")

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": OrderStatus.RETURNED,
            "return_request": {
                "reason": body.reason,
                "description": body.description,
                "images": body.images,
                "requested_at": datetime.utcnow(),
            }
        }}
    )
    return {"success": True, "message": "Return request submitted"}


# ─── Users ────────────────────────────────────────────────────────────────────
user_router = APIRouter()

@user_router.put("/profile")
async def update_profile(body: UpdateProfileSchema, user=Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in body.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"_id": user["_id"]}, {"$set": update})
    return {"success": True, "message": "Profile updated"}


# ─── Admin ────────────────────────────────────────────────────────────────────
admin_router = APIRouter()

@admin_router.get("/dashboard")
async def admin_dashboard(admin=Depends(get_admin_user)):
    db = get_db()
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    total_categories = await db.categories.count_documents({})

    # Revenue
    pipeline = [
        {"$match": {"status": {"$nin": ["cancelled", "returned"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    rev_result = await db.orders.aggregate(pipeline).to_list(1)
    revenue = rev_result[0]["total"] if rev_result else 0

    # Recent orders
    recent_orders = await db.orders.find({}).sort("created_at", -1).limit(5).to_list(5)
    for o in recent_orders:
        o["id"] = str(o.pop("_id"))
        user = await db.users.find_one({"_id": ObjectId(o["user_id"])})
        o["user_name"] = user["name"] if user else "Unknown"

    # Top products by wishlist
    top_wishlisted = await db.products.find({}).sort("wishlist_count", -1).limit(10).to_list(10)
    wishlist_data = []
    for p in top_wishlisted:
        wishlist_data.append({
            "id": str(p["_id"]),
            "name": p["name"],
            "wishlist_count": p.get("wishlist_count", 0),
            "image": p.get("images", [None])[0],
        })

    return {
        "success": True,
        "data": {
            "stats": {
                "total_products": total_products,
                "total_orders": total_orders,
                "total_users": total_users,
                "total_categories": total_categories,
                "total_revenue": revenue,
            },
            "recent_orders": recent_orders,
            "top_wishlisted_products": wishlist_data,
        }
    }

@admin_router.get("/orders")
async def admin_get_orders(page: int = 1, limit: int = 20, status: Optional[str] = None, admin=Depends(get_admin_user)):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for o in orders:
        o["id"] = str(o.pop("_id"))
        user = await db.users.find_one({"_id": ObjectId(o["user_id"])})
        o["customer_name"] = user["name"] if user else "Unknown"
        o["customer_email"] = user["email"] if user else ""
    return {"success": True, "data": orders, "pagination": {"page": page, "limit": limit, "total": total}}

@admin_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: dict, admin=Depends(get_admin_user)):
    db = get_db()
    new_status = body.get("status")
    tracking = body.get("tracking_number")
    update = {"status": new_status, "updated_at": datetime.utcnow()}
    if tracking:
        update["tracking_number"] = tracking
    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": update})
    return {"success": True, "message": "Order status updated"}

@admin_router.get("/customers")
async def admin_get_customers(page: int = 1, limit: int = 20, admin=Depends(get_admin_user)):
    db = get_db()
    total = await db.users.count_documents({"role": "customer"})
    skip = (page - 1) * limit
    users = await db.users.find({"role": "customer"}, {"password": 0}).skip(skip).limit(limit).to_list(limit)
    for u in users:
        u["id"] = str(u.pop("_id"))
        # Get wishlist count
        u["wishlist_count"] = await db.wishlists.count_documents({"user_id": u["id"]})
        u["order_count"] = await db.orders.count_documents({"user_id": u["id"]})
    return {"success": True, "data": users, "pagination": {"page": page, "limit": limit, "total": total}}

@admin_router.get("/wishlist-stats")
async def admin_wishlist_stats(admin=Depends(get_admin_user)):
    """Products ranked by wishlist count — for admin dashboard"""
    db = get_db()
    pipeline = [
        {"$group": {"_id": "$product_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50},
    ]
    agg = await db.wishlists.aggregate(pipeline).to_list(50)
    result = []
    for item in agg:
        product = await db.products.find_one({"_id": ObjectId(item["_id"])})
        if product:
            result.append({
                "product_id": item["_id"],
                "name": product["name"],
                "total_wishlists": item["count"],
                "image": product.get("images", [None])[0],
                "price": product.get("price"),
            })
    return {"success": True, "data": result}
