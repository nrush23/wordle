# Project Architecture: GameSession & Network Layer

This document provides an overview of the client-side network architecture for the multiplayer game.

## 1. Project Structure

The project is structured with a Next.js frontend and a modular network simulation layer.

### Folder Structure
```
/
├── portfolio/
│   ├── src/app/graphics/final/page.js  <-- Entry Point
│   └── public/network/                 <-- Network & Simulation Layer
│       ├── Systems/                    <-- Logic Modules
│       │   ├── InputSystem.js
│       │   ├── PredictionSystem.js
│       │   ├── SnapshotSystem.js
│       │   └── InterpolationSystem.js
│       ├── Utils/                      <-- Shared Helpers
│       │   ├── MathUtils.js
│       │   └── Raycast.js
│       ├── ReactWebGl/                 <-- WebGL Engine
│       ├── Events/                     <-- Messaging
│       ├── Network/                    <-- Protocol Definitions
│       ├── gameSession.js              <-- Main Orchestrator
│       ├── networkClient.js            <-- Communications
│       ├── inputManager.js             <-- User Input
│       └── clientSidePrediction.js     <-- Shared CSP Logic
└── Documentation/                      <-- You are here
```

## 2. Core Entry Point

The game simulation begins in **`portfolio/src/app/graphics/final/page.js`**.

- **Initialization Loop**: When the React component mounts, it initializes the `InputManager`, `NetworkClient`, and `GameSession`.
- **Session Lifecycle**: It manages the creation and disposal of the `GameSession`, ensuring network connections are closed and listeners are removed when the user leaves the page.
- **Rendering Integration**: It connects the `GameSession` to the `Scene` and `WebGLRenderer`.

## 3. Key Classes

| Class | Responsibility |
|-------|----------------|
| `GameSession` | The central hub that manages the simulation tick, model pools, and delegates logic to specialized systems. |
| `NetworkClient` | Manages the WebSocket connection and message serialization. |
| `InputManager` | Captures keyboard and mouse events to be processed by the game loop. |
| `SnapshotSystem` | Processes incoming server states (Players, Zurgs, Windows) and updates the local scene. |
| `InputSystem` | Samples input at a fixed rate (20Hz) and generates predicted movement commands. |
| `PredictionSystem`| Validates server truth against client predictions and handles state reconciliation. |
| `InterpolationSystem`| Smooths visual movement (like camera) between fixed simulation ticks. |
| `MeshManager` | Manages model pools and asset loading lifecycle. |
| `Scene` | Manages the Babylon-like rendering graph and camera. |

## 4. Core Systems Description

### Interpolation System
Ensures that the jitter caused by a fixed simulation rate (20Hz) is not visible to the user. It calculates a "smoothing" position for entities based on how much time has passed since the last tick, creating fluid movement even at high frame rates.

### Mesh Manager
Centralizes model pools and asset loading lifecycle. It handles repurposing dormant meshes and filling pools for players, zurgs, and weapons.

### Input System & CSP
Handles **Client-Side Prediction (CSP)**. Instead of waiting for the server to confirm a move, the client calculates the expected target position immediately based on user input. This ensures a responsive "lag-free" experience.

### Prediction Validation
When the server sends back the "True" position, this system compares it to what the client predicted. If they differ significantly (misprediction), strictly corrects the client's position and re-simulates subsequent frames.
