# Therapy Listener Portal - Frontend

A Next.js application for therapists/listeners to receive and respond to incoming chat messages from users.

## Features

- **Listener Registration & Authentication**: Secure registration and login system for listeners
- **Real-time Chat**: WebSocket-based messaging using Socket.IO
- **Conversation Management**: View and manage multiple active conversations
- **Message History**: Load and display conversation history
- **Connection Status**: Visual indicator showing connection status
- **Responsive Design**: Clean, modern UI built with Tailwind CSS

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for REST API calls

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API server running (default: http://localhost:8001)
- Socket.IO server running (default: http://localhost:8000)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create or edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
chat-listner-page/
├── app/
│   ├── page.tsx           # Landing page
│   ├── register/
│   │   └── page.tsx       # Listener registration
│   ├── login/
│   │   └── page.tsx       # Listener login
│   └── chat/
│       └── page.tsx       # Main chat interface
├── hooks/
│   └── useChat.ts         # Custom hook for Socket.IO
├── lib/
│   └── api.ts             # API client utilities
├── types/
│   └── index.ts           # TypeScript type definitions
└── components/            # Reusable components (if needed)
```

## Usage

### 1. Register as a Listener
- Navigate to `/register`
- Fill in your details (email, password, name, phone, age)
- Submit to create your account

### 2. Login
- Navigate to `/login`
- Enter your credentials
- You'll be redirected to the chat interface

### 3. Chat Interface
- **Left Sidebar**: Shows all active conversations
- **Main Area**: Display messages for selected conversation
- **Message Input**: Type and send messages
- **Connection Status**: Green dot indicates active WebSocket connection
- **Auto-join**: Automatically joins new conversations when messages arrive

## API Integration

The app integrates with two backend services:

### REST API (Port 8001)
- `/auth/register` - Register new listener
- `/auth/login` - Login listener
- `/auth/me` - Get current listener info
- `/conversations/{id}/messages` - Load message history

### Socket.IO Server (Port 8000)
- `connect` - Establish WebSocket connection
- `join_conversation` - Join a specific conversation room
- `send_message` - Send a message to a conversation
- `message` - Listen for incoming messages
- `leave_conversation` - Leave a conversation room

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend REST API URL | http://localhost:8001 |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | http://localhost:8000 |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Notes

- Authentication tokens are stored in localStorage as `listener_token`
- WebSocket connection uses the listener's login_id for identification
- Messages are stored in MongoDB via the backend API
- The app uses the App Router (Next.js 13+) with client-side components

## Future Enhancements

- Push notifications for new messages
- Typing indicators
- Read receipts
- User profiles with avatars
- Message reactions
- File/image sharing
- Audio/video call support
- Analytics dashboard
