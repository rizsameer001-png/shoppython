"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ─── Shared ───────────────────────────────────────────────────────────────────
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        return str(v)


class APIResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Any = None


class PaginatedResponse(BaseModel):
    success: bool = True
    data: List[Any] = []
    pagination: dict = {}


# ─── Auth ─────────────────────────────────────────────────────────────────────
class RegisterSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


# ─── User ─────────────────────────────────────────────────────────────────────
class AddressSchema(BaseModel):
    label: str = "Home"
    street: str
    city: str
    state: str
    country: str
    zip_code: str
    is_default: bool = False


class UpdateProfileSchema(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    addresses: Optional[List[AddressSchema]] = None


# ─── Category ─────────────────────────────────────────────────────────────────
class CategorySchema(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: bool = True
    parent_id: Optional[str] = None  # None = top-level category


# ─── Brand ────────────────────────────────────────────────────────────────────
class BrandSchema(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    is_active: bool = True


# ─── Product ──────────────────────────────────────────────────────────────────
class ProductVariantSchema(BaseModel):
    name: str          # e.g. "Red / L"
    color: Optional[str] = None
    size: Optional[str] = None
    sku: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    stock: int = 0


class ProductSchema(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = ""
    short_description: Optional[str] = None
    price: float = Field(..., gt=0)
    compare_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    stock: int = 0
    category_id: str
    subcategory_id: Optional[str] = None
    brand_id: Optional[str] = None
    tags: List[str] = []
    images: List[str] = []          # Cloudinary URLs
    image_public_ids: List[str] = [] # Cloudinary public_ids
    youtube_url: Optional[str] = None  # YouTube embed URL
    video_url: Optional[str] = None    # Cloudinary video URL
    variants: List[ProductVariantSchema] = []
    weight: Optional[float] = None
    dimensions: Optional[dict] = None
    is_active: bool = True
    is_featured: bool = False
    is_new_arrival: bool = False
    is_on_sale: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


# ─── Cart ─────────────────────────────────────────────────────────────────────
class CartItemSchema(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    variant: Optional[str] = None


class UpdateCartItemSchema(BaseModel):
    quantity: int = Field(..., ge=0)


# ─── Order ────────────────────────────────────────────────────────────────────
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
    REFUNDED = "refunded"


class PlaceOrderSchema(BaseModel):
    shipping_address: AddressSchema
    payment_method: str = "cod"   # cod, card, upi
    coupon_code: Optional[str] = None
    notes: Optional[str] = None


class ReturnRequestSchema(BaseModel):
    order_id: str
    reason: str
    description: Optional[str] = None
    images: List[str] = []


# ─── Wishlist ─────────────────────────────────────────────────────────────────
class WishlistSchema(BaseModel):
    product_id: str


# ─── Upload ───────────────────────────────────────────────────────────────────
class UploadFromUrlSchema(BaseModel):
    url: str
    folder: Optional[str] = "marketpro/products"
