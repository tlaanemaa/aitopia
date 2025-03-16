/**
 * Test for the Play class
 */

import { Play, PlayConfig } from '../models/Play';
import { Emotion, CharacterArchetype } from '../types/common';

// Create a play configuration
const config: PlayConfig = {
  title: 'The Midnight Mystery',
  genre: 'Mystery',
  theme: 'Trust and betrayal',
  scene: {
    name: 'Old Library',
    description: 'A dimly lit library with tall bookshelves and antique furniture',
    mood: 'tense',
    time: 'night',
    width: 100,
    height: 100
  },
  initialCharacters: [
    {
      name: 'Detective Morgan',
      archetype: CharacterArchetype.HERO,
      traits: ['observant', 'determined', 'logical'],
      backstory: 'A seasoned detective with a perfect case record',
      appearance: 'Tall with a weathered face and piercing eyes',
      goal: 'Solve the mysterious disappearance',
      initialEmotion: Emotion.CURIOUS,
      initialPosition: { x: 20, y: 50 }
    },
    {
      name: 'Professor Lancaster',
      archetype: CharacterArchetype.SAGE,
      traits: ['intellectual', 'secretive', 'nervous'],
      backstory: 'A brilliant academic with a dark secret',
      appearance: 'Thin and bespectacled with disheveled clothes',
      goal: 'Protect his reputation',
      initialEmotion: Emotion.WORRIED,
      initialPosition: { x: 80, y: 50 }
    }
  ],
  initialProps: [
    {
      type: 'book',
      name: 'Ancient Tome',
      description: 'A dusty leather-bound book with strange symbols',
      position: { x: 50, y: 50 },
      interactable: true,
      states: ['closed', 'open'],
      initialState: 'closed'
    },
    {
      type: 'desk',
      description: 'An ornate wooden desk with many drawers',
      position: { x: 70, y: 30 },
      movable: false,
      interactable: true
    }
  ],
  llm: {
    endpoint: 'http://localhost:11434',
    modelName: 'gemma:3b',
    temperature: 0.7
  }
};

// Create the play
const play = new Play(config);

// Add a simple listener
play.addListener({
  onNarration: (text) => {
    console.log('Narrator:', text);
  },
  onCharacterTurn: (id, name) => {
    console.log(`${name}'s turn`);
  },
  onEvent: (event) => {
    console.log('Event:', event.type, event.description);
  },
  onError: (error) => {
    console.error('Error:', error.message);
  }
});

// Log basic information
console.log(`Play "${play.getTitle()}" created with ID: ${play.getId()}`);
console.log('Scene:', play.getCurrentScene().name);
console.log('Characters:');
play.getCharacters().forEach(char => {
  console.log(`- ${char.name} (${char.archetype}): ${char.currentEmotion}`);
});
console.log('Props:');
play.getProps().forEach(prop => {
  console.log(`- ${prop.name}: ${prop.currentState}`);
}); 