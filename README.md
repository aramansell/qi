# Murder Mystery Game (Qi)

A Node.js-based murder mystery game where a game master can create AI-powered characters and players can interview them to solve the case.

## Features

- **Game Master Interface**: Create characters with specific knowledge and backstories
- **Player Interface**: Chat with AI-powered characters to gather clues
- **Conversation History**: All interactions are tracked and saved
- **Transcript View**: Review all conversations across all characters
- **OpenAI Integration**: Characters respond intelligently while staying in character

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your OpenAI API key:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## How to Play

### Game Master Mode
1. Switch to "Game Master" mode
2. Create characters by filling out:
   - Character Name
   - Occupation
   - Knowledge (what they know and can reveal)
3. Each character will only reveal information from their knowledge section

### Player Mode
1. Switch to "Player" mode
2. Select a character from the list to interview
3. Chat with them to gather information
4. Switch between characters at any time
5. Each character maintains their own conversation history

### Transcript Mode
View all conversations organized by character to review gathered information.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## API Endpoints

- `GET /api/characters` - Get all characters
- `POST /api/characters` - Create a new character
- `GET /api/conversations/:characterId` - Get conversation history for a character
- `POST /api/chat/:characterId` - Send a message to a character
- `GET /api/transcript` - Get full transcript of all conversations