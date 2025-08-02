class ChatbotAPI {
    constructor(apiUrl, apiKey = null, collectionName = 'default') {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.collectionName = collectionName;
        this.conversationHistory = [];
    }

    async sendMessage(message) {
        try {
            this.conversationHistory.push({ role: 'user', content: message });

            const headers = {
                'Content-Type': 'application/json',
            };

            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    query: message,
                    collection_name: this.collectionName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle the response - assuming it returns a string as shown in the API docs
            let botResponse;
            if (typeof data === 'string') {
                botResponse = data;
            } else if (data.response) {
                botResponse = data.response;
            } else if (data.message) {
                botResponse = data.message;
            } else if (data.answer) {
                botResponse = data.answer;
            } else if (data.result) {
                botResponse = data.result;
            } else {
                botResponse = 'Sorry, I received an unexpected response format.';
            }

            this.conversationHistory.push({ role: 'assistant', content: botResponse });
            return botResponse;

        } catch (error) {
            console.error('API Error:', error);
            return 'Sorry, I\'m having trouble connecting right now. Please try again later.';
        }
    }

    // Method to update collection name if needed
    setCollectionName(collectionName) {
        this.collectionName = collectionName;
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}

class ChatbotDOMGenerator {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        
        // Initialize API - Replace with your actual API URL and configuration
        this.api = new ChatbotAPI(
            '/api/v1/chatbot/ask', // Updated to use the vector database endpoint
            null, // API key (optional)
            'default' // Collection name - change this to your collection
        );
        
        this.createStyles();
        this.createChatbot();
        this.attachEventListeners();
    }

    createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                z-index: 1000;
                transform: translateY(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                visibility: hidden;
            }

            .chatbot-container.open {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }

            .chat-header {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 20px 20px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-title {
                font-weight: 600;
                font-size: 1.1rem;
                margin: 0;
            }

            .close-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            .chat-messages {
                height: 300px;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }

            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chat-messages::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }

            .chat-messages::-webkit-scrollbar-thumb {
                background: #e74c3c;
                border-radius: 10px;
            }

            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: #c0392b;
            }

            .message {
                margin-bottom: 15px;
                display: flex;
                animation: slideIn 0.3s ease-out;
            }

            .message.user {
                justify-content: flex-end;
            }

            .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
                white-space: pre-wrap;
            }

            .message.bot .message-content {
                background: #e9ecef;
                color: #333;
                border-bottom-left-radius: 6px;
            }

            .message.user .message-content {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                color: white;
                border-bottom-right-radius: 6px;
            }

            .typing-indicator {
                display: none;
                padding: 12px 16px;
                background: #e9ecef;
                border-radius: 18px;
                border-bottom-left-radius: 6px;
                max-width: 80%;
                margin-bottom: 15px;
            }

            .typing-dots {
                display: flex;
                gap: 4px;
            }

            .typing-dots span {
                width: 8px;
                height: 8px;
                background: #666;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }

            .typing-dots span:nth-child(2) { 
                animation-delay: 0.2s; 
            }
            
            .typing-dots span:nth-child(3) { 
                animation-delay: 0.4s; 
            }

            .chat-input-container {
                padding: 20px;
                border-top: 1px solid #e9ecef;
                background: white;
                border-radius: 0 0 20px 20px;
            }

            .chat-input-wrapper {
                display: flex;
                gap: 10px;
                align-items: center;
                background: #f8f9fa;
                border-radius: 25px;
                padding: 8px 15px;
                border: 2px solid transparent;
                transition: border-color 0.2s;
            }

            .chat-input-wrapper:focus-within {
                border-color: #e74c3c;
            }

            .chat-input {
                flex: 1;
                border: none;
                outline: none;
                background: transparent;
                font-size: 14px;
                padding: 8px 0;
                font-family: inherit;
            }

            .send-btn {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s;
            }

            .send-btn:hover {
                transform: scale(1.05);
            }

            .send-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .chat-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 10px 25px rgba(231, 76, 60, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 1;
                visibility: visible;
                transform: scale(1);
            }

            .chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 15px 35px rgba(231, 76, 60, 0.6);
            }

            .chat-toggle.hidden {
                opacity: 0;
                visibility: hidden;
                transform: scale(0);
                pointer-events: none;
            }

            .collection-info {
                font-size: 12px;
                color: rgba(255,255,255,0.8);
                margin-top: 2px;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes typing {
                0%, 60%, 100% { 
                    transform: translateY(0); 
                }
                30% { 
                    transform: translateY(-10px); 
                }
            }

            @media (max-width: 768px) {
                .chatbot-container {
                    width: calc(100vw - 20px);
                    right: 10px;
                    bottom: 10px;
                }
                
                .chat-toggle {
                    right: 10px;
                    bottom: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    createChatbot() {
        // Create toggle button
        this.chatToggle = document.createElement('button');
        this.chatToggle.className = 'chat-toggle';
        this.chatToggle.innerHTML = '💬';
        this.chatToggle.setAttribute('aria-label', 'Open chatbot');
        document.body.appendChild(this.chatToggle);

        // Create chatbot container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chatbot-container';

        // Create header
        const header = document.createElement('div');
        header.className = 'chat-header';

        const titleContainer = document.createElement('div');
        
        const title = document.createElement('div');
        title.className = 'chat-title';
        title.textContent = 'Chatbot';
        
        // const collectionInfo = document.createElement('div');
        // collectionInfo.className = 'collection-info';
        // collectionInfo.textContent = `Collection: ${this.api.collectionName}`;

        titleContainer.appendChild(title);
        // titleContainer.appendChild(collectionInfo);

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'close-btn';
        this.closeBtn.innerHTML = 'x';
        this.closeBtn.setAttribute('aria-label', 'Close chatbot');

        header.appendChild(titleContainer);
        header.appendChild(this.closeBtn);

        // Create messages container
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'chat-messages';

        // Add initial message
        this.addMessage('Hi! I\'m your AI Assistant. What would you like to know?', 'bot');

        // Create typing indicator
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        
        const typingDots = document.createElement('div');
        typingDots.className = 'typing-dots';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingDots.appendChild(dot);
        }
        
        this.typingIndicator.appendChild(typingDots);
        this.chatMessages.appendChild(this.typingIndicator);

        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'chat-input-container';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'chat-input-wrapper';

        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.className = 'chat-input';
        this.chatInput.placeholder = 'Ask me anything about your knowledge base...';

        this.sendBtn = document.createElement('button');
        this.sendBtn.className = 'send-btn';
        this.sendBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
        `;
        this.sendBtn.disabled = true;

        inputWrapper.appendChild(this.chatInput);
        inputWrapper.appendChild(this.sendBtn);
        inputContainer.appendChild(inputWrapper);

        // Assemble chatbot
        this.chatContainer.appendChild(header);
        this.chatContainer.appendChild(this.chatMessages);
        this.chatContainer.appendChild(inputContainer);

        document.body.appendChild(this.chatContainer);
    }

    attachEventListeners() {
        this.chatToggle.addEventListener('click', () => this.openChat());
        this.closeBtn.addEventListener('click', () => this.closeChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.chatInput.addEventListener('input', () => {
            this.sendBtn.disabled = this.chatInput.value.trim() === '';
        });
    }

    openChat() {
        this.isOpen = true;
        this.chatContainer.classList.add('open');
        this.chatToggle.classList.add('hidden');
        setTimeout(() => {
            this.chatInput.focus();
        }, 300);
    }

    closeChat() {
        this.isOpen = false;
        this.chatContainer.classList.remove('open');
        // Wait for the chat container to finish closing animation before showing the button
        setTimeout(() => {
            this.chatToggle.classList.remove('hidden');
        }, 300);
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (message === '' || this.isTyping) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.sendBtn.disabled = true;
        
        // Show typing indicator
        this.showTyping();
        
        try {
            // Send message to API
            const response = await this.api.sendMessage(message);
            
            // Hide typing indicator and show response
            this.hideTyping();
            this.addMessage(response, 'bot');
            
        } catch (error) {
            this.hideTyping();
            this.addMessage('Sorry, something went wrong while searching the knowledge base. Please try again.', 'bot');
        }
        
        this.chatInput.focus();
    }

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content;
        
        messageDiv.appendChild(contentDiv);
        
        // Insert before typing indicator
        this.chatMessages.insertBefore(messageDiv, this.typingIndicator);
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showTyping() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'block';
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }

    // Method to change collection if needed
    changeCollection(collectionName) {
        this.api.setCollectionName(collectionName);
        const collectionInfo = document.querySelector('.collection-info');
        if (collectionInfo) {
            collectionInfo.textContent = `Collection: ${collectionName}`;
        }
    }
}

// Initialize the chatbot when DOM is ready
function initializeChatbot(config = {}) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const chatbot = new ChatbotDOMGenerator();
            
            // Apply custom configuration if provided
            if (config.collectionName) {
                chatbot.changeCollection(config.collectionName);
            }
            if (config.apiUrl) {
                chatbot.api.apiUrl = config.apiUrl;
            }
            if (config.apiKey) {
                chatbot.api.apiKey = config.apiKey;
            }
        });
    } else {
        const chatbot = new ChatbotDOMGenerator();
        
        // Apply custom configuration if provided
        if (config.collectionName) {
            chatbot.changeCollection(config.collectionName);
        }
        if (config.apiUrl) {
            chatbot.api.apiUrl = config.apiUrl;
        }
        if (config.apiKey) {
            chatbot.api.apiKey = config.apiKey;
        }
        
        return chatbot;
    }
}
