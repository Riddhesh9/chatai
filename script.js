// Simulated database using localStorage
const db = {
    chats: JSON.parse(localStorage.getItem('chats')) || [],
    saveChat: function(chat) {
        const index = this.chats.findIndex(c => c.id === chat.id);
        if (index !== -1) {
            this.chats[index] = chat;
        } else {
            this.chats.push(chat);
        }
        localStorage.setItem('chats', JSON.stringify(this.chats));
    },
    deleteChat: function(chatId) {
        this.chats = this.chats.filter(c => c.id !== chatId);
        localStorage.setItem('chats', JSON.stringify(this.chats));
    },
    getChats: function() {
        return this.chats;
    }
};

// DOM Elements
const chatList = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat');
const messages = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const contextPanel = document.getElementById('context-panel');
const highlightedText = document.getElementById('highlighted-text');
const contextForm = document.getElementById('context-form');
const contextInput = document.getElementById('context-input');
const contextList = document.getElementById('context-list');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const mainCharLimit = document.getElementById('main-char-limit');
const mainCharLimitValue = document.getElementById('main-char-limit-value');
const contextCharLimit = document.getElementById('context-char-limit');
const contextCharLimitValue = document.getElementById('context-char-limit-value');

// OpenAI API Key (replace with your actual key)
const OPENAI_API_KEY = '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';

// Current chat ID
let currentChatId = null;

// Function to create a new chat
function createNewChat() {
    const chatId = Date.now().toString();
    const chat = { id: chatId, name: `Chat ${chatId}`, messages: [], contextualQuestions: [] };
    db.saveChat(chat);
    currentChatId = chatId;
    renderChatList();
    renderMessages();
    renderContextualQuestions();
}

// Function to render chat list
function renderChatList() {
    chatList.innerHTML = '';
    db.getChats().forEach(chat => {
        const li = document.createElement('li');
        const chatName = document.createElement('span');
        chatName.textContent = chat.name;
        chatName.className = 'chat-name';
        chatName.onclick = () => loadChat(chat.id);
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.className = 'edit-chat';
        editBtn.onclick = (event) => editChatName(chat, event);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.className = 'delete-chat';
        deleteBtn.onclick = (event) => deleteChat(chat.id, event);
        
        li.appendChild(chatName);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        chatList.appendChild(li);
    });
}

// Function to load a chat
function loadChat(chatId) {
    currentChatId = chatId;
    renderMessages();
    renderContextualQuestions();
}

// Function to edit chat name
function editChatName(chat, event) {
    event.stopPropagation();
    const li = event.target.closest('li');
    const chatName = li.querySelector('.chat-name');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = chat.name;
    input.className = 'rename-input';
    input.onblur = () => {
        chat.name = input.value;
        db.saveChat(chat);
        renderChatList();
    };
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    };
    li.replaceChild(input, chatName);
    input.focus();
}

// Function to delete a chat
function deleteChat(chatId, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
        db.deleteChat(chatId);
        if (currentChatId === chatId) {
            currentChatId = null;
            messages.innerHTML = '';
            contextList.innerHTML = '';
        }
        renderChatList();
    }
}

// Function to render messages
function renderMessages() {
    messages.innerHTML = '';
    const chat = db.getChats().find(c => c.id === currentChatId);
    if (chat) {
        chat.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${msg.role}`;
            messageEl.innerHTML = msg.content;
            messageEl.addEventListener('mouseup', handleTextSelection);
            messages.appendChild(messageEl);
        });
        messages.scrollTop = messages.scrollHeight;
    }
}

// Function to render contextual questions
function renderContextualQuestions() {
    contextList.innerHTML = '';
    const chat = db.getChats().find(c => c.id === currentChatId);
    if (chat && chat.contextualQuestions) {
        chat.contextualQuestions.forEach((question, index) => {
            const li = document.createElement('li');
            const questionSpan = document.createElement('span');
            questionSpan.textContent = question.text;
            questionSpan.className = 'context-question';
            questionSpan.onclick = () => toggleCommentBox(li, question.answer, question.highlightedText);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'context-actions';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.className = 'edit-context';
            editBtn.onclick = (event) => editContextQuestion(chat, index, event);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.className = 'delete-context';
            deleteBtn.onclick = (event) => deleteContextQuestion(chat, index, event);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            li.appendChild(questionSpan);
            li.appendChild(actionsDiv);
            contextList.appendChild(li);
        });
    }
}

// Function to edit context question
function editContextQuestion(chat, index, event) {
    event.stopPropagation();
    const li = event.target.closest('li');
    const questionSpan = li.querySelector('.context-question');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = chat.contextualQuestions[index].text;
    input.className = 'edit-input';
    input.onblur = () => {
        chat.contextualQuestions[index].text = input.value;
        db.saveChat(chat);
        renderContextualQuestions();
    };
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    };
    li.replaceChild(input, questionSpan);
    input.focus();
}

// Function to delete context question
function deleteContextQuestion(chat, index, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this question?')) {
        chat.contextualQuestions.splice(index, 1);
        db.saveChat(chat);
        renderContextualQuestions();
        removeHighlight(chat.contextualQuestions[index].highlightedText);
    }
}

// Function to handle text selection
function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
        highlightedText.textContent = selectedText;
        contextPanel.style.display = 'block';
    }
}

// Function to toggle comment box
function toggleCommentBox(element, answer, highlightedText) {
    const existingCommentBox = element.nextElementSibling;
    if (existingCommentBox && existingCommentBox.classList.contains('comment-box')) {
        existingCommentBox.classList.toggle('show');
    } else {
        const commentBox = document.createElement('div');
        commentBox.className = 'comment-box show';
        commentBox.innerHTML = `<strong>Highlighted Text:</strong> ${highlightedText}<br><br><strong>Answer:</strong> ${answer}`;
        element.parentNode.insertBefore(commentBox, element.nextSibling);
    }
}

// Function to send message to OpenAI API
async function sendMessageToOpenAI(chat, charLimit) {
    const conversationHistory = chat.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));

    // Append the character limit instruction to the last message
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    lastMessage.content += `\n\nPlease answer in maximum ${charLimit} characters.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: conversationHistory
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

// Function to highlight text in the main pane
function highlightText(text) {
    const range = window.getSelection().getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'highlighted';
    span.textContent = text;
    range.deleteContents();
    range.insertNode(span);
}

// Function to remove highlight from text
function removeHighlight(text) {
    const highlightedSpans = messages.querySelectorAll('.highlighted');
    highlightedSpans.forEach(span => {
        if (span.textContent === text) {
            const parent = span.parentNode;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize();
        }
    });
}

// Event Listeners
newChatBtn.addEventListener('click', createNewChat);

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (message) {
        const chat = db.getChats().find(c => c.id === currentChatId);
        chat.messages.push({ role: 'user', content: message });
        db.saveChat(chat);
        renderMessages();
        userInput.value = '';

        const charLimit = parseInt(mainCharLimit.value);
        const response = await sendMessageToOpenAI(chat, charLimit);
        chat.messages.push({ role: 'assistant', content: response });
        db.saveChat(chat);
        renderMessages();
    }
});

contextForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = contextInput.value.trim();
    const selectedText = highlightedText.textContent;
    if (question && selectedText) {
        const chat = db.getChats().find(c => c.id === currentChatId);
        const message = `Context: "${selectedText}"\nQuestion: ${question}`;
        chat.messages.push({ role: 'user', content: message });
        const charLimit = parseInt(contextCharLimit.value);
        const answer = await sendMessageToOpenAI(chat, charLimit);
        chat.messages.push({ role: 'assistant', content: answer });
        chat.contextualQuestions.push({ text: question, answer: answer, highlightedText: selectedText });
        db.saveChat(chat);
        renderContextualQuestions();
        contextInput.value = '';
        highlightedText.textContent = '';
        highlightText(selectedText);
    }
});

darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkModeToggle.checked);
    updateDarkModeToggle();
});

// Character limit slider event listeners
mainCharLimit.addEventListener('input', () => {
    mainCharLimitValue.textContent = mainCharLimit.value;
});

contextCharLimit.addEventListener('input', () => {
    contextCharLimitValue.textContent = contextCharLimit.value;
});

// Add hover functionality to highlighted text
messages.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('highlighted')) {
        const highlightedText = e.target.textContent;
        const chat = db.getChats().find(c => c.id === currentChatId);
        const relatedQuestions = chat.contextualQuestions.filter(q => q.highlightedText === highlightedText);
        if (relatedQuestions.length > 0) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.innerHTML = '<strong>Related Questions:</strong><br>' + relatedQuestions.map(q => q.text).join('<br>');
            e.target.appendChild(tooltip);
        }
    }
});

messages.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('highlighted')) {
        const tooltip = e.target.querySelector('.tooltip');
        if (tooltip) {
            e.target.removeChild(tooltip);
        }
    }
});

// Function to update dark mode toggle
function updateDarkModeToggle() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    darkModeToggle.checked = isDarkMode;
    darkModeToggle.nextElementSibling.textContent = isDarkMode ? 'Dark' : 'Light';
}

// Initialize
createNewChat();
renderChatList();

// Load dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
}
updateDarkModeToggle();
