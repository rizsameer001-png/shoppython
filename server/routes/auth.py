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
#     # IMPORTANT: bcrypt only supports 72 bytes → truncate safely
#     return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


# def hash_password(password: str) -> str:
#     # Always truncate before hashing
#     return pwd_context.hash(_trunc(password))


# def verify_password(plain: str, hashed: str) -> bool:
#     # ✅ FIX: handle bcrypt 72-byte error safely
#     try:
#         return pwd_context.verify(_trunc(plain), hashed)
#     except ValueError:
#         # If password too long or bad hash → return False instead of crashing
#         return False


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


# # ── Routes ───────────────────────────────────────────────────────
# @router.get("/check")
# async def check():
#     return {"success": True, "message": "Auth working ✅"}


# @router.post("/login")
# async def login(data: LoginRequest):
#     db = get_db()

#     user = await db.users.find_one({"email": data.email})

#     if not user:
#         raise HTTPException(status_code=400, detail="Invalid email or password")

#     # uses updated verify_password (safe now)
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

#     # ── Register Route ──────────────────────────────────────────────
# @router.post("/register")
# async def register(data: LoginRequest):
#     db = get_db()

#     # 🔍 Check if user already exists
#     existing_user = await db.users.find_one({"email": data.email})
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     # 🔐 Hash password
#     hashed_password = hash_password(data.password)

#     # 👤 Create user
#     user_data = {
#         "name": data.email.split("@")[0],
#         "email": data.email,
#         "password": hashed_password,
#         "role": "user",
#         "is_active": True,
#     }

#     result = await db.users.insert_one(user_data)

#     # 🎟 Auto login after register
#     access_token = create_access_token({"sub": str(result.inserted_id)})
#     refresh_token = create_refresh_token({"sub": str(result.inserted_id)})

#     return {
#         "success": True,
#         "message": "User registered successfully",
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "user": {
#             "id": str(result.inserted_id),
#             "email": user_data["email"],
#             "role": user_data["role"],
#         },
#     }


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

# # ── Password Helpers (ULTRA SAFE FIX) ─────────────────────────────
# def _trunc(password: str) -> str:
#     return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


# def hash_password(password: str) -> str:
#     try:
#         safe_password = password.encode("utf-8")[:72].decode("utf-8", "ignore")
#         return pwd_context.hash(safe_password)
#     except Exception as e:
#         logger.error(f"Hash error: {e}")
#         raise HTTPException(status_code=500, detail="Password hashing failed")


# def verify_password(plain: str, hashed: str) -> bool:
#     try:
#         safe_plain = plain.encode("utf-8")[:72].decode("utf-8", "ignore")
#         return pwd_context.verify(safe_plain, hashed)
#     except Exception as e:
#         logger.warning(f"Verify error: {e}")
#         return False


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


# # ── Routes ───────────────────────────────────────────────────────
# @router.get("/check")
# async def check():
#     return {"success": True, "message": "Auth working ✅"}


# # 🔐 LOGIN
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


# # 🆕 REGISTER
# @router.post("/register")
# async def register(data: LoginRequest):
#     db = get_db()

#     # check existing user
#     existing_user = await db.users.find_one({"email": data.email})
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     # hash password safely
#     hashed_password = hash_password(data.password)

#     user_data = {
#         "name": data.email.split("@")[0],
#         "email": data.email,
#         "password": hashed_password,
#         "role": "user",
#         "is_active": True,
#     }

#     result = await db.users.insert_one(user_data)

#     # auto login
#     access_token = create_access_token({"sub": str(result.inserted_id)})
#     refresh_token = create_refresh_token({"sub": str(result.inserted_id)})

#     return {
#         "success": True,
#         "message": "User registered successfully",
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "user": {
#             "id": str(result.inserted_id),
#             "email": user_data["email"],
#             "role": user_data["role"],
#         },
#     }



from fastapi import APIRouter, HTTPException, Depends
from config.database import get_db
from middleware.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user, decode_token
)
from models.schemas import RegisterSchema, LoginSchema
from datetime import datetime
from bson import ObjectId

router = APIRouter()


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "customer"),
        "avatar": user.get("avatar"),
        "phone": user.get("phone"),
        "addresses": user.get("addresses", []),
        "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else "",
    }


@router.post("/register")
async def register(body: RegisterSchema):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "phone": body.phone,
        "role": "customer",
        "is_active": True,
        "addresses": [],
        "avatar": None,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    uid = str(result.inserted_id)
    return {
        "success": True,
        "message": "Registration successful",
        "data": {
            "access_token": create_access_token({"sub": uid}),
            "refresh_token": create_refresh_token({"sub": uid}),
            "token_type": "bearer",
            "user": serialize_user(user_doc),
        },
    }


@router.post("/login")
async def login(body: LoginSchema):
    db = get_db()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")

    uid = str(user["_id"])
    return {
        "success": True,
        "data": {
            "access_token": create_access_token({"sub": uid}),
            "refresh_token": create_refresh_token({"sub": uid}),
            "token_type": "bearer",
            "user": serialize_user(user),
        },
    }


@router.post("/refresh")
async def refresh_token(body: dict):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid token type")
    uid = payload.get("sub")
    return {
        "success": True,
        "data": {
            "access_token": create_access_token({"sub": uid}),
            "token_type": "bearer",
        },
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"success": True, "data": serialize_user(current_user)}


@router.post("/logout")
async def logout():
    # JWT is stateless; client deletes token
    return {"success": True, "message": "Logged out successfully"}

@router.post("/reset-password")
async def reset_password(body: dict):
    """
    Allows user to reset password with email + new password.
    Use this to fix accounts that have broken password hashes.
    """
    db = get_db()
    email = body.get("email", "").strip().lower()
    new_password = body.get("new_password", "")
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="email and new_password required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_hash = hash_password(new_password)
    await db.users.update_one(
        {"email": email},
        {"$set": {"password": new_hash}}
    )
    uid = str(user["_id"])
    return {
        "success": True,
        "message": "Password updated. You can now login.",
        "data": {
            "access_token": create_access_token({"sub": uid}),
            "refresh_token": create_refresh_token({"sub": uid}),
            "token_type": "bearer",
            "user": serialize_user(user),
        }
    }

