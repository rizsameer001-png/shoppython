# MarketPro — Python FastAPI Server

Production-ready REST API for the MarketPro e-commerce platform.

## Stack
- **FastAPI** — async Python web framework
- **Motor** — async MongoDB driver
- **Cloudinary** — image/video storage
- **JWT** — stateless auth (access + refresh tokens)
- **Pydantic v2** — validation

## Project Structure
```
server/
├── main.py                  # FastAPI app entry point
├── seed.py                  # DB seed script (run once)
├── requirements.txt
├── render.yaml              # Render deployment config
├── .env.example             # Copy to .env and fill in
├── config/
│   ├── settings.py          # Env-based settings (Pydantic)
│   ├── database.py          # MongoDB connection + indexes
│   └── cloudinary_config.py # Cloudinary helpers
├── middleware/
│   └── auth.py              # JWT auth, password hashing
├── models/
│   └── schemas.py           # Pydantic request/response schemas
├── routes/
│   ├── auth.py              # /api/auth/*
│   ├── products.py          # /api/products/*
│   └── misc.py              # categories, brands, cart, wishlist, orders, admin
└── utils/
    └── helpers.py           # Slug, pagination, ObjectId helpers
```

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB, Cloudinary, JWT values

# 4. Seed the database (creates admin + sample data)
python seed.py

# 5. Run development server
uvicorn main:app --reload --port 8000

   Admin login: admin@marketpro.com / Admin@123456
   Run the server: uvicorn main:app --reload

netstat -ano | findstr :8000
netstat -ano | findstr :5173
taskkill /F /PID 12680
aman@demo.com
123456

```

-----------------------------------------------------
1. {name: "ajju", email: "ajju@demo.com", password: "12345678", phone: ""}
   1. email: "ajju@demo.com"
   2. name: "ajju"
   3. password: "12345678"
   4. phone: ""   {
    "success": false,
    "message": "ValueError: password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])"
}
---------------------------------------------------
422
Unprocessable Entity (WebDAV) (RFC 4918)


ClientException:Failed to fetch,uri=https://shoppython.onrender.com/api/auth/login
----------------------------------------------------------------------------
The ImportError: cannot import name 'PYDANTIC_V2' occurs because you have a mismatch between your FastAPI version and your Pydantic version. Specifically, FastAPI 0.111.0 expects Pydantic to be structured a certain way, but since the previous installation failed/partially updated, the "glue" code (_compat) is broken
pip install --upgrade fastapi pydantic pydantic-settings uvicorn
--------------------------------------------------------------------------
How to Fix the "Ghost" 500 Error first time it throw errors but after refresh it added in list and working edit the database operation succeeds, but the code that runs after the save (like returning the data or processing a cloud upload) is failing.
This is a classic async/await race condition + response serialization bug in FastAPI + Motor (MongoDB async driver). Let me diagnose and fix all the root causes.
This is a very specific behavior! Since the record actually gets added but the server initially reported a 500 error, we are looking at a "Post-Save" crash.

Essentially, the database operation succeeds, but the code that runs after the save (like returning the data or processing a cloud upload) is failing.




-------------------------------------
Open **http://localhost:8000/api/docs** for interactive Swagger UI.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET  | `/api/auth/me` | Get current user (auth required) |
| GET  | `/api/products` | List products (filters, pagination) |
| GET  | `/api/products/:id` | Single product detail |
| POST | `/api/products` | Create product (admin) |
| PUT  | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET  | `/api/categories` | All categories + subcategories |
| POST | `/api/categories` | Create category (admin) |
| GET  | `/api/brands` | All brands |
| POST | `/api/brands` | Create brand (admin) |
| GET  | `/api/cart` | Get user cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT  | `/api/cart/:product_id` | Update cart item quantity |
| DELETE | `/api/cart` | Clear cart |
| GET  | `/api/wishlist` | Get user wishlist |
| POST | `/api/wishlist/toggle` | Toggle wishlist item |
| GET  | `/api/orders` | Get user orders |
| POST | `/api/orders` | Place order (from cart) |
| GET  | `/api/orders/:id` | Order detail |
| POST | `/api/orders/:id/return` | Request return |
| POST | `/api/upload/images` | Upload images to Cloudinary (admin) |
| POST | `/api/upload/image-url` | Upload from URL to Cloudinary (admin) |
| DELETE | `/api/upload` | Delete Cloudinary asset (admin) |
| GET  | `/api/admin/dashboard` | Admin dashboard stats |
| GET  | `/api/admin/orders` | All orders (admin) |
| PUT  | `/api/admin/orders/:id/status` | Update order status (admin) |
| GET  | `/api/admin/customers` | All customers (admin) |
| GET  | `/api/admin/wishlist-stats` | Wishlist stats per product (admin) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs |
| `ADMIN_EMAIL` | Default admin email |
| `ADMIN_PASSWORD` | Default admin password |

## Deploy on Render

1. Push `server/` folder to a GitHub repo
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repo, set root directory to `.`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables in Render dashboard
7. Deploy!

## Flutter Integration

All responses follow this consistent format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

Use `Bearer <access_token>` in the `Authorization` header for protected routes.
On 401, call `/api/auth/refresh` with the refresh token to get a new access token.
