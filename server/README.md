# Zetra Backend API

Real-time video calling platform backend built with Node.js, Express, Socket.io, and MongoDB.

## Features

- ✅ User authentication (register, login, JWT tokens)
- ✅ Password management (change password)
- ✅ User profile management
- ✅ Room creation and management
- ✅ WebRTC signaling via Socket.io
- ✅ Call logging and statistics
- ✅ Comprehensive error handling
- ✅ Request validation and sanitization
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers
- ✅ Structured logging
- ✅ Graceful shutdown

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Custom middleware

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /change-password` - Change password (requires auth)

### User (`/api/user`)

- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `DELETE /account` - Delete user account (requires auth)

### Room (`/api/room`)

- `POST /create` - Create new room (requires auth)
- `POST /join/:roomId` - Join existing room (requires auth)

### Call Logs (`/api/call-logs`)

- `GET /` - Get user call logs (requires auth)
- `POST /` - Create call log (requires auth)
- `PUT /:roomId/end` - End call log (requires auth)
- `GET /stats` - Get call statistics (requires auth)

### Health Check

- `GET /health` - Server health status

## Socket.io Events

### Client → Server

- `join-room` - Join a room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `chat-message` - Send chat message

### Server → Client

- `user-connected` - User joined room
- `user-disconnected` - User left room
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `chat-message` - Receive chat message
- `error` - Error notification

## Environment Variables

Required:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

Optional:
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `SOCKET_URL` - Socket.io server URL
- `NEXT_PUBLIC_API_BASE_URL` - Frontend URL for CORS
- `TURN_SERVER_URL` - TURN server URL
- `TURN_SERVER_USERNAME` - TURN server username
- `TURN_SERVER_CREDENTIAL` - TURN server password

## Error Handling

All endpoints include comprehensive error handling:

- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Rate limit errors (429)
- Server errors (500)

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- CORS configuration
- Security headers (XSS, CSRF protection)
- Input sanitization
- Request validation

## Logging

Structured logging with different levels:
- `info` - General information
- `warn` - Warnings
- `error` - Errors with stack traces
- `debug` - Debug information (development only)

## Database Models

### User
- username (unique)
- email (unique)
- passwordHash
- createdAt

### Room
- roomId (unique)
- participants (array of user IDs)
- active (boolean)
- createdAt

### CallLog
- callerId (user ID)
- receiverId (user ID)
- roomId
- startTime
- endTime
- duration

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev:backend

# Run with frontend
npm run dev
```

## Production

```bash
# Build
npm run build

# Start server
npm start
```

## Graceful Shutdown

The server handles graceful shutdown on:
- SIGTERM
- SIGINT (Ctrl+C)

Closes:
1. HTTP server
2. Database connections
3. Socket.io connections
