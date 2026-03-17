"""
Payment routes — Razorpay, Stripe, UPI
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from config.database import get_db
from config.settings import settings
from middleware.auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
import logging, json, hmac, hashlib

logger = logging.getLogger(__name__)
payment_router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────
class CreateRazorpayOrderSchema(BaseModel):
    amount: float           # in INR
    order_id: str           # our internal order id

class VerifyRazorpaySchema(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str           # our internal order id

class CreateStripeIntentSchema(BaseModel):
    amount: float           # in INR
    currency: str = "inr"
    order_id: str

class VerifyStripeSchema(BaseModel):
    payment_intent_id: str
    order_id: str

class UpiPaymentSchema(BaseModel):
    order_id: str
    utr_number: str         # UPI transaction reference number submitted by customer


def _safe_oid(v):
    try:
        if v and ObjectId.is_valid(str(v)):
            return ObjectId(str(v))
    except Exception:
        pass
    return None


# ─── Payment config (public) ─────────────────────────────────────────────────
@payment_router.get("/config")
async def get_payment_config():
    """Return public payment config to the frontend."""
    return {
        "success": True,
        "data": {
            "razorpay_key_id":          settings.RAZORPAY_KEY_ID or None,
            "stripe_publishable_key":   settings.STRIPE_PUBLISHABLE_KEY or None,
            "upi_id":                   settings.UPI_ID or None,
            "upi_name":                 settings.UPI_NAME or "MarketPro",
            "enabled": {
                "razorpay": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
                "stripe":   bool(settings.STRIPE_SECRET_KEY),
                "upi":      bool(settings.UPI_ID),
                "cod":      True,
            }
        }
    }


# ─── RAZORPAY ─────────────────────────────────────────────────────────────────
@payment_router.post("/razorpay/create-order")
async def razorpay_create_order(
    body: CreateRazorpayOrderSchema,
    user=Depends(get_current_user),
):
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(400, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env")

    try:
        import razorpay
    except ImportError:
        raise HTTPException(500, "razorpay package not installed. Run: pip install razorpay")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    # Razorpay amount is in paise (1 INR = 100 paise)
    amount_paise = int(body.amount * 100)

    rz_order = client.order.create({
        "amount":   amount_paise,
        "currency": "INR",
        "receipt":  body.order_id[:40],   # max 40 chars
        "notes":    {"marketpro_order_id": body.order_id},
    })

    return {
        "success": True,
        "data": {
            "razorpay_order_id": rz_order["id"],
            "amount":            rz_order["amount"],
            "currency":          rz_order["currency"],
            "key_id":            settings.RAZORPAY_KEY_ID,
        }
    }


@payment_router.post("/razorpay/verify")
async def razorpay_verify(
    body: VerifyRazorpaySchema,
    user=Depends(get_current_user),
):
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(400, "Razorpay not configured")

    # Verify signature
    payload     = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected_sig != body.razorpay_signature:
        raise HTTPException(400, "Invalid payment signature — possible fraud attempt")

    # Mark our order as paid
    db  = get_db()
    oid = _safe_oid(body.order_id)
    if oid:
        await db.orders.update_one(
            {"_id": oid, "user_id": str(user["_id"])},
            {"$set": {
                "payment_status":        "paid",
                "payment_method":        "razorpay",
                "razorpay_order_id":     body.razorpay_order_id,
                "razorpay_payment_id":   body.razorpay_payment_id,
                "paid_at":               datetime.utcnow(),
            }}
        )

    return {"success": True, "message": "Payment verified successfully"}


# ─── STRIPE ───────────────────────────────────────────────────────────────────
@payment_router.post("/stripe/create-intent")
async def stripe_create_intent(
    body: CreateStripeIntentSchema,
    user=Depends(get_current_user),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(400, "Stripe is not configured. Add STRIPE_SECRET_KEY to .env")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
    except ImportError:
        raise HTTPException(500, "stripe package not installed. Run: pip install stripe")

    # Stripe amount is in smallest currency unit (paise for INR)
    amount_paise = int(body.amount * 100)

    intent = stripe.PaymentIntent.create(
        amount=amount_paise,
        currency=body.currency,
        metadata={"order_id": body.order_id, "user_id": str(user["_id"])},
        automatic_payment_methods={"enabled": True},
    )

    return {
        "success": True,
        "data": {
            "client_secret":    intent.client_secret,
            "payment_intent_id": intent.id,
        }
    }


@payment_router.post("/stripe/verify")
async def stripe_verify(
    body: VerifyStripeSchema,
    user=Depends(get_current_user),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(400, "Stripe not configured")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
    except ImportError:
        raise HTTPException(500, "stripe not installed")

    intent = stripe.PaymentIntent.retrieve(body.payment_intent_id)

    if intent.status != "succeeded":
        raise HTTPException(400, f"Payment not successful — status: {intent.status}")

    # Mark order paid
    db  = get_db()
    oid = _safe_oid(body.order_id)
    if oid:
        await db.orders.update_one(
            {"_id": oid, "user_id": str(user["_id"])},
            {"$set": {
                "payment_status":        "paid",
                "payment_method":        "stripe",
                "stripe_payment_intent": body.payment_intent_id,
                "paid_at":               datetime.utcnow(),
            }}
        )

    return {"success": True, "message": "Stripe payment verified"}


@payment_router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
):
    """Stripe webhook endpoint — register in Stripe dashboard."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(400, "Webhook secret not configured")

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
    except ImportError:
        raise HTTPException(500, "stripe not installed")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid webhook signature")

    if event["type"] == "payment_intent.succeeded":
        intent   = event["data"]["object"]
        order_id = intent.get("metadata", {}).get("order_id")
        if order_id:
            db  = get_db()
            oid = _safe_oid(order_id)
            if oid:
                await db.orders.update_one(
                    {"_id": oid},
                    {"$set": {"payment_status": "paid", "paid_at": datetime.utcnow()}}
                )
            logger.info(f"Stripe webhook: order {order_id} marked paid")

    return {"success": True}


# ─── UPI ──────────────────────────────────────────────────────────────────────
@payment_router.get("/upi/details")
async def get_upi_details():
    """Return UPI ID and generate payment deep links."""
    if not settings.UPI_ID:
        return {"success": True, "data": {"enabled": False}}

    return {
        "success": True,
        "data": {
            "enabled":  True,
            "upi_id":   settings.UPI_ID,
            "upi_name": settings.UPI_NAME,
            # Deep link works on Android (opens any UPI app)
            "deep_link_template": f"upi://pay?pa={settings.UPI_ID}&pn={settings.UPI_NAME}&am={{amount}}&cu=INR&tn=MarketPro+Order",
        }
    }


@payment_router.post("/upi/confirm")
async def confirm_upi_payment(
    body: UpiPaymentSchema,
    user=Depends(get_current_user),
):
    """
    Customer submits their UPI UTR (transaction reference number).
    Admin must manually verify and confirm in the orders dashboard.
    """
    db  = get_db()
    oid = _safe_oid(body.order_id)
    if not oid:
        raise HTTPException(422, "Invalid order id")

    order = await db.orders.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not order:
        raise HTTPException(404, "Order not found")

    await db.orders.update_one(
        {"_id": oid},
        {"$set": {
            "payment_method":    "upi",
            "payment_status":    "pending_verification",  # admin confirms manually
            "upi_utr":           body.utr_number,
            "upi_submitted_at":  datetime.utcnow(),
        }}
    )

    return {
        "success": True,
        "message": "UPI payment reference submitted. We'll verify and confirm your order shortly."
    }
