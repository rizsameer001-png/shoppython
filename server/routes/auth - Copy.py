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
