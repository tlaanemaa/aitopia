# Theater Core

This folder contains the domain model for the interactive theatrical storytelling system. It provides the core abstractions and functionality that power the theatrical experience.

## Contents

- **models/** - Core domain model classes (Character, Scene, Prop, Playwright, etc.)
- **types/** - TypeScript type definitions and interfaces
- **utils/** - Utility functions for calculations and operations
- **services/** - Service layer for external integrations

## Key Concepts

- **TheatricalWorld** - Coordinates all theatrical elements and manages the state of the world
- **Character** - Represents a character with identity, state, and perception capabilities
- **Perception** - Handles a character's subjective view of the world
- **Scene** - Represents the physical setting of the theatrical experience
- **Prop** - Objects that can be interacted with by characters
- **Playwright** - Directs the theatrical experience and manages the narrative 