# GameHub

A multiplayer game hub built with Next.js, React, and Supabase. Play Tic Tac Toe and Snakes & Ladders locally or online with friends.

**Live Demo:** [https://game-hub-psi-murex.vercel.app](https://game-hub-psi-murex.vercel.app)

![GameHub](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

## Features

### Tic Tac Toe
- **Local PvP** — play with a friend on the same device
- **vs AI** — three difficulty levels (Easy, Medium, Hard) using minimax algorithm
- **Online Multiplayer** — create a private room with an invite code or find a random match
- **Per-match Scoreboard** — tracks wins, losses, and draws across rematches

### Snakes & Ladders
- **Local** — 2 to 4 players on the same device
- **Online Multiplayer** — create rooms for 2-4 players with invite codes
- **3D Dice** — CSS 3D cube with shake-to-reveal animation
- **Animated Board** — SVG board with snakes, ladders, and hopping player tokens

### General
- **Username System** — pick a username on first visit, persists across sessions
- **Invite Codes** — 6-character codes for easy private room sharing
- **Stale Room Cleanup** — abandoned rooms auto-delete after 5 minutes
- **Tab Close Detection** — rooms clean up when a player closes their browser tab
- **Leaderboard** — global leaderboard with per-game tabs and win rate stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Realtime) |
| Language | TypeScript 5 |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/Nar6x/game-hub.git
cd game-hub
npm install
```

### Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor. This creates:

- `profiles` — user profiles
- `leaderboard` — per-game win/loss/draw stats
- `rooms` — game rooms with realtime enabled

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with UserProvider + Navbar
│   ├── page.tsx                # Home page with game cards
│   ├── tictactoe/page.tsx      # Tic Tac Toe (local + online)
│   ├── snakes-and-ladders/page.tsx  # Snakes & Ladders (local + online)
│   └── leaderboard/page.tsx    # Global leaderboard
├── components/
│   ├── shared/                 # UserContext, Navbar, UsernameModal
│   ├── tictactoe/              # Board, Cell, GameStatus, OnlineLobby, etc.
│   └── snakes/                 # SnakesBoard, Dice, PlayerSetup, OnlineSnakesLobby
├── hooks/
│   ├── useGameState.ts         # Local Tic Tac Toe state
│   ├── useOnlineGame.ts        # Online Tic Tac Toe with Supabase realtime
│   ├── useSnakesGame.ts        # Local Snakes & Ladders state
│   └── useOnlineSnakes.ts      # Online Snakes & Ladders with Supabase realtime
└── lib/
    ├── types.ts                # TypeScript types
    ├── supabase/client.ts      # Supabase client
    └── gameLogic/tictactoe.ts  # Win detection + minimax AI
```

## How Online Play Works

1. **Create Room** — player creates a room and gets a 6-character invite code
2. **Share Code** — send the code to a friend
3. **Join** — friend enters the code to join the room
4. **Realtime Sync** — all moves sync instantly via Supabase Realtime (WebSocket)
5. **Disconnect Handling** — closing a tab auto-deletes the room; stale rooms clean up after 5 minutes

## Deployment

This project is configured for [Vercel](https://vercel.com):

```bash
npx vercel
```

Set the environment variables in your Vercel dashboard under Settings > Environment Variables.

## License

MIT
