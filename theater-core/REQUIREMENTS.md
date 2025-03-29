# Narrative Experience Domain Model

## Vision
Create a domain model for interactive narrative experiences powered by small language models. This model will represent all elements of a compelling story, enabling rich storytelling with audience participation.

## Story Elements

### Scene
- Dynamic environment where the story takes place
- Contains objects, characters, and environmental elements
- Can transform between different locations or settings
- Has atmospheric conditions and ambiance
- Supports character movement and transitions

### Characters
- Distinct personalities, backgrounds, and motivations
- Emotional states that evolve throughout the story
- Relationships with other characters
- Dialogue capabilities with natural language
- Physical attributes and positioning within scenes
- Actions and gestures that convey meaning
- Visual representation through 2d images or avatars

### Objects
- Physical items that characters can interact with
- States that can change during the story
- Significance within the narrative
- Position within the scene
- Visual representation through 2d images

### Narrative
- Overall story structure (chapters, sequences, scenes)
- Character objectives and conflicts
- Narrative arc with rising action, climax, and resolution
- Dialogue and action descriptions
- Thematic elements
- Genre conventions

### Direction
- Pacing and timing of story elements
- Character movement and positioning
- Emphasis on important moments
- Integration of audience input
- Maintaining narrative coherence

### Turn Flow
- Sequential turn order: Director (formerly Playwright) takes a turn, followed by each character in sequence
- Director handles scene changes, adding/removing characters, and major narrative shifts
- Each character takes their individual turn to act, speak, and express emotions
- Characters act and speak in first person, embodying their own unique perspective and personality
- Characters make decisions based on their own motivations, not as puppets of the Director
- After all characters have taken their turns, control returns to the Director
- Clear delineation between Director's control of the world and characters' individual agency
- Observer input may be solicited at appropriate breaks in the sequence
- Characters maintain a consistent rotation order (e.g., Director → Bob → Alice → Director → Bob → Alice)

### LLM Turn Processing
- Each turn (Director or Character) is processed by the LLM
- The LLM generates the content and actions for each turn based on the current state
- Director turns: LLM generates world events, scene changes, character additions/removals
- Character turns: LLM generates dialogue, emotions, actions based on character personality
- All important narrative decisions come from the LLM, not hardcoded logic
- System provides contextual information to the LLM for coherent turn generation

### Character Perception and Event Propagation
- Characters should maintain their own subjective understanding of the world
- Information propagates naturally between characters based on perception
- Characters can only perceive events within their sensory range (sight, hearing)
- Dialogue and sounds have a hearing range that can be affected by distance and obstacles
- Visual events have a sight range that can be blocked by obstacles or other characters
- Global events (like scene changes) are perceived by all characters
- A character's knowledge, decisions, and dialogue should be based only on what they've perceived
- The Director can narrate events that are not directly perceived by any character
- Characters should react naturally to new information they perceive
- This creates potential for dramatic irony where some characters know things others don't

## Interactive Elements

### Observer Participation
- Single observer can provide input at natural break points
- Input can influence plot, character decisions, or setting
- System accommodates unexpected suggestions while maintaining narrative coherence
- Observer can passively watch if desired

### Narrative Adaptation
- Story responds to observer input in meaningful ways
- Characters maintain consistent personalities despite plot changes
- Conflicts adapt to new elements while preserving dramatic tension
- Genre and tone shift gracefully when needed

## LLM Integration

### Narrative Generation
- Generate coherent dialogue between characters
- Create action descriptions and scene transitions
- Maintain character consistency
- Develop relationships and conflicts
- Adapt to observer suggestions

### Performance Parameters
- Target small LLMs (1-4B parameters)
- Efficient use of context window (up to 128K tokens)
- Structured formats for scene, character, and narrative state
- Minimal latency between actions

## Storytelling Qualities

### Narrative Structure
- Clear exposition, rising action, climax, falling action, and resolution
- Character arcs showing growth or change
- Conflicts with meaningful stakes
- Thematic coherence

### Experience Quality
- Natural-sounding dialogue
- Dynamic character interactions
- Appropriate pacing
- Emotional resonance
- Surprise and delight

## Limitations

### Narrative Constraints
- Limited number of concurrent characters (3-5 maximum, configurable)
- Simplified settings and scene changes
- Basic object interactions
- Limited memory of past events (memory length configurable)

### LLM Constraints
- Potential for occasional non-sequiturs or inconsistencies
- Limited understanding of complex physical interactions
- May require guidance to maintain narrative tension 