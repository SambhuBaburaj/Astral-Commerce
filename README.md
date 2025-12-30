# Astral Chat - Real-time Support System

A unified support chat system built with a monorepo structure using modern technologies.

## Technology Stack

- **Monorepo**: Bun Workspaces
- **Backend**: Elysia.js + WebSocket (Native)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: Next.js 14 + TailwindCSS
- **Communication**: WebSocket (Real-time)

## Structure

```
astral-chat-final-version/
├── apps/
│   ├── web/        # Admin Dashboard (Next.js) - Port 3001
│   ├── client/     # Customer Chat Widget (Next.js) - Port 3000
│   └── api/        # Backend Server (Elysia) - Port 4000
└── packages/
    └── db/         # Shared Database Schema (Drizzle)
```

## Setup Instructions

1.  **Install Bun**: Ensure you have [Bun](https://bun.sh) installed.
2.  **Install Dependencies**:
    ```bash
    bun install
    ```
3.  **Database Setup**:
    - Ensure PostgreSQL is running.
    - Check `packages/db/.env` for `DATABASE_URL`.
    - Push schema:
    ```bash
    cd packages/db
    bun run push
    ```
4.  **Run Development Servers**:
    You can run them in separate terminals:

    ```bash
    # Backend
    cd apps/api
    bun dev

    # Admin Dashboard
    cd apps/web
    bun dev

    # Client Widget
    cd apps/client
    bun dev
    ```

## Features

- **Real-time Messaging**: Instant message delivery using WebSockets.
- **Shared Type Safety**: `packages/db` exports types used by both API and Frontends.
- **Optimized Performance**: Elysia.js for high-performance backend, Next.js for SSR/static frontends.
- **Modern UI**: Clean, premium design with Tailwind CSS and animations.
# Astral-Commerce---Full-Stack-Developer-Challenge
