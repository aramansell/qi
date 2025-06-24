const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let characters = [];
let conversations = {};

app.get('/api/characters', (req, res) => {
  res.json(characters);
});

app.post('/api/characters', (req, res) => {
  const { name, occupation, attitude, knowledge } = req.body;
  const character = {
    id: Date.now().toString(),
    name,
    occupation,
    attitude,
    knowledge
  };
  characters.push(character);
  conversations[character.id] = [];
  res.json(character);
});

app.get('/api/conversations/:characterId', (req, res) => {
  const { characterId } = req.params;
  res.json(conversations[characterId] || []);
});

app.post('/api/chat/:characterId', async (req, res) => {
  const { characterId } = req.params;
  const { message } = req.body;
  
  const character = characters.find(c => c.id === characterId);
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  if (!conversations[characterId]) {
    conversations[characterId] = [];
  }

  conversations[characterId].push({ role: 'user', content: message });

  // Check for API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
    return res.status(500).json({ error: 'OpenAI API key not configured. Please check your .env file.' });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const systemPrompt = `You are ${character.name}, a ${character.occupation} in a hospital quality improvement training simulation. 

Your attitude and personality:
${character.attitude}

Your knowledge and what you can reveal:
${character.knowledge}

IMPORTANT RULES:
- Stay strictly in character as ${character.name} with the attitude described above
- Only reveal information that is explicitly in your knowledge section above
- Maintain your personality and communication style throughout the conversation
- You can create mundane small talk consistent with your personality, but nothing case-relevant beyond your knowledge
- Do not reveal information you don't have or make up new facts about processes or issues
- Respond naturally as if being interviewed by a resident about quality improvement issues
- If asked about something not in your knowledge, say you don't know or direct them to ask another staff member who might know
- Keep responses conversational but focused on the quality improvement investigation
- Interviews should be 2-4 minutes, so be somewhat concise but thorough when sharing your knowledge
- Remember to consistently portray your described attitude and personality`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversations[characterId]
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;
    conversations[characterId].push({ role: 'assistant', content: aiResponse });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Provide more specific error messages
    if (error.code === 'invalid_api_key') {
      res.status(500).json({ error: 'Invalid OpenAI API key. Please check your .env file.' });
    } else if (error.code === 'insufficient_quota') {
      res.status(500).json({ error: 'OpenAI API quota exceeded. Please check your OpenAI account.' });
    } else {
      res.status(500).json({ error: `Failed to generate response: ${error.message}` });
    }
  }
});

app.get('/api/transcript', (req, res) => {
  const transcript = {};
  for (const [characterId, messages] of Object.entries(conversations)) {
    const character = characters.find(c => c.id === characterId);
    if (character && messages.length > 0) {
      transcript[character.name] = messages.filter(m => m.role !== 'system');
    }
  }
  res.json(transcript);
});

// Clear all conversations (resident data only, keep staff members)
app.post('/api/conversations/clear', (req, res) => {
  try {
    // Clear all conversation history but keep the characters
    conversations = {};
    
    // Re-initialize empty conversation arrays for existing characters
    characters.forEach(character => {
      conversations[character.id] = [];
    });
    
    console.log('All conversations cleared successfully');
    res.json({ message: 'All conversations cleared successfully' });
  } catch (error) {
    console.error('Error clearing conversations:', error);
    res.status(500).json({ error: 'Failed to clear conversations' });
  }
});

app.listen(PORT, () => {
  console.log(`Quality Improvement Training server running on http://localhost:${PORT}`);
});