# Windows Setup & Startup Guide — MarketPro Server

## ✅ Correct Start Commands

### Development (auto-reload on file save)
```cmd
cd D:\0python\3\server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production (no reload, multiple workers on Linux/Mac only)
```cmd
uvicorn main:app --host 0.0.0.0 --port 8000
```

> ⚠️ **Never use** `app.main:app` — the project has no `app/` subfolder.
> The correct module is just `main:app` (the `main.py` file at root of `server/`).

---

## 📁 Folder Structure (your server folder must look like this)

```
D:\0python\3\server\          ← cd into THIS folder before running uvicorn
    main.py                   ← this is the entry point
    requirements.txt
    .env
    config\
        __init__.py
        database.py
        settings.py
        cloudinary_config.py
    routes\
        __init__.py
        auth.py
        products.py
        misc.py
        new_features.py
    models\
        __init__.py
        schemas.py
    middleware\
        __init__.py
        auth.py
    utils\
        __init__.py
        helpers.py
```

---

## 🔧 First-Time Windows Setup

### Step 1 — Create and activate virtual environment
```cmd
cd D:\0python\3\server
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your prompt after activation.

### Step 2 — Install dependencies
```cmd
pip install -r requirements.txt
```

### Step 3 — Create `.env` file
Copy `.env.example` to `.env` and fill in your values:
```cmd
copy .env.example .env
```

Open `.env` in Notepad and set:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/marketpro
JWT_SECRET=any_long_random_string_at_least_32_characters
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
APP_ENV=development
```

### Step 4 — Seed the database (first time only)
```cmd
python seed.py
```
This creates the admin user and 8 sample products.

Admin login: `admin@marketpro.com` / `Admin@123456`

### Step 5 — Start the server
```cmd
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/api/docs` to see the Swagger API docs.

---

## ❌ Common Windows Errors & Fixes

### Error: `ModuleNotFoundError: No module named 'app'`
```
WRONG:  uvicorn app.main:app --reload
RIGHT:  uvicorn main:app --reload
```
You must `cd` into the `server/` folder first, then run `uvicorn main:app`.

---

### Error: `ModuleNotFoundError: No module named 'config'` or `No module named 'routes'`
You are running uvicorn from the wrong directory.

```cmd
# Wrong — running from parent folder
D:\0python\3> uvicorn server.main:app

# Correct — cd into server first
D:\0python\3> cd server
D:\0python\3\server> uvicorn main:app --reload
```

---

### Error: `DeprecationWarning: There is no current event loop`
This happens on Python 3.10+ with old `asyncio.get_event_loop()` calls.
The fix is already applied in `cloudinary_config.py` — it now uses
`asyncio.get_running_loop()` which is correct for Python 3.8 through 3.13.

If you still see it from another library, add this at the top of `main.py`:
```python
import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

---

### Error: `No module named 'uvicorn'` or any package
You forgot to activate the virtual environment:
```cmd
cd D:\0python\3\server
venv\Scripts\activate      # must see (venv) in prompt
uvicorn main:app --reload
```

---

### Error: `[WinError 10048] Only one usage of each socket address`
Port 8000 is already in use. Either:
- Use a different port: `uvicorn main:app --reload --port 8001`
- Or find and kill the process using port 8000:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID_number> /F
```

---

### Error: `pymongo.errors.ServerSelectionTimeoutError`
MongoDB connection failed. Check:
1. Your `MONGODB_URL` in `.env` is correct
2. Your IP address is whitelisted in MongoDB Atlas Network Access
3. The cluster is not paused (free tier pauses after inactivity)

---

### Error: `cloudinary.exceptions.AuthorizationRequired`
Cloudinary credentials missing. Check your `.env`:
```
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

---

### Windows + Python 3.12 asyncio issue
Python 3.12 on Windows changed the default event loop policy.
If you see asyncio-related errors, add this to the very top of `main.py`:

```python
import asyncio
import sys

# Windows Python 3.12+ compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

---

## 🔄 Daily Workflow

```cmd
# Open a terminal, navigate to server folder
cd D:\0python\3\server

# Activate virtual environment
venv\Scripts\activate

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Open another terminal for the React client
cd D:\0python\3\client
npm run dev
```

Server: `http://localhost:8000`
API Docs: `http://localhost:8000/api/docs`
React App: `http://localhost:5173`
Admin: `http://localhost:5173/admin`
