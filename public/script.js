let currentCharacter = null;
let characters = [];

// Switch between different modes
function switchMode(mode) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(mode).classList.add('active');
    event.target.classList.add('active');
    
    if (mode === 'player') {
        loadCharacters();
    } else if (mode === 'transcript') {
        loadTranscript();
    }
}

// Game Master Functions
document.getElementById('characterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('characterName').value;
    const occupation = document.getElementById('characterOccupation').value;
    const knowledge = document.getElementById('characterKnowledge').value;
    
    try {
        const response = await fetch('/api/characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, occupation, knowledge })
        });
        
        if (response.ok) {
            document.getElementById('characterForm').reset();
            loadCharactersForGameMaster();
        } else {
            alert('Failed to create character');
        }
    } catch (error) {
        console.error('Error creating character:', error);
        alert('Error creating character');
    }
});

async function loadCharactersForGameMaster() {
    try {
        const response = await fetch('/api/characters');
        characters = await response.json();
        
        const characterList = document.getElementById('characterList');
        characterList.innerHTML = '';
        
        characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `
                <h3>${character.name}</h3>
                <p><strong>Occupation:</strong> ${character.occupation}</p>
                <p><strong>Knowledge:</strong> ${character.knowledge}</p>
            `;
            characterList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

// Player Functions
async function loadCharacters() {
    try {
        const response = await fetch('/api/characters');
        characters = await response.json();
        
        const characterOptions = document.getElementById('characterOptions');
        characterOptions.innerHTML = '';
        
        characters.forEach(character => {
            const option = document.createElement('div');
            option.className = 'character-option';
            option.innerHTML = `
                <strong>${character.name}</strong><br>
                <small>${character.occupation}</small>
            `;
            option.onclick = () => selectCharacter(character);
            characterOptions.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

async function selectCharacter(character) {
    currentCharacter = character;
    
    // Update UI
    document.querySelectorAll('.character-option').forEach(o => o.classList.remove('selected'));
    event.target.classList.add('selected');
    
    // Load conversation history
    try {
        const response = await fetch(`/api/conversations/${character.id}`);
        const conversation = await response.json();
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `<p><strong>Now talking to ${character.name} (${character.occupation})</strong></p>`;
        
        conversation.forEach(message => {
            if (message.role !== 'system') {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.role}`;
                messageDiv.textContent = message.content;
                chatMessages.appendChild(messageDiv);
            }
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentCharacter) {
        if (!currentCharacter) {
            alert('Please select a character to talk to first');
        }
        return;
    }
    
    // Add user message to chat
    const chatMessages = document.getElementById('chatMessages');
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = message;
    chatMessages.appendChild(userMessage);
    
    messageInput.value = '';
    
    try {
        const response = await fetch(`/api/chat/${currentCharacter.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message assistant';
            aiMessage.textContent = data.response;
            chatMessages.appendChild(aiMessage);
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message assistant';
            errorMessage.textContent = 'Error: ' + (data.error || 'Failed to get response');
            chatMessages.appendChild(errorMessage);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message assistant';
        errorMessage.textContent = 'Error: Failed to send message';
        chatMessages.appendChild(errorMessage);
    }
}

// Allow Enter key to send message
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Transcript Functions
async function loadTranscript() {
    try {
        const response = await fetch('/api/transcript');
        const transcript = await response.json();
        
        const transcriptContent = document.getElementById('transcriptContent');
        transcriptContent.innerHTML = '';
        
        if (Object.keys(transcript).length === 0) {
            transcriptContent.innerHTML = '<p>No conversations yet.</p>';
            return;
        }
        
        for (const [characterName, messages] of Object.entries(transcript)) {
            const characterSection = document.createElement('div');
            characterSection.className = 'transcript-character';
            
            const characterTitle = document.createElement('h4');
            characterTitle.textContent = `Conversation with ${characterName}`;
            characterSection.appendChild(characterTitle);
            
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.role}`;
                messageDiv.textContent = message.content;
                characterSection.appendChild(messageDiv);
            });
            
            transcriptContent.appendChild(characterSection);
        }
    } catch (error) {
        console.error('Error loading transcript:', error);
    }
}

// Load characters for game master on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCharactersForGameMaster();
});