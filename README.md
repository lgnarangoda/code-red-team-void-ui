# Team Void Scrabble UI

A modern Angular-based Scrabble game interface built with TypeScript and Angular 19.

Note: This repository contains the client UI only. The authoritative game server (matchmaking, rules, timers, bot) is not included. The UI is built to communicate with a WebSocket server at ws://localhost:8080.

## Project Structure

```
src/app/
│
├── core/
│   ├── services/
│   │   ├── game.service.ts         # WebSocket comms; exposes typed send* API and connection status
│   │   ├── auth.service.ts         # Stubbed auth; stores current username
│   │   └── timer.service.ts        # Client timer that syncs to server updates
│   └── models/
│       ├── game-state.model.ts     # Board, racks, scores, timer
│       ├── player.model.ts         # Player data structure
│       └── tile.model.ts           # Tile data structure
│
├── lobby/
│   ├── lobby.component.ts          # Login stub + Find Match / Play with Bot buttons
│
├── game/
│   ├── board/
│   │   ├── board.component.ts      # 15x15 grid; emits square clicks
│   │   └── square.component.ts     # Individual square (premium or normal)
│   │
│   ├── rack/
│   │   ├── rack.component.ts       # Tile rack (drag & drop reordering)
│   │   └── tile.component.ts       # Single tile rendering
│   │
│   ├── controls/
│   │   ├── controls.component.ts   # Buttons: Shuffle, Exchange, Pass, Submit
│   │
│   ├── scoreboard/
│   │   ├── scoreboard.component.ts # Player scores, phase, timer
│   │
│   └── game.component.ts           # Orchestrates board, rack, controls, scoreboard
│
└── app.routes.ts                   # Routes: '', 'lobby', 'game'
```

## Current UI Capabilities (Stage 1 UX)

- Keyboard placement flow:
  - Click a starting square; click again to toggle direction (horizontal/vertical).
  - Type letters to place tiles along the path; occupied squares are auto-skipped.
  - Hold Shift while typing a letter to use a blank tile.
  - Press Enter to submit the move; Enter with no tiles asks to pass.
  - Press X (with no tiles placed) to open a quick exchange prompt.
- Rack management:
  - Click to select/deselect tiles.
  - Drag-and-drop to reorder tiles on your rack.
  - Shuffle/Exchange/Pass/Submit buttons emit actions (wired to GameService send* methods).
- Warnings shown for common mistakes: not your turn, missing start square, off-board, and invalid tile.
- Return to Lobby button navigates back to /lobby.

## Server Integration

- The UI connects to ws://localhost:8080/game/{gameId}.
- Incoming messages support two formats:
  - Wrapped: { type: 'state' | 'timer' | 'error', payload: ... }
  - Legacy: raw GameState JSON.
- Outgoing actions (JSON):
  - { type: 'place', gameId, placements }
  - { type: 'submit', gameId }
  - { type: 'pass', gameId }
  - { type: 'exchange', gameId, tileIds }
  - { type: 'shuffle', gameId }

You must provide a server that understands these messages and enforces rules.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Open your browser to http://localhost:4200

Optional: Configure a different server URL by changing the WebSocket URL in src/app/core/services/game.service.ts.

## Development Notes

This project uses Angular 19 with standalone components and RxJS. The codebase is organized for incremental delivery of the multi-stage roadmap (server-side rules, secure timers, and bot are expected to be in a separate server project).

### Key Technologies

- Angular 19
- TypeScript
- RxJS (observables for state/clock)
- WebSocket for real-time communication
- SCSS for styling

## License

MIT
