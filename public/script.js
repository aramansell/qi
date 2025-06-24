let currentStaff = null;
let staffMembers = [];

// Switch between different modes
function switchMode(mode) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(mode).classList.add('active');
    event.target.classList.add('active');
    
    if (mode === 'player') {
        loadStaffMembers();
    } else if (mode === 'transcript') {
        loadTranscript();
    }
}

// Game Master Functions
document.getElementById('characterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('characterName').value;
    const occupation = document.getElementById('characterOccupation').value;
    const attitude = document.getElementById('characterAttitude').value;
    const knowledge = document.getElementById('characterKnowledge').value;
    
    try {
        const response = await fetch('/api/characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, occupation, attitude, knowledge })
        });
        
        if (response.ok) {
            document.getElementById('characterForm').reset();
            loadStaffForTrainingManager();
        } else {
            alert('Failed to add staff member');
        }
    } catch (error) {
        console.error('Error adding staff member:', error);
        alert('Error adding staff member');
    }
});

async function loadStaffForTrainingManager() {
    try {
        const response = await fetch('/api/characters');
        staffMembers = await response.json();
        
        const characterList = document.getElementById('characterList');
        characterList.innerHTML = '';
        
        staffMembers.forEach(staff => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `
                <h3>${staff.name}</h3>
                <p><strong>Role:</strong> ${staff.occupation}</p>
                <p><strong>Attitude:</strong> ${staff.attitude}</p>
                <p><strong>Knowledge:</strong> ${staff.knowledge}</p>
            `;
            characterList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading staff members:', error);
    }
}

// Player Functions
async function loadStaffMembers() {
    try {
        const response = await fetch('/api/characters');
        staffMembers = await response.json();
        
        const characterOptions = document.getElementById('characterOptions');
        characterOptions.innerHTML = '';
        
        staffMembers.forEach(staff => {
            const option = document.createElement('div');
            option.className = 'character-option';
            option.innerHTML = `
                <strong>${staff.name}</strong><br>
                <small>${staff.occupation}</small>
            `;
            option.onclick = () => selectStaff(staff);
            characterOptions.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading staff members:', error);
    }
}

async function selectStaff(staff) {
    currentStaff = staff;
    
    // Update UI
    document.querySelectorAll('.character-option').forEach(o => o.classList.remove('selected'));
    event.target.classList.add('selected');
    
    // Load conversation history
    try {
        const response = await fetch(`/api/conversations/${staff.id}`);
        const conversation = await response.json();
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `<p><strong>Now interviewing ${staff.name} (${staff.occupation})</strong></p>`;
        
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
    
    if (!message || !currentStaff) {
        if (!currentStaff) {
            alert('Please select a staff member to interview first');
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
        const response = await fetch(`/api/chat/${currentStaff.id}`, {
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
        
        for (const [staffName, messages] of Object.entries(transcript)) {
            const staffSection = document.createElement('div');
            staffSection.className = 'transcript-character';
            
            const staffTitle = document.createElement('h4');
            staffTitle.textContent = `Interview with ${staffName}`;
            staffSection.appendChild(staffTitle);
            
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.role}`;
                messageDiv.textContent = message.content;
                staffSection.appendChild(messageDiv);
            });
            
            transcriptContent.appendChild(staffSection);
        }
    } catch (error) {
        console.error('Error loading transcript:', error);
    }
}

// Clear all conversations (resident data only)
async function clearAllConversations() {
    if (!confirm('Are you sure you want to clear all conversations? This will reset all interview data but keep the staff members.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/conversations/clear', {
            method: 'POST'
        });
        
        if (response.ok) {
            // Clear current conversation display
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '<p>Select a staff member to interview about the quality issue...</p>';
            
            // Clear selected character
            currentStaff = null;
            document.querySelectorAll('.character-option').forEach(o => o.classList.remove('selected'));
            
            alert('All conversations have been cleared successfully.');
        } else {
            alert('Failed to clear conversations.');
        }
    } catch (error) {
        console.error('Error clearing conversations:', error);
        alert('Error clearing conversations.');
    }
}

// Load characters for game master on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStaffForTrainingManager();
});