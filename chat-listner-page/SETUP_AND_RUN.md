# Listener App Setup and Run Guide

This guide explains how to set up and run the complete Listener application.

## System Overview

The Listener app consists of two parts:
1. **Backend (chat-service)** - Port 8000
   - FastAPI REST API endpoints (auth, messages)
   - Socket.IO WebSocket server (real-time messaging)
   - MongoDB database (listeners, messages)

2. **Frontend (chat-listener-page)** - Port 3000
   - Next.js React application
   - Listener interface with real-time chat

## Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB running (default: localhost:27017)
- Redis running (default: localhost:6379)

## Part 1: Setup and Run Backend (chat-service)

### Step 1: Navigate to chat-service directory

```bash
cd /home/ec2-user/therapy-bro/chat-service
```

### Step 2: Create/Activate Python Environment

**Option A: Using Conda**
```bash
conda create -n tb_chat_env python=3.11
conda activate tb_chat_env
```

**Option B: Using venv**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI & Uvicorn (web framework)
- Socket.IO (WebSocket)
- Motor (async MongoDB driver)
- Redis (caching/pub-sub)
- Passlib (password hashing)
- Python-Jose (JWT authentication)

### Step 4: Configure Environment Variables

Check/edit the `.env` file in chat-service directory:

```bash
cat .env
```

Should contain:
```
MONGO_URI=mongodb://localhost:27017/chatdb
REDIS_URL=redis://localhost:6379
JWT_SECRET=mysecretkey123
```

**Important:** Change `JWT_SECRET` to a secure random string in production!

### Step 5: Start the Backend Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start on **http://localhost:8000**

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Verify Backend is Running

Open another terminal and test:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

Or visit in browser:
- API Docs: http://localhost:8000/docs
- API Endpoints:
  - POST http://localhost:8000/api/auth/register
  - POST http://localhost:8000/api/auth/login
  - GET http://localhost:8000/api/auth/me

---

## Part 2: Setup and Run Frontend (chat-listener-page)

### Step 1: Navigate to frontend directory

```bash
cd /home/ec2-user/therapy-bro/chat-listner-page
```

### Step 2: Install Node Dependencies (if not done already)

```bash
npm install
```

### Step 3: Verify Environment Configuration

Check `.env.local` file:

```bash
cat .env.local
```

Should contain:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### Step 4: Start the Frontend

```bash
npm run dev
```

The frontend will start on **http://localhost:3000**

You should see:
```
  ▲ Next.js 15.5.5
  - Local:        http://localhost:3000
  - Ready in X.Xs
```

---

## Testing the Application

### 1. Open the Frontend

Open your browser and go to: http://localhost:3000

You should see the Therapy Listener Portal landing page.

### 2. Register a New Listener

1. Click **"Register Now"**
2. Fill in the form:
   - Login ID (Email): `listener@example.com`
   - Password: `password123`
   - Full Name: `John Listener`
   - Phone (optional): `+1234567890`
   - Age (optional): `30`
3. Click **"Register"**

You'll be automatically logged in and redirected to the chat interface.

### 3. Login (if already registered)

1. Click **"Login"**
2. Enter your credentials
3. Click **"Login"**

### 4. Chat Interface

Once logged in, you'll see:
- **Left sidebar**: Active conversations
- **Main area**: Message display
- **Bottom**: Message input field
- **Top right**: Connection status (green = connected)

The listener is now ready to receive messages!

---

## Running Both Services Together

Use two terminal windows:

**Terminal 1 - Backend:**
```bash
cd /home/ec2-user/therapy-bro/chat-service
conda activate tb_chat_env  # or your venv
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd /home/ec2-user/therapy-bro/chat-listner-page
npm run dev
```

**Access Points:**
- Frontend UI: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Troubleshooting

### Port 8000 Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### MongoDB Connection Error

Make sure MongoDB is running:
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

Or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Redis Connection Error

Make sure Redis is running:
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

Or use Docker:
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Frontend Can't Connect to Backend

1. Check backend is running on port 8000
2. Check `.env.local` has correct URL
3. Clear browser cache and localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

### CORS Errors

The backend allows all origins for development. If you see CORS errors:
1. Check backend logs for errors
2. Make sure you're accessing frontend from http://localhost:3000 (not 127.0.0.1)

---

## Database Collections

The backend uses MongoDB with the following collections:

### `listeners` collection
Stores listener accounts:
```json
{
  "_id": ObjectId,
  "login_id": "listener@example.com",
  "password_hash": "hashed_password",
  "name": "John Listener",
  "phone": "+1234567890",
  "age": 30,
  "created_at": ISODate
}
```

### `messages` collection
Stores chat messages:
```json
{
  "_id": ObjectId,
  "conversation_id": "conv_123",
  "sender_id": "listener@example.com",
  "content": "Hello, how can I help?",
  "metadata": {},
  "sent_at": ISODate,
  "status": "sent"
}
```

---

## Production Deployment

For production:

1. **Backend:**
   ```bash
   # Use production server
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. **Frontend:**
   ```bash
   npm run build
   npm start
   ```

3. **Environment:**
   - Change `JWT_SECRET` to a secure random string
   - Update `MONGO_URI` to production MongoDB
   - Update `REDIS_URL` to production Redis
   - Set proper CORS origins in backend
   - Use HTTPS for both services

---

## Quick Command Reference

```bash
# Start backend
cd /home/ec2-user/therapy-bro/chat-service && uvicorn app.main:app --port 8000 --reload

# Start frontend
cd /home/ec2-user/therapy-bro/chat-listner-page && npm run dev

# Check backend health
curl http://localhost:8000/health

# View backend API docs
open http://localhost:8000/docs

# View frontend
open http://localhost:3000
```

Your Listener application is now ready to use!
