# from fastapi import Depends, HTTPException, status, APIRouter
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import JWTError, jwt
# from datetime import datetime, timedelta
# from passlib.context import CryptContext
# from config.settings import settings
# from config.database import get_db
# from bson import ObjectId
# from pydantic import BaseModel
# import logging

# router = APIRouter()

# logger = logging.getLogger(__name__)

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# bearer_scheme = HTTPBearer()


# # ── Password Helpers ─────────────────────────────────────────────
# def _trunc(password: str) -> str:
#     return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


# def hash_password(password: str) -> str:
#     return pwd_context.hash(_trunc(password))


# def verify_password(plain: str, hashed: str) -> bool:
#     return pwd_context.verify(_trunc(plain), hashed)


# # ── JWT Helpers ──────────────────────────────────────────────────
# def create_access_token(data: dict) -> str:
#     payload = data.copy()
#     payload["exp"] = datetime.utcnow() + timedelta(
#         minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
#     )
#     payload["type"] = "access"
#     return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# def create_refresh_token(data: dict) -> str:
#     payload = data.copy()
#     payload["exp"] = datetime.utcnow() + timedelta(
#         days=settings.REFRESH_TOKEN_EXPIRE_DAYS
#     )
#     payload["type"] = "refresh"
#     return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


# def decode_token(token: str) -> dict:
#     try:
#         return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or expired token",
#         )


# # ── Dependencies ─────────────────────────────────────────────────
# async def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
# ):
#     token = credentials.credentials
#     payload = decode_token(token)
#     user_id = payload.get("sub")

#     if not user_id:
#         raise HTTPException(status_code=401, detail="Invalid token payload")

#     db = get_db()
#     user = await db.users.find_one({"_id": ObjectId(user_id)})

#     if not user:
#         raise HTTPException(status_code=401, detail="User not found")

#     if not user.get("is_active", True):
#         raise HTTPException(status_code=403, detail="Account disabled")

#     user["id"] = str(user["_id"])
#     return user


# async def get_admin_user(current_user: dict = Depends(get_current_user)):
#     if current_user.get("role") not in ("admin", "superadmin"):
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return current_user


# async def get_optional_user(
#     credentials: HTTPAuthorizationCredentials = Depends(
#         HTTPBearer(auto_error=False)
#     ),
# ):
#     if not credentials:
#         return None
#     try:
#         return await get_current_user(credentials)
#     except Exception:
#         return None


# # ── Request Models ───────────────────────────────────────────────
# class LoginRequest(BaseModel):
#     email: str
#     password: str


# # ── Routes (THIS WAS MISSING) ────────────────────────────────────
# @router.get("/check")
# async def check():
#     return {"success": True, "message": "Auth working ✅"}


# @router.post("/login")
# async def login(data: LoginRequest):
#     db = get_db()

#     user = await db.users.find_one({"email": data.email})

#     if not user:
#         raise HTTPException(status_code=400, detail="Invalid email or password")

#     if not verify_password(data.password, user["password"]):
#         raise HTTPException(status_code=400, detail="Invalid email or password")

#     access_token = create_access_token({"sub": str(user["_id"])})
#     refresh_token = create_refresh_token({"sub": str(user["_id"])})

#     return {
#         "success": True,
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "user": {
#             "id": str(user["_id"]),
#             "email": user["email"],
#             "role": user.get("role", "user"),
#         },
#     }


from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from config.settings import settings
from config.database import get_db
from bson import ObjectId
from pydantic import BaseModel
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


# ── Password Helpers ─────────────────────────────────────────────
def _trunc(password: str) -> str:
    # IMPORTANT: bcrypt only supports 72 bytes → truncate safely
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    # Always truncate before hashing
    return pwd_context.hash(_trunc(password))


def verify_password(plain: str, hashed: str) -> bool:
    # ✅ FIX: handle bcrypt 72-byte error safely
    try:
        return pwd_context.verify(_trunc(plain), hashed)
    except ValueError:
        # If password too long or bad hash → return False instead of crashing
        return False


# ── JWT Helpers ──────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload["type"] = "access"
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload["type"] = "refresh"
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# ── Dependencies ─────────────────────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")

    user["id"] = str(user["_id"])
    return user


async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        HTTPBearer(auto_error=False)
    ),
):
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except Exception:
        return None


# ── Request Models ───────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


# ── Routes ───────────────────────────────────────────────────────
@router.get("/check")
async def check():
    return {"success": True, "message": "Auth working ✅"}


@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()

    user = await db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # uses updated verify_password (safe now)
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token = create_access_token({"sub": str(user["_id"])})
    refresh_token = create_refresh_token({"sub": str(user["_id"])})

    return {
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "user"),
        },
    }