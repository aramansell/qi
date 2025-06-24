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
let scenarios = [];

// Seed initial scenario from example file
function seedInitialScenario() {
  const initialScenario = {
    id: 'lab-timing-delays',
    name: 'Lab Timing Delays Investigation',
    description: 'Investigate why morning labs are not being drawn and reported in a timely manner. Hospital policy requires results by 7:30 AM but delays are affecting patient care.',
    characters: [
      {
        id: 'physician-001',
        name: '',
        occupation: 'Physician',
        attitude: 'Just want to see things fixed and don\'t understand why they are so broken. Helpful however they can but have limited knowledge outside of knowing it makes their job harder.',
        knowledge: 'Lab results are supposed to be back by 7:30 AM per hospital policy. Lab delays are happening per the opinion of physicians and it is affecting their ability to provide medical care. I put in at least two patient safety reports. One patient\'s discharge was delayed because the only ride available left before we had morning lab results. Another patient had to receive his medications much later in the day because of lab delays that I needed for dosing. In general, I think lab delays are happening more frequently. I typically get sign out around 7:15 AM, so if I could have all results back by 7:30 AM I would have all the information I need when I start rounds.'
      },
      {
        id: 'lab-tech-001',
        name: '',
        occupation: 'Lab Tech',
        attitude: 'No nonsense, succinct, they understand the system and directly and clearly answer questions.',
        knowledge: 'When specimens arrive, I remove them from the pneumatic tube and stack all of them in the lab analyzer. The analyzer reads the barcode and performs the appropriate test. The analyzer takes 35 minutes to run a CBC and 42 minutes to run a BMP. Once analyzed, a lab tech will confirm the results, look for suspicious outliers, and release the report to the electronic medical record which on average takes 4-5 minutes from the time the analyzer finishes. I have data on how long everything takes in our lab. Overall, it takes 47 minutes to result a BMP & 39 minutes to result a CBC from the time we receive the blood until the time it is reported in the medical record. Plus, we have a very low standard deviation of only +/-3 minutes. Which means the delays in labs being reported on time doesn\'t stem from us. We are pretty consistent and don\'t have a lot we can change given the fixed time it takes the analyzer to run. Furthermore, our analyzers are top tier, you can\'t get much faster than these machines go! These machines can handle a lot of labs. I don\'t think it would be a big deal for the instrument, but we may need to adjust our staffing if that was occurring really early in the morning since we don\'t have very many techs on from midnight until 5:30 AM. If too many labs came in before 5:30 AM we might need to hire more techs.'
      },
      {
        id: 'phlebotomist-001',
        name: '',
        occupation: 'Phlebotomist',
        attitude: 'Smart, competent and busy. They have a lot to do and are a little annoyed that night team doesn\'t help out more. That being said, they are professional, want to see improvement and clearly understand the system.',
        knowledge: 'All blood draws and IVs are done by a phlebotomy team and not by bedside nurses per our union contract. Phlebotomy staffing is split into two shifts, night and day shift, both of which are 12-hour shifts that begin at either 5:00 AM or 5:00 PM. Five phlebotomists are assigned to the night shift, ten are assigned to day shift. We\'re a bit short-staffed right now as four phlebotomists recently retired and their spots are still empty. In the past 6 months, on an average morning, we draw blood from 150 patients each morning. Morning labs are ordered by the provider for the "0530 draw". This is just an average time of when blood is drawn, obviously not every lab is done right at 0530. When day phlebotomy team arrives at 5:00 AM, we get our assignment, prep the lab draw cart which takes about 15-20 minutes in the supply room and head off to begin collections by 5:30 AM. We each draw our list of patients which typically is done by ward. The night phlebotomy team is on until 5:00am and lab draws are supposed to start at 4:00 AM. This means there is an hour of night shift they can help-out. However, it\'s poorly managed and there are no real rules. Typically, the night shift phlebotomists each choose five patients at their own discretion on which to draw labs. The night shift phlebotomists cherry pick the easy patients. You know, the patients with a central line or something. They also "count" an attempted draw, even if they were not successful. They may only end up getting blood from 3 patients with central lines and have 2 "attempts" and they are done. It ultimately means they provide almost no help with the morning draw volume, it\'s all left to day team.'
      },
      {
        id: 'nurse-001',
        name: '',
        occupation: 'Nurse',
        attitude: 'Helpful but befuddled. They don\'t do this work and have little to offer.',
        knowledge: 'Happy to help but to be honest I don\'t know that much. Per our union contract all blood draws are done by phlebotomy and not bedside nurses on the medical and surgical floors. This is not true for the ICU or the ED, those nurses draw their own labs. But for floor patients, phlebotomy does it. Yes, phlebotomy draws off ports and PICC lines. However if they cannot get a blood draw we do have a special nurse run "Complex IV team" which can help place PICCS or do ultrasound guided blood draws and IV placement if phlebotomy can\'t get blood.'
      },
      {
        id: 'phlebotomy-manager-001',
        name: '',
        occupation: 'Phlebotomy Manager',
        attitude: 'This character is supposed to be a grumpy curmudgeon. He is 6 months from retirement and not interested in helping if he doesn\'t absolutely have to. He clearly hasn\'t worked to fix any problems as the manager and isn\'t interested in starting unless he must.',
        knowledge: 'Morale is pretty low. I think staffing is the major issue. We are chronically short staffed. We had 4 people retire in the past few months. Unfortunately, it takes so long to hire new staff there is often a big delay between staff leaving and the new people starting. Also, our staffing doesn\'t align with the needs of the hospital. I have no clue why shifts start at 5:00 AM which is right in the middle of the AM draw and the busiest time of day for us. Furthermore, because the shifts are 12-hours long we end up having too few people in the morning for the bulk draw when we need them and too many people in the afternoon when things slow down. But changing people\'s schedules pretty much takes an act of congress. Once you are hired the union protections mandate that we give them the shift they were hired for. Maybe we should hire the 4 new replacements for different shifts since the union contract only applies after you are hired... Yes, an even bigger issue is we don\'t have any limits on people overlapping their vacation time. Some folks will schedule their vacation days to align because they know the workload will be higher when someone else if off. One day last month we only had 4 phlebotomist show up for day shift, out of 10!...for the entire hospital. I thought about trying to change the vacation policy but working with the union takes WAY to long. I just gave up. Look, I\'ll be honest. I\'m not a people person. I\'m 6 months from retirement. While I appreciate and welcome the help to try to improve the situation, I\'m not sure it\'s going to do much good. I recently did observations of an entire mornings blood draws and recorded how the phlebotomists spend their time. With so many patients to draw, little delays here and there add up quickly, like having to place an IV, gown up, draw routine blood cultures or the inevitable "stat" lab which requires they drop what they are doing on the AM bulk draw and deal with the stat lab instead. I\'m almost certain most of our early morning stat labs are because one of the docs forgot to order it for the bulk lab draw so they just order it stat instead. It\'s amazing how many 6:30 or 7:00 AM stat labs we get on patients who have no other labs ordered. Very suspicious... and it totally disrupts the bulk draw work-flow because they have to run off and take care of the stat draw and it delays everything else.'
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  // Only add if it doesn't already exist
  if (!scenarios.find(s => s.id === initialScenario.id)) {
    scenarios.push(initialScenario);
    console.log('Seeded initial Lab Timing Delays scenario with 5 characters');
  }
}

app.get('/api/characters', (req, res) => {
  res.json(characters);
});

app.post('/api/characters', (req, res) => {
  const { name, occupation, attitude, knowledge } = req.body;
  const character = {
    id: Date.now().toString(),
    name: name && name.trim() ? name.trim() : `Anonymous ${occupation}`,
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

    const characterName = character.name.startsWith('Anonymous') ? `an anonymous ${character.occupation}` : character.name;
    const systemPrompt = `You are ${characterName}, a ${character.occupation} in a hospital quality improvement training simulation. 

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

// Scenario Management Endpoints

// Get all scenarios
app.get('/api/scenarios', (req, res) => {
  res.json(scenarios);
});

// Create a new scenario
app.post('/api/scenarios', (req, res) => {
  const { name, description, characters: scenarioCharacters } = req.body;
  
  if (!name || !scenarioCharacters || scenarioCharacters.length === 0) {
    return res.status(400).json({ error: 'Scenario name and characters are required' });
  }
  
  const scenario = {
    id: Date.now().toString(),
    name,
    description: description || '',
    characters: scenarioCharacters,
    createdAt: new Date().toISOString()
  };
  
  scenarios.push(scenario);
  console.log(`Scenario "${name}" created with ${scenarioCharacters.length} characters`);
  res.json(scenario);
});

// Get a specific scenario
app.get('/api/scenarios/:id', (req, res) => {
  const { id } = req.params;
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  
  // Load the scenario characters into the current session
  characters = scenario.characters.map(char => ({ ...char })); // Create copies
  
  // Clear and reinitialize conversations for the loaded characters
  conversations = {};
  characters.forEach(character => {
    conversations[character.id] = [];
  });
  
  res.json(scenario);
});

// Delete a scenario
app.delete('/api/scenarios/:id', (req, res) => {
  const { id } = req.params;
  const scenarioIndex = scenarios.findIndex(s => s.id === id);
  
  if (scenarioIndex === -1) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  
  const deletedScenario = scenarios.splice(scenarioIndex, 1)[0];
  console.log(`Scenario "${deletedScenario.name}" deleted`);
  res.json({ message: 'Scenario deleted successfully' });
});

// Initialize the application with seed data
seedInitialScenario();

app.listen(PORT, () => {
  console.log(`Quality Improvement Training server running on http://localhost:${PORT}`);
  console.log('Features available:');
  console.log('- Training Manager: Create and manage hospital staff');
  console.log('- Scenario Management: Save and load training scenarios');
  console.log('- Resident Training: Interview staff members');
  console.log('- Conversation Management: Clear interview data');
  console.log(`\nInitial scenarios available: ${scenarios.length}`);
});