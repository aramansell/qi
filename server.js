const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

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
  const { name, occupation, knowledge } = req.body;
  const character = {
    id: Date.now().toString(),
    name,
    occupation,
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

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const systemPrompt = `You are ${character.name}, a ${character.occupation} in a murder mystery game. 

Your knowledge and what you can reveal:
${character.knowledge}

IMPORTANT RULES:
- Stay strictly in character as ${character.name}
- Only reveal information that is explicitly in your knowledge section above
- You can create mundane small talk and personality details, but nothing plot-relevant beyond your knowledge
- Do not reveal information you don't have or make up new clues
- Respond naturally as if being interviewed about the mystery
- If asked about something not in your knowledge, say you don't know or haven't seen/heard anything about it`;

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
    res.status(500).json({ error: 'Failed to generate response' });
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

app.listen(PORT, () => {
  console.log(`Murder Mystery Game server running on http://localhost:${PORT}`);
});