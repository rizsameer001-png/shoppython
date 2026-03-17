from .auth import router as auth_router
from .products import router as product_router
from .misc import (
    category_router,
    brand_router,
    upload_router,
    cart_router,
    wishlist_router,
    order_router,
    user_router,
    admin_router,
)
from .new_features import (
    attribute_router,
    blog_router,
    banner_router,
    bulk_router,
    cms_router,
)

__all__ = [
    "auth_router",
    "product_router",
    "category_router",
    "brand_router",
    "upload_router",
    "cart_router",
    "wishlist_router",
    "order_router",
    "user_router",
    "admin_router",
    "attribute_router",
    "blog_router",
    "banner_router",
    "bulk_router",
    "cms_router",
]
