import cloudinary
import cloudinary.uploader
import cloudinary.api
from config.settings import settings


def init_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


init_cloudinary()


async def upload_image(file_bytes: bytes, folder: str = "marketpro/products", public_id: str = None) -> dict:
    """Upload image to Cloudinary and return URL info"""
    options = {
        "folder": folder,
        "transformation": [{"quality": "auto", "fetch_format": "auto"}],
        "overwrite": True,
    }
    if public_id:
        options["public_id"] = public_id

    result = cloudinary.uploader.upload(file_bytes, **options)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
        "format": result.get("format"),
    }


async def upload_from_url(image_url: str, folder: str = "marketpro/products") -> dict:
    """Upload image from remote URL"""
    result = cloudinary.uploader.upload(
        image_url,
        folder=folder,
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


async def delete_image(public_id: str) -> bool:
    """Delete image from Cloudinary"""
    result = cloudinary.uploader.destroy(public_id)
    return result.get("result") == "ok"


def get_optimized_url(public_id: str, width: int = 800, height: int = 800) -> str:
    """Get optimized Cloudinary URL"""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto",
        fetch_format="auto",
    )


def get_thumbnail_url(public_id: str, size: int = 200) -> str:
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=size,
        height=size,
        crop="thumb",
        gravity="auto",
        quality="auto",
        fetch_format="auto",
    )
