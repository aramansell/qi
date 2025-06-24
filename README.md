# Quality Improvement Training (Qi)

A Node.js-based quality improvement training simulation for hospital residents where a training manager can create AI-powered hospital staff members and residents can interview them to investigate quality improvement opportunities.

## Features

- **Training Manager Interface**: Create hospital staff members with specific knowledge about quality issues
- **Scenario Management**: Save and load complete training scenarios with multiple staff members
- **Resident Interface**: Select and complete training scenarios by interviewing AI-powered staff members
- **Conversation History**: All interactions are tracked and saved within each scenario
- **Investigation Summary**: Review all interviews across all staff members
- **OpenAI Integration**: Staff members respond intelligently while staying in character

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your OpenAI API key:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file and replace `your_openai_api_key_here` with your actual OpenAI API key.
   
   To get an OpenAI API key:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy it to your `.env` file

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`

## How to Use

### Training Manager Mode
1. Switch to "Training Manager" mode
2. Create hospital staff members by filling out:
   - Staff Member Name
   - Role/Department (any hospital role relevant to your scenario)
   - Attitude/Personality (how they behave and communicate during interviews)
   - Knowledge (what they know about the quality issue being investigated)
3. Each staff member will only reveal information from their knowledge section
4. **Save Scenario**: Once you have created all staff members, save the complete scenario
5. **Load Scenario**: Load previously saved scenarios to modify or reuse

### Resident Mode
1. Switch to "Resident" mode
2. **Select Scenario**: Choose from available training scenarios created by training managers
3. Select a staff member from the scenario to interview
4. Ask questions about processes and quality issues
5. Switch between staff members at any time
6. Each staff member maintains their own conversation history
7. Use "Clear All Conversations" button to reset all interview data (keeps scenario)

### Summary Mode
View all interviews organized by staff member to review gathered information and identify quality improvement opportunities.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## API Endpoints

- `GET /api/characters` - Get all staff members
- `POST /api/characters` - Create a new staff member
- `GET /api/conversations/:characterId` - Get conversation history for a staff member
- `POST /api/chat/:characterId` - Send a message to a staff member
- `GET /api/transcript` - Get full transcript of all interviews
- `POST /api/conversations/clear` - Clear all conversation data
- `GET /api/scenarios` - Get all saved scenarios
- `POST /api/scenarios` - Create a new scenario
- `GET /api/scenarios/:id` - Load a specific scenario
- `DELETE /api/scenarios/:id` - Delete a scenario