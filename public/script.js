let currentStaff = null;
let staffMembers = [];
let currentScenarioId = null;

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
            const displayName = staff.name.startsWith('Anonymous') ? 
                `<h3 style="color: #6c757d; font-style: italic;">${staff.name}</h3>` : 
                `<h3>${staff.name}</h3>`;
            card.innerHTML = `
                ${displayName}
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
            const displayName = staff.name.startsWith('Anonymous') ? 
                `<strong style="color: #6c757d; font-style: italic;">${staff.name}</strong>` : 
                `<strong>${staff.name}</strong>`;
            option.innerHTML = `
                ${displayName}<br>
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

// Scenario Management Functions
async function showSaveScenarioDialog() {
    if (staffMembers.length === 0) {
        alert('Please create some staff members before saving a scenario.');
        return;
    }
    document.getElementById('saveScenarioModal').style.display = 'block';
}

function closeSaveScenarioDialog() {
    document.getElementById('saveScenarioModal').style.display = 'none';
    document.getElementById('scenarioName').value = '';
    document.getElementById('scenarioDescription').value = '';
}

async function saveScenario() {
    const name = document.getElementById('scenarioName').value.trim();
    const description = document.getElementById('scenarioDescription').value.trim();
    
    if (!name) {
        alert('Please enter a scenario name.');
        return;
    }
    
    try {
        const response = await fetch('/api/scenarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                name, 
                description,
                characters: staffMembers 
            })
        });
        
        if (response.ok) {
            const scenario = await response.json();
            currentScenarioId = scenario.id;
            updateCurrentScenarioDisplay(scenario);
            closeSaveScenarioDialog();
            alert('Scenario saved successfully!');
        } else {
            alert('Failed to save scenario.');
        }
    } catch (error) {
        console.error('Error saving scenario:', error);
        alert('Error saving scenario.');
    }
}

async function showLoadScenarioDialog() {
    document.getElementById('loadScenarioModal').style.display = 'block';
    await loadScenarioList();
}

function closeLoadScenarioDialog() {
    document.getElementById('loadScenarioModal').style.display = 'none';
}

async function loadScenarioList() {
    try {
        const response = await fetch('/api/scenarios');
        const scenarios = await response.json();
        
        const scenarioList = document.getElementById('scenarioList');
        scenarioList.innerHTML = '';
        
        if (scenarios.length === 0) {
            scenarioList.innerHTML = '<p style="color: #6c757d;">No saved scenarios found.</p>';
            return;
        }
        
        scenarios.forEach(scenario => {
            const scenarioCard = document.createElement('div');
            scenarioCard.style.cssText = 'border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin-bottom: 10px; cursor: pointer;';
            scenarioCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${scenario.name}</h4>
                        <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">${scenario.description || 'No description'}</p>
                        <small style="color: #6c757d;">${scenario.characters.length} staff members</small>
                    </div>
                    <div>
                        <button onclick="loadScenario('${scenario.id}')" style="background-color: #007bff; margin-right: 5px; font-size: 12px; padding: 5px 10px;">Load</button>
                        <button onclick="deleteScenario('${scenario.id}')" style="background-color: #dc3545; font-size: 12px; padding: 5px 10px;">Delete</button>
                    </div>
                </div>
            `;
            scenarioList.appendChild(scenarioCard);
        });
    } catch (error) {
        console.error('Error loading scenarios:', error);
    }
}

async function loadScenario(scenarioId) {
    try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        const scenario = await response.json();
        
        if (response.ok) {
            // Clear current data
            await fetch('/api/conversations/clear', { method: 'POST' });
            
            // Load scenario characters
            staffMembers = scenario.characters;
            currentScenarioId = scenario.id;
            
            // Update displays
            updateCurrentScenarioDisplay(scenario);
            loadStaffForTrainingManager();
            
            closeLoadScenarioDialog();
            alert(`Scenario "${scenario.name}" loaded successfully!`);
        } else {
            alert('Failed to load scenario.');
        }
    } catch (error) {
        console.error('Error loading scenario:', error);
        alert('Error loading scenario.');
    }
}

async function deleteScenario(scenarioId) {
    if (!confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/scenarios/${scenarioId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadScenarioList();
            if (currentScenarioId === scenarioId) {
                currentScenarioId = null;
                updateCurrentScenarioDisplay(null);
            }
        } else {
            alert('Failed to delete scenario.');
        }
    } catch (error) {
        console.error('Error deleting scenario:', error);
        alert('Error deleting scenario.');
    }
}

// Resident scenario selection
async function showResidentScenarioSelector() {
    document.getElementById('residentScenarioModal').style.display = 'block';
    await loadResidentScenarioList();
}

function closeResidentScenarioSelector() {
    document.getElementById('residentScenarioModal').style.display = 'none';
}

async function loadResidentScenarioList() {
    try {
        const response = await fetch('/api/scenarios');
        const scenarios = await response.json();
        
        const scenarioList = document.getElementById('residentScenarioList');
        scenarioList.innerHTML = '';
        
        if (scenarios.length === 0) {
            scenarioList.innerHTML = '<p style="color: #6c757d;">No training scenarios available. Please ask your training manager to create some scenarios.</p>';
            return;
        }
        
        scenarios.forEach(scenario => {
            const scenarioCard = document.createElement('div');
            scenarioCard.style.cssText = 'border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin-bottom: 10px; cursor: pointer;';
            scenarioCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #333;">${scenario.name}</h4>
                        <p style="margin: 0 0 5px 0; color: #6c757d; font-size: 14px;">${scenario.description || 'No description'}</p>
                        <small style="color: #6c757d;">${scenario.characters.length} staff members to interview</small>
                    </div>
                    <div>
                        <button onclick="selectResidentScenario('${scenario.id}')" style="background-color: #007bff; font-size: 12px; padding: 5px 15px;">Select</button>
                    </div>
                </div>
            `;
            scenarioList.appendChild(scenarioCard);
        });
    } catch (error) {
        console.error('Error loading scenarios:', error);
    }
}

async function selectResidentScenario(scenarioId) {
    try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        const scenario = await response.json();
        
        if (response.ok) {
            // Clear current conversations
            await fetch('/api/conversations/clear', { method: 'POST' });
            
            // Load scenario for resident
            staffMembers = scenario.characters;
            currentScenarioId = scenario.id;
            
            // Update displays
            updateResidentScenarioDisplay(scenario);
            loadStaffMembers();
            
            // Clear chat area
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '<p>Select a staff member to interview about the quality issue...</p>';
            currentStaff = null;
            
            closeResidentScenarioSelector();
        } else {
            alert('Failed to load scenario.');
        }
    } catch (error) {
        console.error('Error loading scenario:', error);
        alert('Error loading scenario.');
    }
}

function updateCurrentScenarioDisplay(scenario) {
    const display = document.getElementById('currentScenario');
    const nameSpan = document.getElementById('currentScenarioName');
    const countSpan = document.getElementById('currentScenarioStaffCount');
    
    if (scenario) {
        nameSpan.textContent = scenario.name;
        countSpan.textContent = scenario.characters.length;
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
    }
}

function updateResidentScenarioDisplay(scenario) {
    const display = document.getElementById('residentCurrentScenario');
    const nameSpan = document.getElementById('residentScenarioName');
    const descSpan = document.getElementById('residentScenarioDescription');
    
    if (scenario) {
        nameSpan.textContent = scenario.name;
        descSpan.textContent = scenario.description || 'No description available';
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
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