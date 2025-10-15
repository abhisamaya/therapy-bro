# Quick Start Guide

## Running the Listener Portal

### 1. Start the Backend Services

First, make sure both backend services are running:

#### Start the Chat Service (Socket.IO - Port 8000)
```bash
cd ../chat-service
# Activate your conda environment if needed
conda activate tb_chat_env
# Start the Socket.IO server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Start the Main Backend (REST API - Port 8001)
```bash
cd ../backend
# Start the FastAPI backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Start the Listener Frontend

```bash
# Make sure you're in the chat-listner-page directory
npm run dev
```

The app will be available at: http://localhost:3000

### 3. Test the Application

1. **Register a Listener**:
   - Open http://localhost:3000
   - Click "Register Now"
   - Fill in the form with your details
   - Submit to create your account

2. **Login**:
   - You'll be automatically logged in after registration
   - Or click "Login" and enter your credentials

3. **Test Messaging**:
   - Open the existing chat testing frontend (if available)
   - Send messages from a user to the listener
   - Watch them appear in real-time in the listener portal

### Troubleshooting

**Port conflicts:**
- Chat Service should be on port 8000
- Main Backend should be on port 8001
- Frontend runs on port 3000

**Connection issues:**
- Check `.env.local` has the correct URLs
- Verify both backend services are running
- Check browser console for errors

**Authentication issues:**
- Clear localStorage: `localStorage.removeItem('listener_token')`
- Re-register or login again

### Environment Configuration

Make sure `.env.local` exists with:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### Development Tips

- The app uses WebSocket for real-time communication
- Messages are automatically synced when they arrive
- The connection status indicator shows if Socket.IO is connected
- All conversations are stored in MongoDB
