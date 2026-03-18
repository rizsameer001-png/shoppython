from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017/marketpro"
    JWT_SECRET: str = "change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_UPLOAD_PRESET: str = "marketpro_unsigned"

    # Stored as a plain string — parsed into a list manually in __init__
    # This avoids pydantic-settings v2 trying to JSON-parse the env var
    ALLOWED_ORIGINS_STR: str = (
        "https://shoppy-jhpy.onrender.com,"
        "http://localhost:5173,"
        "http://localhost:3000"
    )

    ADMIN_EMAIL: str = "admin@marketpro.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    APP_ENV: str = "development"

    # Payment gateways
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    UPI_ID: str = ""
    UPI_NAME: str = "MarketPro Store"

    # Parsed list — populated in __init__, never read directly from env
    ALLOWED_ORIGINS: List[str] = []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Tell pydantic-settings to ignore ALLOWED_ORIGINS as an env field
        # so it doesn't try to JSON-parse it
        extra = "ignore"

    def __init__(self, **values):
        super().__init__(**values)
        # Check for ALLOWED_ORIGINS env var (plain comma-separated string)
        # Falls back to ALLOWED_ORIGINS_STR default
        raw = os.getenv("ALLOWED_ORIGINS", "") or self.ALLOWED_ORIGINS_STR
        self.ALLOWED_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
