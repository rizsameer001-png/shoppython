"""MarketPro — FastAPI Backend"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import uvicorn, logging, traceback

from config.database import connect_db, disconnect_db
from config.settings import settings
from routes import (
    auth_router, product_router, category_router, brand_router,
    cart_router, wishlist_router, order_router, upload_router,
    user_router, admin_router,
    attribute_router, blog_router, banner_router, bulk_router,
    cms_router, settings_router, payment_router,
)

logging.basicConfig(
    level=logging.DEBUG if settings.APP_ENV == "development" else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Log CORS origins at startup so you can verify in Render logs
logger.info(f"CORS allowed origins: {settings.ALLOWED_ORIGINS}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting MarketPro API...")
    await connect_db()
    logger.info("✅ Database connected")
    yield
    await disconnect_db()
    logger.info("👋 Database disconnected")


app = FastAPI(
    title="MarketPro API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Origins come from settings.ALLOWED_ORIGINS (set in config/settings.py or
# overridden by the ALLOWED_ORIGINS env var on Render).
# Current default includes: https://shoppy-jhpy.onrender.com + localhost variants
# Allow all origins so FlutLab, mobile apps, and any frontend can connect.
# Auth is handled via JWT tokens, not cookies, so allow_origins=["*"] is safe.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# ── Exception handlers ────────────────────────────────────────────────────────
@app.exception_handler(StarletteHTTPException)
async def http_exc(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)},
    )

@app.exception_handler(RequestValidationError)
async def val_exc(request: Request, exc: RequestValidationError):
    errors = [
        f"{'->'.join(str(x) for x in e['loc'])}: {e['msg']}"
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Validation error", "errors": errors},
    )

@app.exception_handler(Exception)
async def global_exc(request: Request, exc: Exception):
    logger.error(
        f"Unhandled {type(exc).__name__} on {request.method} {request.url}\n"
        f"{traceback.format_exc()}"
    )
    detail = (
        f"{type(exc).__name__}: {exc}"
        if settings.APP_ENV == "development"
        else "Internal server error"
    )
    return JSONResponse(status_code=500, content={"success": False, "message": detail})


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health():
    return {"success": True, "message": "MarketPro API 🛒", "version": "1.0.0"}


# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api"
app.include_router(auth_router,      prefix=f"{PREFIX}/auth",        tags=["Auth"])
app.include_router(user_router,      prefix=f"{PREFIX}/users",       tags=["Users"])
app.include_router(product_router,   prefix=f"{PREFIX}/products",    tags=["Products"])
app.include_router(category_router,  prefix=f"{PREFIX}/categories",  tags=["Categories"])
app.include_router(brand_router,     prefix=f"{PREFIX}/brands",      tags=["Brands"])
app.include_router(cart_router,      prefix=f"{PREFIX}/cart",        tags=["Cart"])
app.include_router(wishlist_router,  prefix=f"{PREFIX}/wishlist",    tags=["Wishlist"])
app.include_router(order_router,     prefix=f"{PREFIX}/orders",      tags=["Orders"])
app.include_router(upload_router,    prefix=f"{PREFIX}/upload",      tags=["Upload"])
app.include_router(admin_router,     prefix=f"{PREFIX}/admin",       tags=["Admin"])
app.include_router(attribute_router, prefix=f"{PREFIX}/attributes",  tags=["Attributes"])
app.include_router(blog_router,      prefix=f"{PREFIX}/blogs",       tags=["Blog"])
app.include_router(banner_router,    prefix=f"{PREFIX}/banners",     tags=["Banners"])
app.include_router(bulk_router,      prefix=f"{PREFIX}/bulk",        tags=["Bulk"])
app.include_router(cms_router,       prefix=f"{PREFIX}/cms",         tags=["CMS"])
app.include_router(payment_router,   prefix=f"{PREFIX}/payment",     tags=["Payment"])
app.include_router(settings_router,  prefix=f"{PREFIX}/settings",    tags=["Settings"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_ENV == "development",
        workers=1,
    )
