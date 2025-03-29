# Theater UI Requirements

This document outlines the requirements for the interactive theatrical experience UI, which will integrate with the theater-core module through the playStore.

## User Experience Flow

1. **Initial Landing**
   - User arrives at the page and sees a welcome banner/splash screen
   - A text input field is positioned at the bottom of the screen
   - A "Start" button appears next to the text input
   - Optionally display brief instructions/introduction to the experience

2. **Starting the Experience**
   - User can optionally type initial input in the text field
   - When the user clicks "Start", any entered text is queued as input
   - The theatrical experience begins automatically after clicking start
   - Welcome banner transitions out to reveal the main theater view

3. **Main Theater View**
   - Scene description is prominently displayed at the top
   - Characters appear positioned according to their coordinates
   - Current turn/activity is indicated visually
   - Input field remains at the bottom for ongoing interaction
   - Turn counter shows the current progression 
   - Settings button provides access to configuration options

4. **Ongoing Interaction**
   - User can enter text at any time to influence the narrative
   - Input is queued and processed at the appropriate turn
   - User doesn't need to click a button to submit (Enter key submits)
   - Visual feedback confirms input was received

## UI Components

### 1. Welcome Banner
- Full-screen or prominent overlay
- Brief introduction to the theatrical experience
- "Start" button and initial input field
- Attractive, thematic design that sets the mood

### 2. Stage Area
- **Full-screen central focus of the UI**
- Main area where character interactions take place
- Visual representation of the current scene description
- Characters positioned according to their x,y coordinates (0-100 range)
- Possible background that changes with scene descriptions
- Other UI elements must not intrude on this space

### 3. Character Representation
- Each character is represented by their avatar image
- Speech bubbles appear above/near characters when they speak
- Thought bubbles (with different styling) for character thoughts
- Characters display emotion states visually (using emojis when supported)
- Smooth transitions for character movement between positions

### 4. Character Sidebar
- Positioned discretely on the side of the screen (collapsible on mobile)
- Contains circular avatar images for each active character
- Currently active character's avatar is highlighted/enlarged
- New characters animate in when added (fade in, grow, or slide)
- Departing characters animate out (fade out, shrink, or slide)
- Clicking a character avatar could show additional information

### 5. Input Area
- Text input field fixed at the bottom of the screen
- Placeholder text suggests possible inputs
- Visual indication when input is queued vs. being processed
- Optional: typographic styling that matches the theatrical theme

### 6. Turn Counter
- Visually appealing counter showing the current turn number
- Positioned in a non-intrusive area (corner or with other UI elements)
- Updates with each turn progression
- Could include visual effects for turn transitions

### 7. Settings Button
- Accessible from any state of the application
- Opens settings panel with LLM configuration options
- Consistent with the overall design aesthetic
- Positioned to be accessible but not intrusive

## Visual Design Requirements

1. **Layout**
   - **Responsive design that works on desktop, tablet and mobile devices**
   - **Stage area must remain the dominant focal point**
   - UI controls positioned along edges to maximize stage visibility
   - Character sidebar maintains visibility without dominating the view
   - **Mobile layout optimizes vertical space with collapsible elements**

2. **Typography**
   - Clear, readable fonts for all text elements
   - Hierarchical text sizing (scene descriptions, character names, dialogue)
   - Consider using different fonts for different elements (scene vs. dialogue)

3. **Color & Theme**
   - Consistent color scheme throughout the experience
   - Colors that support the theatrical/storytelling theme
   - Sufficient contrast for accessibility

## Animation Requirements

1. **Character Animations**
   - Smooth transitions for character movement between positions
   - Speech bubbles appear with subtle animations
   - Thought bubbles use distinct animation from speech

2. **Character Sidebar Animations**
   - New character avatars slide or fade into the sidebar
   - Departing character avatars fade out and space closes
   - Active character highlight transitions smoothly

3. **Turn Indication**
   - Visual indicator for whose turn is active
   - Smooth transitions between turns
   - Possible subtle animation for processing/thinking states

## Technical Integration

1. **Store Integration**
   - UI components observe and react to playStore state
   - Characters update position, speech, and thoughts reactively
   - Scene descriptions update from store state
   - Input handling connects to store queueInput method
   - **Turn counter connects to store turnCount property**

2. **Performance Considerations**
   - Efficient rendering for multiple animated elements
   - Smooth animations even with multiple characters
   - Appropriate loading states for async operations

## Accessibility Considerations

1. **Readability**
   - Sufficient text sizes and contrast
   - Clear visual hierarchy of information
   - Ensure readability across device sizes

2. **Input Accessibility**
   - Keyboard navigation support
   - Clear focus states for interactive elements
   - Appropriate ARIA labels for custom components
   - **Touch-friendly target sizes for mobile users**

## Future Enhancements

1. **Emotion Expression**
   - UI prepared to display emotions using emojis
   - Implementation ready for when theater-core exposes emotion mapping
   - Placeholder system until full emotion support is added 