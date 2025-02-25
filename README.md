# Aitopia

A dynamic, AI-powered game world where characters come to life through LLM interactions. Characters move, speak, think, and interact in a minimalist, futuristic environment.

## Features

- 🎮 Interactive game world with AI-controlled characters
- 🗣️ Text-to-speech for character dialogue
- 🎯 Smart character positioning with collision avoidance
- ⚙️ Configurable LLM settings (supports Ollama models)
- 🎨 Minimalist, dark theme design
- 📱 Responsive layout with mobile support

## Prerequisites

Before running Aitopia, you need:

1. [Ollama](https://ollama.ai/) installed and running on your machine
2. A compatible LLM model pulled into Ollama, e.g.:

```bash
ollama pull llama3.2:3b
```

3. Ollama configured to [accept requests](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama) from Aitopia:

```bash
OLLAMA_ORIGINS=http://localhost:3000 ollama serve
```

## Running

The easiest way to run Aitopia is using Docker:

```bash
docker run -p 3000:3000 ghcr.io/tlaanemaa/aitopia:latest
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

1. Click the settings gear icon in the top right
2. Configure your Ollama endpoint (default: http://localhost:11434)
3. Select your preferred model from the available models list
4. Start interacting with the game!

## Development

To run the project from source:

1. Clone the repository:

```bash
git clone https://github.com/tlaanemaa/aitopia.git
cd aitopia
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Type instructions in the input box to guide the story
- Characters will respond, move, and interact based on the AI's interpretation
- Each character has their own consistent voice and appearance
- Watch the action log to follow the story progression

## Built With

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Langchain
- Framer Motion
- Web Speech API

## License

MIT
