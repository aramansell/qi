// Global state management for single chat interface
let state = {
    currentScenario: null,
    staffMembers: [],
    currentStaff: null,
    allMessages: [], // All messages in chronological order with staff identification
    isLoading: false,
    apiKey: null // Store API key from URL
};

// Utility functions
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    // Extract API key from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    state.apiKey = urlParams.get('apikey');
    
    if (!state.apiKey) {
        showAlert('API Key required. Please add ?apikey=your_openai_key to the URL', 'error');
    }
    
    await loadScenarios();
    initializeInterface();
    console.log('Quality Improvement Training - Single Chat Interface initialized');
});

// Load available scenarios
async function loadScenarios() {
    try {
        const response = await fetch('/api/scenarios');
        const scenarios = await response.json();
        
        if (scenarios.length > 0) {
            // Auto-select first scenario if available
            await selectScenario(scenarios[0].id);
        }
    } catch (error) {
        console.error('Error loading scenarios:', error);
        showAlert('Error loading scenarios', 'error');
    }
}

// Select and load a scenario
async function selectScenario(scenarioId) {
    try {
        const response = await fetch(`/api/scenarios/${scenarioId}`);
        if (response.ok) {
            const scenario = await response.json();
            state.currentScenario = scenario;
            state.staffMembers = [...scenario.characters];
            state.currentStaff = null;
            state.allMessages = [];
            
            updateScenarioHeader();
            renderStaffList();
            renderChatArea();
            
            // Show clear chat button if scenario is loaded
            document.getElementById('clear-chat-btn').style.display = scenario.characters.length > 0 ? 'block' : 'none';
            
            showAlert(`Scenario "${scenario.name}" loaded successfully!`, 'success');
        } else {
            showAlert('Failed to load scenario', 'error');
        }
    } catch (error) {
        console.error('Error loading scenario:', error);
        showAlert('Error loading scenario', 'error');
    }
}

// Update scenario header
function updateScenarioHeader() {
    const nameEl = document.getElementById('current-scenario-name');
    const descEl = document.getElementById('current-scenario-description');
    
    if (state.currentScenario) {
        nameEl.textContent = state.currentScenario.name;
        descEl.textContent = state.currentScenario.description || 'Interview hospital staff to investigate quality improvement opportunities';
    } else {
        nameEl.textContent = 'Select a Scenario';
        descEl.textContent = 'Choose a training scenario to begin interviewing staff';
    }
}

// Render staff list
function renderStaffList() {
    const staffList = document.getElementById('staff-list');
    
    if (!state.currentScenario || state.staffMembers.length === 0) {
        staffList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-md"></i>
                <h3>No staff available</h3>
                <p>Please select a scenario with staff members</p>
            </div>
        `;
        return;
    }
    
    staffList.innerHTML = state.staffMembers.map(staff => `
        <div class="staff-item ${state.currentStaff?.id === staff.id ? 'selected' : ''}" 
             onclick="selectStaff('${staff.id}')">
            <div class="staff-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="staff-info">
                <div class="staff-name ${staff.name.startsWith('Anonymous') ? 'anonymous' : ''}">${staff.name}</div>
                <div class="staff-role">${staff.occupation}</div>
            </div>
        </div>
    `).join('');
}

// Select a staff member
function selectStaff(staffId) {
    const staff = state.staffMembers.find(s => s.id === staffId);
    if (!staff) return;
    
    state.currentStaff = staff;
    renderStaffList(); // Update selection
    renderChatArea(); // Update chat header and enable input
}

// Render chat area
function renderChatArea() {
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (!state.currentStaff) {
        chatHeader.innerHTML = '<span>Select a staff member to begin interview</span>';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        
        if (state.allMessages.length === 0) {
            chatMessages.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Select a staff member from the left panel to start the interview</p>
                </div>
            `;
        } else {
            renderAllMessages();
        }
    } else {
        chatHeader.innerHTML = `<span>Now interviewing ${state.currentStaff.name} (${state.currentStaff.occupation})</span>`;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        renderAllMessages();
    }
}

// Render all messages in chronological order
function renderAllMessages() {
    const chatMessages = document.getElementById('chat-messages');
    
    if (state.allMessages.length === 0) {
        chatMessages.innerHTML = `
            <div class="chat-placeholder">
                <i class="fas fa-comments"></i>
                <p>Start the conversation by asking a question</p>
            </div>
        `;
        return;
    }
    
    let html = state.allMessages.map(message => {
        const staffName = message.staffName || 'Unknown Staff';
        const staffTag = message.role === 'assistant' ? 
            `<div class="message-staff-tag">${staffName}</div>` : '';
        
        return `
            <div class="chat-message ${message.role}">
                ${staffTag}
                ${message.content}
            </div>
        `;
    }).join('');
    
    if (state.isLoading) {
        html += `
            <div class="chat-message assistant">
                <div class="message-staff-tag">${state.currentStaff?.name || 'Staff'}</div>
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
                <span style="margin-left: 8px; color: #718096;">Typing...</span>
            </div>
        `;
    }
    
    chatMessages.innerHTML = html;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle chat input key press
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message || !state.currentStaff || state.isLoading) return;
    
    // Add user message to all messages
    const userMessage = {
        role: 'user',
        content: message,
        staffId: state.currentStaff.id,
        staffName: state.currentStaff.name,
        timestamp: new Date().toISOString()
    };
    
    state.allMessages.push(userMessage);
    messageInput.value = '';
    state.isLoading = true;
    
    renderAllMessages();
    
    try {
        const response = await fetch(`/api/chat/${state.currentStaff.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, apiKey: state.apiKey })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const aiMessage = {
                role: 'assistant',
                content: data.response,
                staffId: state.currentStaff.id,
                staffName: state.currentStaff.name,
                timestamp: new Date().toISOString()
            };
            state.allMessages.push(aiMessage);
        } else {
            const errorMessage = {
                role: 'assistant',
                content: 'Error: ' + (data.error || 'Failed to get response'),
                staffId: state.currentStaff.id,
                staffName: state.currentStaff.name,
                timestamp: new Date().toISOString()
            };
            state.allMessages.push(errorMessage);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
            role: 'assistant',
            content: 'Error: Failed to send message',
            staffId: state.currentStaff.id,
            staffName: state.currentStaff.name,
            timestamp: new Date().toISOString()
        };
        state.allMessages.push(errorMessage);
    }
    
    state.isLoading = false;
    renderAllMessages();
}

// Show scenario selector modal
function showScenarioSelector() {
    fetch('/api/scenarios')
        .then(response => response.json())
        .then(scenarios => {
            if (scenarios.length === 0) {
                const content = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>No training scenarios available</h3>
                        <p>Please contact your training administrator to set up scenarios.</p>
                    </div>
                `;
                const footer = `<button data-secondary onclick="hideModal()">Close</button>`;
                showModal('Select Training Scenario', content, footer);
                return;
            }
            
            const content = `
                <div style="margin-bottom: 20px;">
                    <p style="color: #718096; margin-bottom: 20px;">Choose a training scenario to begin your investigation:</p>
                    ${scenarios.map(scenario => `
                        <div style="margin-bottom: 12px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                             onclick="selectScenarioFromModal('${scenario.id}')"
                             onmouseover="this.style.background='#f7fafc'; this.style.borderColor='#4299e1';"
                             onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0';">
                            <div style="font-weight: 600; color: #1a202c; margin-bottom: 4px;">${scenario.name}</div>
                            <div style="font-size: 12px; color: #718096; margin-bottom: 8px;">${scenario.characters.length} staff members to interview</div>
                            <div style="color: #4a5568; font-size: 14px;">${scenario.description || 'No description provided'}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            const footer = `<button data-secondary onclick="hideModal()">Cancel</button>`;
            showModal('Select Training Scenario', content, footer);
        })
        .catch(error => {
            console.error('Error loading scenarios:', error);
            showAlert('Error loading scenarios', 'error');
        });
}

// Select scenario from modal
function selectScenarioFromModal(scenarioId) {
    hideModal();
    selectScenario(scenarioId);
}

// Clear all conversations
async function clearAllConversations() {
    if (!confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) return;
    
    try {
        const response = await fetch('/api/conversations/clear', {
            method: 'POST'
        });
        
        if (response.ok) {
            state.allMessages = [];
            state.currentStaff = null;
            renderStaffList();
            renderChatArea();
            showAlert('All conversations have been cleared successfully.', 'success');
        } else {
            showAlert('Failed to clear conversations', 'error');
        }
    } catch (error) {
        console.error('Error clearing conversations:', error);
        showAlert('Error clearing conversations', 'error');
    }
}

// Initialize interface
function initializeInterface() {
    updateScenarioHeader();
    renderStaffList();
    renderChatArea();
}

// Modal functions
function showModal(title, content, footer = '') {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div data-modal data-active>
            <div>
                <header>
                    <h3>${title}</h3>
                </header>
                <div class="body">
                    ${content}
                </div>
                ${footer ? `<footer>${footer}</footer>` : ''}
            </div>
        </div>
    `;
}

function hideModal() {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = '';
}

// Alert system
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    if (type === 'success') {
        alert.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        alert.style.color = 'white';
    } else if (type === 'error') {
        alert.style.background = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
        alert.style.color = 'white';
    } else {
        alert.style.background = 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)';
        alert.style.color = 'white';
    }
    
    alert.textContent = message;
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-modal')) {
        hideModal();
    }
});