"""
MarketPro — FastAPI Backend
Production-ready e-commerce REST API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
import uvicorn
import logging
import traceback

from config.database import connect_db, disconnect_db
from config.settings import settings
from routes import (
    auth_router, product_router, category_router, brand_router,
    cart_router, wishlist_router, order_router, upload_router,
    user_router, admin_router,
)

logging.basicConfig(
    level=logging.DEBUG if settings.APP_ENV == "development" else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


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
    description="Production-ready E-commerce REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Pass HTTPException through with its real status code."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return 422 with human-readable field errors instead of a silent 500."""
    errors = [
        f"{'->'.join(str(x) for x in e['loc'])}: {e['msg']}"
        for e in exc.errors()
    ]
    logger.warning(f"Validation error on {request.url}: {errors}")
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unexpected errors.
    Always logs full traceback. In development the real error is also
    returned in the response so you don't need to grep logs.
    """
    tb = traceback.format_exc()
    logger.error(
        f"Unhandled {type(exc).__name__} on {request.method} {request.url}\n{tb}"
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
async def health_check():
    return {"success": True, "message": "MarketPro API is running 🛒", "version": "1.0.0"}


# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = "/api"
app.include_router(auth_router,     prefix=f"{PREFIX}/auth",        tags=["Auth"])
app.include_router(user_router,     prefix=f"{PREFIX}/users",       tags=["Users"])
app.include_router(product_router,  prefix=f"{PREFIX}/products",    tags=["Products"])
app.include_router(category_router, prefix=f"{PREFIX}/categories",  tags=["Categories"])
app.include_router(brand_router,    prefix=f"{PREFIX}/brands",      tags=["Brands"])
app.include_router(cart_router,     prefix=f"{PREFIX}/cart",        tags=["Cart"])
app.include_router(wishlist_router, prefix=f"{PREFIX}/wishlist",    tags=["Wishlist"])
app.include_router(order_router,    prefix=f"{PREFIX}/orders",      tags=["Orders"])
app.include_router(upload_router,   prefix=f"{PREFIX}/upload",      tags=["Upload"])
app.include_router(admin_router,    prefix=f"{PREFIX}/admin",       tags=["Admin"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_ENV == "development",
        workers=1,
    )
