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

    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **values):
        super().__init__(**values)
        # Parse comma-separated origins from env
        raw = os.getenv("ALLOWED_ORIGINS", "")
        if raw:
            self.ALLOWED_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
