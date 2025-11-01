# Zetra — Real-Time Video Calling Platform

Zetra is a real-time video calling platform built using WebRTC, Next.js, TypeScript, and Node.js.  
It enables high-quality peer-to-peer video communication with secure authentication and scalable backend architecture.

---

## Features

- Peer-to-peer video calls using WebRTC  
- Real-time signaling powered by Socket.io  
- JWT-based authentication for secure access  
- Optional text chat during calls  
- Type-safe development with TypeScript  
- Server-side rendering with Next.js  
- REST API and WebSocket integration  
- Cloud-ready deployment setup  
- Persistent storage using MongoDB Atlas  

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-Time Communication | WebRTC, Socket.io |
| Database | MongoDB Atlas |
| Authentication | JWT, bcrypt |
| Deployment | Vercel (Frontend), Render/Railway (Backend) |

---

## System Design — MVC Architecture

**Model-View-Controller (MVC):**

- **Model:** MongoDB models for users, rooms, and call logs.  
- **View:** Next.js frontend for user interfaces and room pages.  
- **Controller:** Express.js controllers for authentication, signaling, and room management.

---

## Database Collections

**1. users**
- `_id`
- `username`
- `email`
- `passwordHash`
- `createdAt`

**2. rooms**
- `_id`
- `roomId`
- `participants` (array of user IDs)
- `createdAt`
- `active` (boolean)

**3. callLogs**
- `_id`
- `callerId`
- `receiverId`
- `roomId`
- `startTime`
- `endTime`
- `duration`

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zetra.git

# Move into the directory
cd zetra

# Install dependencies
npm install

# Create an .env file and include:
# MONGO_URI=
# JWT_SECRET=
# SOCKET_URL=
# NEXT_PUBLIC_API_BASE_URL=

# Run the development # Zetra — Real-Time Video Calling Platform

Zetra is a real-time video calling platform built using WebRTC, Next.js, TypeScript, and Node.js.  
It enables high-quality peer-to-peer video communication with secure authentication and scalable backend architecture.

---

## Features

- Peer-to-peer video calls using WebRTC  
- Real-time signaling powered by Socket.io  
- JWT-based authentication for secure access  
- Optional text chat during calls  
- Type-safe development with TypeScript  
- Server-side rendering with Next.js  
- REST API and WebSocket integration  
- Cloud-ready deployment setup  
- Persistent storage using MongoDB Atlas  
- TURN/STUN integration for reliable connectivity across networks  

---

## Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Real-Time Communication | WebRTC, Socket.io |
| Database | MongoDB Atlas |
| Authentication | JWT, bcrypt |
| TURN/STUN Servers | Google STUN + custom TURN via coturn |
| Deployment | Vercel (Frontend), Render/Railway (Backend) |

---

## System Design — MVC Architecture

**Model-View-Controller (MVC):**

- **Model:** MongoDB models for users, rooms, and call logs.  
- **View:** Next.js frontend for user interfaces and room pages.  
- **Controller:** Express.js controllers for authentication, signaling, and room management.

---

## Database Collections

**1. users**
- `_id`
- `username`
- `email`
- `passwordHash`
- `createdAt`

**2. rooms**
- `_id`
- `roomId`
- `participants` (array of user IDs)
- `createdAt`
- `active` (boolean)

**3. callLogs**
- `_id`
- `callerId`
- `receiverId`
- `roomId`
- `startTime`
- `endTime`
- `duration`

---

## Installation

```bash
# Clone the repository
git clone https://github.com/abhinxvz/webrtc_backend_zetra.git

# Move into the directory
cd webrtc_backend_zetra

# Install dependencies
npm install

# Create an .env file and include:
# MONGO_URI=
# JWT_SECRET=
# SOCKET_URL=
# NEXT_PUBLIC_API_BASE_URL=
# TURN_SERVER_URL=
# TURN_SERVER_USERNAME=
# TURN_SERVER_CREDENTIAL=

# Run the development server
npm run dev
