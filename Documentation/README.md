# Game Simulation & Network Documentation

Welcome to the documentation for the multiplayer game client. This folder contains detailed information about the refactored architecture and systems.

## Contents

- **[Architecture Overview](Architecture.md)**
  - Folder structure.
  - Core entry points.
  - Core class descriptions.
- **[Function and Data Flow](Flow.md)**
  - Call sequences for initialization and the game loop.
  - Inbound and Outbound data pathway details.
  - Sequence diagram of the network communication.

## Quick Reference: Core Systems

1. **SnapshotSystem**: Manages world state synchronization.
2. **InputSystem**: Handles client-side prediction and input sampling.
3. **PredictionSystem**: Validates predictions and handles state reconciliation.
4. **GameSession**: The primary orchestrator class.
