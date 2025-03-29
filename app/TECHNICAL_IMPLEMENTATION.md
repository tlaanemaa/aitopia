# Theater UI Technical Implementation

This document outlines the technical approach for implementing the interactive theatrical experience UI according to the requirements in [REQUIREMENTS.md](./REQUIREMENTS.md).

## 1. Core Architecture

### PlayStore as Single Integration Point
- **All interactions with theater-core must go through the playStore exclusively**
- Components should never directly access theater-core
- Benefits of this approach:
  - Centralized state management creates a single source of truth
  - Cleaner component code focused only on presentation
  - Easier adaptation to future theater-core changes
  - Better testability with simplified mocking
  - Simplified debugging of state flows

### Data Flow Architecture
- User interactions → playStore methods → theater-core API → state updates → UI reactivity
- `queueInput(input)` handles all user input
- `startLoop()` manages the turn-based game progression
- Components observe and react to playStore state changes

## 2. Optimized Component Strategy

### Adapt Existing Components
- **Leverage and enhance the existing component structure where possible**
- Update `Character.tsx` to work with CharacterState from theater-core
- Enhance `GameField.tsx` to serve as the focal stage area
- Keep `Banner.tsx` for welcome screen with animations
- Adapt `TurnCounter.tsx` for turn tracking
- Update `UserInput.tsx` to connect to playStore

### New Components
- Create `CharacterSidebar.tsx` as a lean, focused component
- Add `SceneDescription.tsx` as a prominent display at the top
- Consider `SpeechBubble.tsx` as a reusable component for dialog

### Component Hierarchy
```
App (page.tsx)
├── Banner (existing, enhanced)
├── SceneDescription (new)
├── GameField (existing, enhanced)
│   └── Character (existing, updated)
│       └── SpeechBubble (potential new component)
├── CharacterSidebar (new)
├── UserInput (existing, updated)
├── TurnCounter (existing, updated)
├── SettingsButton (existing)
└── Settings (existing)
```

## 3. Responsive Design Strategy

### Defined Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Layout Adaptations
- **Stage area remains dominant focal point across all layouts**
- Character sidebar:
  - Desktop: Fixed position on side
  - Tablet: Collapsible drawer
  - Mobile: Bottom-aligned row with horizontal scrolling
- Input area:
  - Fixed position at bottom with appropriate sizing
  - Touch-friendly targets on mobile

### Positioning System
- Use viewport-relative sizing for character positioning
- Implement collision avoidance for character placement
- Calculate positions that work across screen sizes

## 4. Animation Strategy

### Prioritized Animations
- **Character movement**: Smooth transitions between positions
- **Speech/thought bubbles**: Fade and type animations
- **Character entry/exit**: Sliding or fading animations
- **Turn transitions**: Subtle indicators for turn changes

### Progressive Enhancement
- Use Framer Motion with performance optimizations

### Animation Guidelines
- Keep animations subtle and in service of the narrative
- Avoid distracting effects that compete with content
- Ensure animations enhance rather than impede usability

## 5. Enhanced State Management

### PlayStore Enhancements
- Add helper methods for common component needs
- Implement selective state subscription patterns
- Create derived state for UI-specific needs

### Character State Management
- Clear visual indicator for active character
- Smooth transitions between character states
- Proper handling of character entry/exit

### Input Handling
- Visual feedback for queued vs. processing input
- Clear indication when input is being processed
- Differentiation between start state and ongoing interaction

## 6. Implementation Strategy

### Phased Approach
1. **Enhance PlayStore**
   - Complete integration with theater-core
   - Add UI-specific helper methods
   - Implement selective state observation

2. **Update Core UI Components**
   - GameField and stage area
   - Character representation
   - User input and turn counter

3. **Implement New Features**
   - Character sidebar with avatars
   - Scene description display
   - Enhanced speech/thought bubbles

4. **Add Responsive Design**
   - Layout adaptations for different screen sizes
   - Collapsible elements for smaller screens
   - Touch-friendly controls

5. **Polish Animations and Effects**
   - Character movements and transitions
   - Turn indication animations
   - Visual feedback for interactions

## 7. CSS and Styling

### Tailwind Approach
- Leverage existing Tailwind setup
- Define custom utility classes for repeated patterns
- Use theme configuration for consistent colors and spacing

### Visual Hierarchy
- Scene description has prominent placement
- Active character receives visual emphasis
- UI controls remain accessible but unobtrusive

### Accessibility Considerations
- Sufficient color contrast for all text
- Appropriate text sizes across devices
- Keyboard navigation support
- ARIA labels for interactive elements

## 8. Testing Strategy

### Component Testing
- Unit tests for individual components
- Integration tests for component interactions

### State Management Testing
- Verify playStore and theater-core integration
- Test state transitions and derived values

### Responsive Testing
- Test layouts across defined breakpoints
- Verify usability on touch devices

### Performance Testing
- Monitor animation performance
- Test with multiple active characters
- Verify smooth transitions between states

## 9. Potential Challenges and Solutions

### State Synchronization
- **Challenge**: Ensuring UI updates correctly with Play state changes
- **Solution**: Implement reactive patterns in playStore, with debounced updates for performance

### Performance
- **Challenge**: Managing multiple animated elements simultaneously
- **Solution**: Use staggered animations, simplify on mobile, leverage GPU acceleration

### Responsive Design
- **Challenge**: Maintaining usability across screen sizes
- **Solution**: Mobile-first design approach with progressive enhancement

### Animation Coordination
- **Challenge**: Coordinating multiple animations without overwhelming users
- **Solution**: Develop animation hierarchy, limit concurrent animations 