"""
Cloudinary helpers — all upload/delete calls are wrapped in
asyncio.get_event_loop().run_in_executor() so they never block
the FastAPI async event loop (which caused the "ghost 500" on first call).

Root cause of the ghost 500
────────────────────────────
The cloudinary SDK's uploader.upload() / uploader.destroy() are
*synchronous* HTTP calls (using urllib3). Calling them bare inside an
`async def` function does NOT make them async — they block the single
thread that runs the entire asyncio event loop. On the very first call:

  1. FastAPI starts handling the request on the event loop thread.
  2. cloudinary.uploader.upload() blocks that thread for ~1-3 seconds.
  3. Motor (MongoDB async driver) has pending callbacks that need the
     event loop to be free so they can complete their own awaits.
  4. Those callbacks time out / raise, causing a 500 BEFORE the
     Cloudinary call even finishes.
  5. The DB write already succeeded (it was awaited before the block),
     so on refresh the record is there — the "ghost" effect.

Fix: run every sync Cloudinary call in a ThreadPoolExecutor so the
event loop thread is never blocked.
"""
import asyncio
from functools import partial
import cloudinary
import cloudinary.uploader
import cloudinary.api
from config.settings import settings
import logging

logger = logging.getLogger(__name__)


def init_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


init_cloudinary()


async def _run_sync(func, *args, **kwargs):
    """
    Run a synchronous function in a thread-pool executor so it never
    blocks the asyncio event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(func, *args, **kwargs))


async def upload_image(
    file_bytes: bytes,
    folder: str = "marketpro/products",
    public_id: str = None,
) -> dict:
    """Upload raw bytes to Cloudinary — non-blocking."""
    options = {
        "folder": folder,
        "transformation": [{"quality": "auto", "fetch_format": "auto"}],
        "overwrite": True,
    }
    if public_id:
        options["public_id"] = public_id

    # ✅ run_in_executor — sync SDK call moved off the event loop thread
    result = await _run_sync(cloudinary.uploader.upload, file_bytes, **options)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
    }


async def upload_from_url(image_url: str, folder: str = "marketpro/products") -> dict:
    """Upload an image from a remote URL — non-blocking."""
    options = {
        "folder": folder,
        "transformation": [{"quality": "auto", "fetch_format": "auto"}],
    }
    # ✅ run_in_executor
    result = await _run_sync(cloudinary.uploader.upload, image_url, **options)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str) -> bool:
    """Delete an asset from Cloudinary — non-blocking."""
    # ✅ run_in_executor
    result = await _run_sync(cloudinary.uploader.destroy, public_id)
    return result.get("result") == "ok"


def get_optimized_url(public_id: str, width: int = 800, height: int = 800) -> str:
    """Pure URL construction — no network call, safe to call directly."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto",
        fetch_format="auto",
    )


def get_thumbnail_url(public_id: str, size: int = 200) -> str:
    """Pure URL construction — no network call, safe to call directly."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=size,
        height=size,
        crop="thumb",
        gravity="auto",
        quality="auto",
        fetch_format="auto",
    )
