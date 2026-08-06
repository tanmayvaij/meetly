# Meetly

Meetly is a premium, open-source 1-to-1 video calling application built with modern web technologies. It uses WebRTC for ultra-low latency peer-to-peer communication and Socket.io for robust signaling.

## Features

- **Direct Peer-to-Peer Video**: Crystal clear video routing natively in the browser via WebRTC.
- **Premium UI**: Modern glassmorphism and animated interfaces built with Tailwind CSS v4 and shadcn/ui components.
- **TURN Server Integrated**: Reliable NAT traversal ensuring connections succeed across strict enterprise firewalls and mobile networks.
- **Microphone & Camera Toggles**: Full control over your local media streams.
- **Instant Rooms**: One-click generation of unique, secure meeting rooms (UUIDv4).

## Architecture

This repository is a monorepo consisting of two parts:

1. **/frontend**: A React application built with Vite, TypeScript, and Tailwind CSS. It handles all the client-side WebRTC logic and UI.
2. **/backend**: A lightweight Node.js/Express server that runs a Socket.io instance. It acts exclusively as the WebRTC signaling server to exchange session descriptions (SDP) and ICE candidates between peers.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd video-app
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the App Locally

The project includes a root `Makefile` to easily start both servers simultaneously.

From the root directory of the project, run:
```bash
make dev
```

Alternatively, you can run them manually in separate terminal tabs:

**Tab 1 (Backend):**
```bash
cd backend
npm run dev
```
*The signaling server will start on `http://localhost:3001`*

**Tab 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The React application will start on `http://localhost:5173`*

## Network Configuration

By default, the WebRTC configuration (`frontend/src/hooks/useWebRTC.ts`) points to a managed TURN server (Metered.ca) to guarantee video connections across all networks. If you plan to deploy this to production at scale, you can replace the credentials with your own self-hosted Coturn server or upgrade your managed relay tier.
