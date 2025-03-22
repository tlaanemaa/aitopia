# Theater Core

This module implements a domain model for an interactive theatrical storytelling system powered by language models. It provides a framework for creating dynamic, interactive narratives with autonomous characters.

## Architecture

- **models/** - Core domain entities:
  - `Play`: Main orchestrator that manages the theatrical experience
  - `Director`: Controls the narrative flow and can introduce world events
  - `Character`: Autonomous agents with their own perception, memory, and decision-making
  - `Entity`: Base class for all interactive elements with memory
  - `Perception`: Handles how characters perceive the world based on proximity and traits
  - `Ai`: Abstraction layer for LLM integration (currently using Ollama)

- **types/** - TypeScript type definitions:
  - `events.ts`: Comprehensive event system for all interactions (character actions, speech, emotions, world events)

- **service/** - Service layer:
  - `EntityRegistry`: Manages all entities in the world
  - `InputHandler`: Processes external input into events

- **utils/** - Utility functions:
  - Distance calculations, range checking, and timing utilities

## Key Concepts

### Event-Based Architecture
The system is based entirely on events that are propagated through the world. Events can be:
- **Character Events**: Actions, speech, emotions, movement, thoughts
- **World Events**: Scene changes, character entrances/exits, generic world events

### Perception System
Characters have limited perception based on:
- Physical proximity (sight, hearing ranges)
- Character traits (perceptive, oblivious, empath, etc.)
- Personal memory of observed events

### Turn-Based Flow
1. The Director takes a turn, potentially changing the world
2. Each character takes their turn in sequence
3. Observer (user) input can be processed at any time

### AI Integration
Every entity uses a language model to make decisions:
- Characters decide what to say and do based on their perception and memories
- The Director guides the narrative based on all observed events
- User input is interpreted and converted into appropriate events

## Usage

The primary entry point is the `Play` class, which orchestrates the theatrical experience. Instantiate it with initial seed events, then use `nextTurn()` and `handleInput()` to progress the narrative.

```typescript
import { Play } from 'theater-core';

// Create a new play with initial scene
const play = new Play([
  { 
    type: 'scene_change', 
    newSceneDescription: 'A dimly lit tavern with a crackling fireplace' 
  }
]);

// Progress the narrative
const events = await play.nextTurn();

// Handle user input
await play.handleInput(['Add a mysterious stranger at the door']);
``` 